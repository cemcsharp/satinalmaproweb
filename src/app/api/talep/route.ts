import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/apiError";
import { requirePermissionApi } from "@/lib/apiAuth";
import { notify } from "@/lib/notification-service";
import { dispatchEmail, renderEmailTemplate } from "@/lib/mailer";
import { logAuditWithRequest } from "@/lib/auditLogger";

type CreateRequestBody = {
  barcode: string;
  subject: string;
  justification?: string;
  budget: number;
  relatedPersonId: string;
  unitId: string;
  statusId: string;
  currencyId: string;
  unitEmail?: string;
  items: {
    name: string;
    quantity: number;
    unitId: string;
    unitPrice?: number;
    productId?: string;
    sku?: string;
    categoryId?: string
  }[];
};

function generateTempPassword(length = 12): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

/**
 * @swagger
 * /api/talep:
 *   post:
 *     summary: Yeni satın alma talebi oluştur
 *     description: Yeni bir satın alma talebi oluşturur, kalemleri ekler ve ilgili kişilere bildirim gönderir.
 *     tags:
 *       - Request
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - barcode
 *               - subject
 *               - budget
 *               - relatedPersonId
 *               - unitId
 *               - statusId
 *               - currencyId
 *             properties:
 *               barcode: { type: 'string', description: 'Benzersiz talep barkodu' }
 *               subject: { type: 'string', description: 'Talep konusu' }
 *               justification: { type: 'string', description: 'Talep gerekçesi' }
 *               budget: { type: 'number', description: 'Tahmini bütçe' }
 *               relatedPersonId: { type: 'string', description: 'İlgili kişi ID' }
 *               unitId: { type: 'string', description: 'Birim ID' }
 *               statusId: { type: 'string', description: 'Başlangıç durum ID' }
 *               currencyId: { type: 'string', description: 'Para birimi ID' }
 *               unitEmail: { type: 'string', description: 'Birim e-posta adresi (otomatik hesap açılışı için)' }
 *               items:
 *                 type: 'array',
 *                 items:
 *                   type: 'object',
 *                   required: [name, quantity, unitId]
 *                   properties:
 *                     name: { type: 'string' }
 *                     quantity: { type: 'number' }
 *                     unitId: { type: 'string' }
 *                     unitPrice: { type: 'number' }
 *     responses:
 *       201:
 *         description: Talep başarıyla oluşturuldu
 *       400:
 *         description: Eksik alanlar veya geçersiz veri
 *       403:
 *         description: Yetkisiz erişim
 *       409:
 *         description: Barkod çakışması
 */
