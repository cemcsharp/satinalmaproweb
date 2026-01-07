import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/apiError";
import { requirePermissionApi } from "@/lib/apiAuth";
import { dispatchEmail, renderEmailTemplate } from "@/lib/mailer";
import { logAuditWithRequest } from "@/lib/auditLogger";
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
/**
 * @swagger
 * /api/fatura:
 *   get:
 *     summary: Fatura listesini getirir
 *     description: Filtreleme, sıralama ve sayfalama destekli fatura listesi. Birim bazlı veri izolasyonu içerir.
 *     tags: [Fatura]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Fatura no veya Sipariş no içinde arama yapar
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Duruma göre filtreler (Örn. Bekliyor, Ödendi)
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dueOnly
 *         schema:
 *           type: string
 *           enum: ["1", "0"]
 *         description: "1 ise sadece ödeme tarihi yaklaşanları (7 gün) getirir"
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [date, amount]
 *       - in: query
 *         name: sortDir
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Fatura listesi başarıyla getirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Invoice'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 pageSize:
 *                   type: integer
 *       403:
 *         description: Yetkisiz erişim
 */
export async function GET(req: NextRequest) {
  try {
    // Permission check: fatura:read required
    const user = await requirePermissionApi(req, "fatura:read");
    if (!user) return jsonError(403, "forbidden", { message: "Fatura görüntüleme yetkiniz yok." });

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

/**
 * @swagger
 * /api/fatura:
 *   post:
 *     summary: Yeni fatura oluşturur
 *     description: Fatura oluşturur, ilgili sipariş durumunu günceller ve değerlendirme e-postası gönderir.
 *     tags: [Fatura]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - number
 *               - orderNo
 *               - amount
 *               - dueDate
 *               - status
 *             properties:
 *               number:
 *                 type: string
 *                 description: Fatura numarası
 *               orderNo:
 *                 type: string
 *                 description: Sipariş numarası
 *               amount:
 *                 type: number
 *               dueDate:
 *                 type: string
 *                 format: date
 *               status:
 *                 type: string
 *               bank:
 *                 type: string
 *               orderId:
 *                 type: string
 *               vatRate:
 *                 type: number
 *               withholdingCode:
 *                 type: string
 *               responsibleUserId:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name: { type: string }
 *                     quantity: { type: number }
 *                     unitPrice: { type: number }
 *                     taxRate: { type: number }
 *     responses:
 *       201:
 *         description: Fatura başarıyla oluşturuldu
 *       400:
 *         description: Geçersiz veri
 *       409:
 *         description: Mükerrer fatura numarası
 */
export async function POST(req: NextRequest) {
  try {
    // Permission check: fatura:create required
    const user = await requirePermissionApi(req, "fatura:create");
    if (!user) return jsonError(403, "forbidden", { message: "Fatura oluşturma yetkiniz yok." });

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

            // Auto-create user account logic removed - moved to Request phase
            // if (unitEmail) { ... }

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

      // Audit log for invoice creation
      await logAuditWithRequest(req, {
        userId: user.id,
        action: "CREATE",
        entityType: "Invoice",
        entityId: created.id,
        newData: { number: created.number, orderNo: created.orderNo, amount: created.amount },
      });

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
