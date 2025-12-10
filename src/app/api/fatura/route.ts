import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/apiError";
import { dispatchEmail, renderEmailTemplate } from "@/lib/mailer";
import * as bcrypt from "bcryptjs";

// Generate random temporary password
function generateTempPassword(length = 12): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Standardized invoice list
export async function GET(req: NextRequest) {
  try {
    // Import permission helpers
    const { getUserWithPermissions, userHasPermission } = await import("@/lib/apiAuth");

    // Check authentication and get user info
    const user = await getUserWithPermissions(req);
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    // Check read permission
    if (!userHasPermission(user, "fatura:read")) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const status = searchParams.get("status") || "";
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const dueOnly = searchParams.get("dueOnly") === "1";
    const sortBy = (searchParams.get("sortBy") || "date") as "date" | "amount";
    const sortDir = (searchParams.get("sortDir") || "desc") as "asc" | "desc";
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") || 20)));

    // Calculate due date threshold (7 days from now)
    const dueDateThreshold = new Date();
    dueDateThreshold.setDate(dueDateThreshold.getDate() + 7);

    const where: any = {
      AND: [
        q
          ? {
            OR: [
              { number: { contains: q, mode: "insensitive" } },
              { orderNo: { contains: q, mode: "insensitive" } },
            ],
          }
          : {},
        status ? { status } : {},
        dateFrom || dateTo
          ? {
            createdAt: {
              gte: dateFrom ? new Date(dateFrom) : undefined,
              lte: dateTo ? new Date(dateTo) : undefined,
            },
          }
          : {},
        dueOnly
          ? {
            status: "Bekliyor",
            dueDate: { lte: dueDateThreshold },
          }
          : {},
      ],
    };

    // Unit-based data isolation for non-admin users
    // If not admin and has unit, filter invoices where the related order's request belongs to the user's unit
    if (!user.isAdmin && user.unitId) {
      // Find orders that belong to user's unit
      // This is a bit complex relation: Invoice -> Order -> Request -> Unit
      // We can use nested filtering in where clause
      where.AND.push({
        order: {
          request: {
            unitId: user.unitId
          }
        }
      });
    }

    const orderBy =
      sortBy === "amount"
        ? ({ amount: sortDir } as any)
        : ({ createdAt: sortDir } as any);

    const [itemsRaw, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          order: {
            include: {
              supplier: true,
              company: true // Assuming order implies company relation exists
            }
          }
        }
      }),
      prisma.invoice.count({ where }),
    ]);

    const items = itemsRaw.map((item: any) => ({
      ...item,
      companyName: item.order?.company?.name || "-",
      supplierName: item.order?.supplier?.name || "-",
      // Use createdAt as invoice date if no specific date field exists. 
      // If there is an invoiceDate field in schema, it should be used here.
      date: item.createdAt,
    }));

    return NextResponse.json({ items, total, page, pageSize });
  } catch (e: any) {
    return jsonError(500, "server_error", { message: e?.message });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Import permission helpers
    const { getUserWithPermissions, userHasPermission } = await import("@/lib/apiAuth");

    // Check authentication and get user info
    const user = await getUserWithPermissions(req);
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    // Check create permission
    if (!userHasPermission(user, "fatura:create")) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    const body = await req.json().catch(() => ({}));
    const number = String(body?.number || "").trim();
    const orderNo = String(body?.orderNo || "").trim();
    const amount = Number(body?.amount);
    const dueDateRaw = body?.dueDate;
    const dueDate = dueDateRaw ? new Date(dueDateRaw) : null;
    const status = String(body?.status || "Beklemede").trim();
    const bank = body?.bank ? String(body.bank).trim() : null;
    const orderId = body?.orderId ?? null;
    const items = Array.isArray(body?.items) ? body.items : [];
    const vatRate = typeof body?.vatRate === "number" ? body.vatRate : undefined;
    const withholdingCode = typeof body?.withholdingCode === "string" ? String(body.withholdingCode).trim() || undefined : undefined;
    const responsibleUserId = typeof body?.responsibleUserId === "string" ? String(body.responsibleUserId).trim() || null : null;

    const details: string[] = [];
    if (!number) details.push("number_required");
    if (!orderNo) details.push("orderNo_required");
    if (!Number.isFinite(amount)) details.push("invalid_amount");
    if (!dueDate || isNaN(dueDate.getTime())) details.push("invalid_dueDate");
    if (!status) details.push("status_required");
    if (details.length) return jsonError(400, "invalid_payload", { details });

    try {
      const created = await prisma.invoice.create({
        data: {
          number,
          orderNo,
          amount: Number(amount),
          dueDate: dueDate as Date,
          status,
          bank,
          vatRate,
          withholdingCode,
          ...(orderId ? { order: { connect: { id: String(orderId) } } } : {}),
          ...(responsibleUserId ? { responsible: { connect: { id: responsibleUserId } } } : {}),
          items: items && items.length > 0 ? {
            create: items.map((it: any) => ({
              name: String(it?.name || "Kalem"),
              quantity: Number(it?.quantity || 0),
              unitPrice: Number(it?.unitPrice || 0),
              taxRate: typeof it?.taxRate === "number" ? it.taxRate : vatRate,
            })),
          } : undefined,
        },
        include: { items: true },
      });

      // Update order status to "Faturalandı" and send evaluation request email
      if (orderId) {
        try {
          // Find "Tamamlandı" status
          const tamamlandiStatus = await prisma.optionItem.findFirst({
            where: {
              category: { key: "siparisDurumu" },
              label: { contains: "Tamamlandı", mode: "insensitive" },
            },
          });
          if (tamamlandiStatus) {
            await prisma.order.update({
              where: { id: String(orderId) },
              data: { statusId: tamamlandiStatus.id },
            });
          }

          // Send evaluation request email to unit
          const order = await prisma.order.findUnique({
            where: { id: String(orderId) },
            include: {
              request: { include: { unit: true, owner: true } },
              supplier: true,
              responsible: true,
            },
          });

          if (order) {
            const origin = req.nextUrl.origin;
            const evaluationLink = `${origin}/tedarikci/degerlendirme?orderId=${encodeURIComponent(order.id)}`;
            const unitLabel = order.request?.unit?.label || "";
            const unitEmail = (order.request?.unit as any)?.email || order.request?.unitEmail;
            const supplierName = order.supplier?.name || "Tedarikçi";

            // Auto-create user account for unit email if it doesn't exist
            if (unitEmail) {
              const existingUser = await prisma.user.findUnique({ where: { email: String(unitEmail) } });
              if (!existingUser) {
                try {
                  const tempPassword = generateTempPassword();
                  const passwordHash = await bcrypt.hash(tempPassword, 10);
                  // Use unit label as username (e.g., "Satınalma Müdürlüğü")
                  const safeUnitLabel = unitLabel.replace(/[^a-zA-ZğüşıöçĞÜŞİÖÇ0-9\s]/g, "").trim() || String(unitEmail).split("@")[0];
                  const username = safeUnitLabel;

                  await prisma.user.create({
                    data: {
                      username,
                      email: String(unitEmail),
                      passwordHash,
                      passwordHash,
                      role: "birim_evaluator",
                    },
                  });

                  // Send welcome email with credentials
                  const welcomeHtml = renderEmailTemplate("generic", {
                    title: "Satınalma Pro - Hesabınız Oluşturuldu",
                    body: `<p>Merhaba,</p>
                           <p>Tedarikçi değerlendirmesi yapabilmeniz için hesabınız oluşturulmuştur.</p>
                           <table style="width:100%;border-collapse:collapse;margin:16px 0;background:#f8fafc;border-radius:8px;padding:16px;">
                             <tr><td style="padding:8px;color:#64748b;">Kullanıcı Adı:</td><td style="padding:8px;font-weight:600;">${username}</td></tr>
                             <tr><td style="padding:8px;color:#64748b;">E-posta:</td><td style="padding:8px;font-weight:600;">${unitEmail}</td></tr>
                             <tr><td style="padding:8px;color:#64748b;">Geçici Şifre:</td><td style="padding:8px;font-weight:600;color:#dc2626;">${tempPassword}</td></tr>
                           </table>
                           <p style="color:#ef4444;font-weight:500;">⚠️ Güvenliğiniz için ilk girişte şifrenizi değiştirmenizi öneririz.</p>`,
                    actionUrl: `${origin}/login`,
                    actionText: "Giriş Yap",
                  });
                  await dispatchEmail({
                    to: String(unitEmail),
                    subject: "Satınalma Pro - Hesabınız Oluşturuldu",
                    html: welcomeHtml,
                    category: "welcome",
                  });
                  console.log(`Created birim_evaluator account for: ${unitEmail}`);
                } catch (userErr) {
                  console.error("Failed to create unit user account:", userErr);
                }
              }
            }

            const targets: string[] = [];
            if (unitEmail) targets.push(String(unitEmail));
            if (order.request?.owner?.email) targets.push(String(order.request.owner.email));
            if (order.responsible?.email) targets.push(String(order.responsible.email));

            if (targets.length > 0) {
              const fields = [
                { label: "Sipariş No", value: order.barcode },
                { label: "Fatura No", value: number },
                { label: "Tedarikçi", value: supplierName },
                ...(unitLabel ? [{ label: "Birim", value: unitLabel }] : []),
                { label: "Tutar", value: `${amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL` },
              ];

              const html = renderEmailTemplate("generic", {
                title: "Tedarikçi Değerlendirmesi Bekleniyor",
                body: `<p>Aşağıdaki sipariş için fatura kesilmiştir. Lütfen tedarikçinin performansını değerlendirin.</p>
                       <table style="width:100%;border-collapse:collapse;margin:16px 0;">
                         ${fields.map(f => `<tr><td style="padding:8px;border-bottom:1px solid #e2e8f0;color:#64748b;">${f.label}</td><td style="padding:8px;border-bottom:1px solid #e2e8f0;font-weight:600;">${f.value}</td></tr>`).join("")}
                       </table>`,
                actionUrl: evaluationLink,
                actionText: "Değerlendirmeyi Başlat",
              });

              const subject = `Tedarikçi Değerlendirmesi: ${order.barcode} - ${supplierName}`;
              for (const to of Array.from(new Set(targets)).filter(Boolean)) {
                await dispatchEmail({ to, subject, html, category: "evaluation_request" });
              }
            }
          }
        } catch (emailErr) {
          // Email failure should not block invoice creation
          console.error("Evaluation email failed:", emailErr);
        }
      }

      return NextResponse.json(created, { status: 201 });
    } catch (e: any) {
      const msg = String(e?.message || "");
      // Check for duplicate invoice number
      if (msg.includes("Unique constraint failed") && msg.includes("number")) {
        return jsonError(409, "duplicate_invoice_number", {
          message: "Bu fatura numarası zaten kullanılıyor. Lütfen farklı bir fatura numarası girin."
        });
      }
      const unknownVat = msg.includes("Unknown argument `vatRate`") || msg.includes("Unknown argument `withholdingCode`");
      if (unknownVat) {
        try {
          const created = await prisma.invoice.create({
            data: {
              number,
              orderNo,
              amount: Number(amount),
              dueDate: dueDate as Date,
              status,
              bank,
              ...(orderId ? { order: { connect: { id: String(orderId) } } } : {}),
              ...(responsibleUserId ? { responsible: { connect: { id: responsibleUserId } } } : {}),
              items: items && items.length > 0 ? {
                create: items.map((it: any) => ({
                  name: String(it?.name || "Kalem"),
                  quantity: Number(it?.quantity || 0),
                  unitPrice: Number(it?.unitPrice || 0),
                  taxRate: typeof it?.taxRate === "number" ? it.taxRate : undefined,
                })),
              } : undefined,
            },
            include: { items: true },
          });
          return NextResponse.json(created, { status: 201 });
        } catch (e2: any) {
          return jsonError(500, "invoice_create_failed", { message: e2?.message });
        }
      }
      return jsonError(500, "invoice_create_failed", { message: e?.message });
    }
  } catch (e: any) {
    const code = e?.code;
    if (code === "P2002") {
      return jsonError(409, "duplicate_number");
    }
    return jsonError(500, "invoice_create_failed", { message: e?.message });
  }
}