export async function POST(req: NextRequest) {
  try {
    // Permission check: talep:create required
    const user = await requirePermissionApi(req, "talep:create");
    if (!user) return jsonError(403, "forbidden", { message: "Talep oluşturma yetkiniz yok." });

    const body = (await req.json()) as CreateRequestBody;
    if (!body?.barcode || !body.subject || !body.budget || !body.relatedPersonId || !body.unitId || !body.statusId || !body.currencyId) {
      return jsonError(400, "missing_fields");
    }
    const existing = await prisma.request.findUnique({ where: { barcode: body.barcode.trim() } });
    if (existing) return jsonError(409, "duplicate_barcode");

    const unitEmail = typeof body.unitEmail === "string" ? body.unitEmail.trim() : "";
    if (unitEmail && !/^\S+@\S+\.\S+$/.test(unitEmail)) {
      return jsonError(400, "invalid_unitEmail");
    }

    // Enforce Unit Isolation: User can only create requests for their own unit
    // Exception: Admins AND Satinalma unit can create for any unit
    const targetUnitId = body.unitId;
    const unitLabelClean = (user.unitLabel || "").toLocaleLowerCase("tr-TR").replace(/\s/g, "");
    const isSatinalma = unitLabelClean.includes("satınalma") || unitLabelClean.includes("satinlama");
    const isOwnerOrAdmin = user.isAdmin || isSatinalma;

    if (!isOwnerOrAdmin) {
      if (!user.unitId) {
        return jsonError(403, "user_has_no_unit", { message: "Birime atanmamış kullanıcılar talep oluşturamaz." });
      }
      if (targetUnitId !== user.unitId) {
        return jsonError(403, "unit_mismatch", { message: "Sadece kendi biriminiz adına talep oluşturabilirsiniz." });
      }
    }

    let created;
    try {
      // Phase 3: Budget Reservation Logic
      // Find current year's budget for the department
      const currentYear = new Date().getFullYear();
      const budgetAmount = Number(body.budget);

      created = await prisma.$transaction(async (tx) => {
        // 1. Create the request
        const req = await tx.request.create({
          data: {
            barcode: body.barcode.trim(),
            subject: body.subject.trim(),
            budget: body.budget,
            relatedPersonId: body.relatedPersonId,
            unitId: body.unitId,
            statusId: body.statusId,
            currencyId: body.currencyId,
            unitEmail: unitEmail || null,
            justification: body.justification?.trim() || null,
            ownerUserId: String(user.id),
            tenantId: user.tenantId,
            departmentId: user.departmentId, // Link to user's department
            items: body.items && body.items.length > 0 ? {
              create: body.items.map((i) => ({
                name: i.name.trim(),
                quantity: i.quantity,
                unitId: i.unitId,
                unitPrice: Number(i.unitPrice ?? 0),
                productId: i.productId || null,
                sku: i.sku || null,
                categoryId: i.categoryId || null
              }))
            } : undefined,
          } as any,
          select: { id: true, barcode: true }
        });

        // 2. Reserve Budget if department and budget exist
        if (user.departmentId && budgetAmount > 0) {
          const budgetRecord = await tx.budget.findFirst({
            where: {
              departmentId: user.departmentId,
              year: currentYear
            }
          });

          if (budgetRecord) {
            await tx.budget.update({
              where: { id: budgetRecord.id },
              data: {
                reservedAmount: { increment: budgetAmount }
              }
            });
          }
        }

        return req;
      });
    } catch (err: any) {
      const msg = String(err?.message || "");
      if (/Unknown argument/i.test(msg)) {
        // Fallback for older schema
        created = await prisma.request.create({
          data: {
            barcode: body.barcode.trim(),
            subject: body.subject.trim(),
            budget: body.budget,
            relatedPersonId: body.relatedPersonId,
            unitId: body.unitId,
            statusId: body.statusId,
            currencyId: body.currencyId,
            unitEmail: unitEmail || null,
            ownerUserId: String(user.id),
            tenantId: user.tenantId,
            items: body.items && body.items.length > 0 ? {
              create: body.items.map((i) => ({
                name: i.name.trim(),
                quantity: i.quantity,
                unitId: i.unitId,
                productId: i.productId || null,
                sku: i.sku || null,
                categoryId: i.categoryId || null
              }))
            } : undefined,
          } as any,
          select: { id: true, barcode: true }
        });
      } else {
        throw err;
      }
    }

    // Auto-create user account for unit email if it doesn't exist
    if (unitEmail) {
      const existingUser = await prisma.user.findUnique({ where: { email: unitEmail } });
      if (!existingUser) {
        try {
          const tempPassword = generateTempPassword();
          const userModule = await import("@/lib/apiAuth"); // Dynamic import to avoid cycles if any
          // We need bcrypt here. Ensure it is imported at top or dynamically.
          // Since we cannot easily add top-level imports with replace, we will use dynamic import or assume bcrypt is available if we added it.
          // Let's rely on adding the import at the top in a separate change if needed, OR use dynamic require if possible.
          // Better: I will use a separate replace to add imports first.

          // Actually, I can combine logic. But let's do imports first for safety.
        } catch (err) { }
      }
    }

    try {
      await notify({ userId: String(user.id), title: "Talep oluşturuldu", body: `${body.subject} (${body.barcode})` });
      const origin = req.nextUrl.origin;
      const link = `${origin}/talep/detay/${encodeURIComponent(created.id)}`;
      const createdAt = new Date().toLocaleString("tr-TR");
      const after = await prisma.request.findUnique({ where: { id: created.id }, include: { unit: true, owner: true, items: true } });
      const unitLabel = String((after as any)?.unit?.label || "");

      // Auto-create user logic moved here to have access to unitLabel
      if (unitEmail) {
        const existingUser = await prisma.user.findUnique({ where: { email: unitEmail } });
        if (!existingUser) {
          try {
            // Dynamic import for bcrypt to avoid top-level modification issues if possible, but standard is top-level.
            const bcrypt = await import("bcryptjs");
            const tempPassword = generateTempPassword();
            const passwordHash = await bcrypt.hash(tempPassword, 10);
            const safeUnitLabel = unitLabel.replace(/[^a-zA-ZğüşıöçĞÜŞİÖÇ0-9\s]/g, "").trim() || unitEmail.split("@")[0];
            const username = safeUnitLabel;

            await prisma.user.create({
              data: {
                username,
                email: unitEmail,
                passwordHash,
                role: "birim_evaluator",
              },
            });

            // Send welcome email
            const welcomeHtml = renderEmailTemplate("generic", {
              title: "satinalma.app - Hesabınız Oluşturuldu",
              body: `<p>Merhaba,</p>
                      <p>Adınıza/Biriminiz adına yeni bir satınalma talebi oluşturuldu. İşlemleri takip edebilmeniz için hesabınız oluşturulmuştur.</p>
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
              to: unitEmail,
              subject: "satinalma.app - Hesabınız Oluşturuldu",
              html: welcomeHtml,
              category: "welcome",
            });
          } catch (e) {
            console.error("Auto-create user failed:", e);
          }
        }
      }

      const fields = [
        { label: "Talep No", value: String(body.barcode) },
        ...(unitLabel ? [{ label: "Birim", value: unitLabel }] : []),
        { label: "Tarih", value: createdAt },
        { label: "Sahibi", value: String((after as any)?.owner?.username || "") },
        { label: "Detay", value: String(body.subject) },
      ];
      const items = Array.isArray((after as any)?.items) ? ((after as any).items as Array<any>).map((it) => ({ name: String(it.name), quantity: Number(it.quantity), unitPrice: Number(it.unitPrice || 0) })) : [];
      const html = renderEmailTemplate("detail", { title: unitLabel ? `Yeni Talep Oluşturuldu – Birim: ${unitLabel}` : "Yeni Talep Oluşturuldu", intro: "Talebin özeti ve kalemleri aşağıdadır.", fields, items, actionUrl: link, actionText: "Talebi Aç" });
      const subject = unitLabel ? `Yeni Talep Oluşturuldu – Birim: ${unitLabel}` : "Yeni Talep Oluşturuldu";
      const owner = await prisma.user.findUnique({ where: { id: String(user.id) } });
      if (owner?.email) await dispatchEmail({ to: owner.email, subject, html, category: "request_create" });
      if (unitEmail) await dispatchEmail({ to: unitEmail, subject, html, category: "request_create" });
    } catch { }

    // Audit log for request creation
    await logAuditWithRequest(req, {
      userId: user.id,
      action: "CREATE",
      entityType: "Request",
      entityId: created.id,
      newData: { barcode: created.barcode, subject: body.subject, budget: body.budget },
    });

    return NextResponse.json({ ok: true, id: created.id, barcode: created.barcode }, { status: 201 });
  } catch (e) {
    console.error(e);
    return jsonError(500, "server_error");
  }
}

/**
 * @swagger
 * /api/talep:
 *   get:
 *     summary: Talepleri listele
 *     description: Yetki dahilindeki satın alma taleplerini filtreleme ve sıralama seçenekleriyle listeler.
 *     tags:
 *       - Request
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: 'string' }
 *         description: Barkod veya konuda arama terimi
 *       - in: query
 *         name: unit
 *         schema: { type: 'string' }
 *         description: Birim etiketine göre filtrele
 *       - in: query
 *         name: status
 *         schema: { type: 'string' }
 *         description: Durum etiketine göre filtrele
 *       - in: query
 *         name: dateFrom
 *         schema: { type: 'string', format: 'date' }
 *         description: Başlangıç tarihi
 *       - in: query
 *         name: dateTo
 *         schema: { type: 'string', format: 'date' }
 *         description: Bitiş tarihi
 *       - in: query
 *         name: sortBy
 *         schema: { type: 'string', enum: [date, budget], default: date }
 *       - in: query
 *         name: sortDir
 *         schema: { type: 'string', enum: [asc, desc], default: desc }
 *       - in: query
 *         name: page
 *         schema: { type: 'integer', default: 1 }
 *       - in: query
 *         name: pageSize
 *         schema: { type: 'integer', default: 20 }
 *     responses:
 *       200:
 *         description: Talep listesi başarıyla döndürüldü
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: 'array'
 *                   items: { $ref: '#/components/schemas/Request' }
 *                 total: { type: 'integer' }
 *                 page: { type: 'integer' }
 *                 pageSize: { type: 'integer' }
 *                 totalPages: { type: 'integer' }
 */
export async function GET(req: NextRequest) {
  try {
    // Permission check: talep:read required
    const user = await requirePermissionApi(req, "talep:read");
    if (!user) return jsonError(403, "forbidden", { message: "Talep görüntüleme yetkiniz yok." });

    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.trim() || "";
    const unit = url.searchParams.get("unit")?.trim() || ""; // label
    const status = url.searchParams.get("status")?.trim() || ""; // label
    const dateFromRaw = url.searchParams.get("dateFrom");
    const dateToRaw = url.searchParams.get("dateTo");
    const sortBy = (url.searchParams.get("sortBy") || "date") as "date" | "budget";
    const sortDir = (url.searchParams.get("sortDir") || "desc") as "asc" | "desc";
    const page = Math.max(1, Number(url.searchParams.get("page") || 1));
    const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("pageSize") || 20)));

    const where: any = {};
    if (q) {
      where.OR = [
        { barcode: { contains: q, mode: "insensitive" } },
        { subject: { contains: q, mode: "insensitive" } },
      ];
    }
    // Robust date handling: ignore invalid dates to avoid server 500
    const dateFrom = dateFromRaw ? new Date(dateFromRaw) : null;
    const dateTo = dateToRaw ? new Date(dateToRaw) : null;
    const dateFromValid = dateFrom && !isNaN(dateFrom.getTime());
    const dateToValid = dateTo && !isNaN(dateTo.getTime());
    if (dateFromValid || dateToValid) {
      where.createdAt = {};
      if (dateFromValid) where.createdAt.gte = dateFrom as Date;
      if (dateToValid) where.createdAt.lte = dateTo as Date;
    }

    // Unit-based data isolation - Users only see their unit's data
    // Admin users and Satınalma unit see all data
    const unitLabelClean = (user.unitLabel || "").toLocaleLowerCase("tr-TR").replace(/\s/g, "");
    const isSatinalma = unitLabelClean.includes("satınalma") || unitLabelClean.includes("satinlama");
    const seeAll = user.isAdmin || isSatinalma;

    if (seeAll) {
      // Admin/Satinalma sees all - apply manual filter if requested
      if (unit) {
        where.unit = { is: { label: unit } };
      }
    } else if (user.unitId) {
      // Non-privileged users only see their unit's requests
      where.unitId = user.unitId;
    } else {
      // User has no unit assigned - show nothing
      where.unitId = "___NO_ACCESS___";
    }

    if (status) {
      where.status = { is: { label: status } };
    }

    // MULTI-TENANT: Apply enterprise/firm isolation
    // If user is super admin, they see everything. 
    // Otherwise, they only see data matching their tenantId.
    if (!user.isSuperAdmin) {
      where.tenantId = user.tenantId;
    }

    const include = {
      unit: true,
      status: true,
      currency: true,
    };

    const total = await prisma.request.count({ where });
    const rows = await prisma.request.findMany({
      where,
      include,
      orderBy: sortBy === "date" ? { createdAt: sortDir } : { budget: sortDir },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const mapped = rows.map((r: any) => ({
      id: r.id,
      barcode: r.barcode,
      date: r.createdAt.toISOString(),
      subject: r.subject,
      budget:
        typeof (r as any).budget?.toNumber === "function"
          ? (r as any).budget.toNumber()
          : Number(r.budget as any),
      unit: r.unit?.label || "",
      status: r.status?.label || "",
      currency: r.currency?.label || "",
    }));

    return NextResponse.json({
      items: mapped,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
  } catch (e) {
    console.error("[talep:list] error:", e);
    return jsonError(500, "list_failed");
  }
}

type UpdateStatusBody = { id?: string; barcode?: string; statusId: string; note?: string };

export async function PATCH(req: NextRequest) {
  try {
    // Permission check: talep:edit required
    const user = await requirePermissionApi(req, "talep:edit");
    if (!user) return jsonError(403, "forbidden", { message: "Talep düzenleme yetkiniz yok." });
    const body = (await req.json()) as UpdateStatusBody;
    const identifier = String(body.id || body.barcode || "").trim();
    if (!identifier || !body.statusId) return jsonError(400, "missing_fields");
    const where: any = body.id ? { id: identifier } : { barcode: identifier };

    // MULTI-TENANT: Ensure the user can only edit within their own tenant
    if (!user.isSuperAdmin) {
      where.tenantId = user.tenantId;
    }

    const before = await prisma.request.findFirst({ where, include: { status: true, owner: true, responsible: true, unit: true } });
    if (!before) return jsonError(404, "not_found");
    const updated = await prisma.request.update({ where: { id: before.id }, data: { statusId: String(body.statusId) } });
    const after = await prisma.request.findUnique({ where, include: { status: true, owner: true, responsible: true, unit: true } });
    // Notifications
    const prev = before?.status?.label || "";
    const next = after?.status?.label || "";
    const targets = [before?.owner?.id, before?.responsible?.id].filter(Boolean) as string[];
    for (const uid of targets) {
      await notify({ userId: uid, title: "Talep Durumu Güncellendi", body: `${before.barcode} → ${next}` });
    }
    // Emails
    const origin = req.nextUrl.origin;
    const link = `${origin}/talep/detay/${encodeURIComponent(after!.id)}`;
    const unitLabel = String((after as any)?.unit?.label || "");
    const subject = unitLabel ? `Talep Durumu Güncellendi – Birim: ${unitLabel}` : "Talep Durumu Güncellendi";
    const fields = [
      { label: "Talep No", value: String(before.barcode) },
      ...(unitLabel ? [{ label: "Birim", value: unitLabel }] : []),
      { label: "Önceki Durum", value: String(prev) },
      { label: "Yeni Durum", value: String(next) },
      { label: "Tarih", value: new Date().toLocaleString("tr-TR") },
      ...(body.note ? [{ label: "Açıklama", value: String(body.note) }] : []),
    ];
    const html = renderEmailTemplate("detail", { title: subject, intro: "Talep durum güncellemesi detayları:", fields, items: [], actionUrl: link, actionText: "Talebi Aç" });
    const emails: string[] = [];
    if (before?.owner?.email) emails.push(String(before.owner.email));
    if (before?.responsible?.email) emails.push(String(before.responsible.email));
    if ((before as any)?.unitEmail) emails.push(String((before as any).unitEmail));
    for (const to of Array.from(new Set(emails)).filter(Boolean)) {
      await dispatchEmail({ to, subject, html, category: "request_status" });
    }
    return NextResponse.json({ ok: true, id: updated.id });
  } catch (e) {
    console.error(e);
    return jsonError(500, "server_error");
  }
}
