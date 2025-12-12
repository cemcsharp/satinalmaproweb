import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/apiError";
import { requireAuthApi } from "@/lib/apiAuth";
import { notify } from "@/lib/notification-service";
import { dispatchEmail, renderEmailTemplate } from "@/lib/mailer";

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
  items: { name: string; quantity: number; unitId: string; unitPrice?: number }[];
};

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuthApi(req);
    if (!auth) return jsonError(401, "unauthorized");

    // Permission check removed as requested
    // const { getUserWithPermissions, userHasPermission } = await import("@/lib/apiAuth");
    // const user = await getUserWithPermissions(req);
    // if (!user || !userHasPermission(user, "talep:create")) {
    //   return jsonError(403, "forbidden");
    // }

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

    let created;
    try {
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
          justification: body.justification?.trim() || null,
          ownerUserId: String(auth.userId),
          items: body.items && body.items.length > 0 ? {
            create: body.items.map((i) => ({ name: i.name.trim(), quantity: i.quantity, unitId: i.unitId, unitPrice: Number(i.unitPrice ?? 0) }))
          } : undefined,
        },
        select: { id: true, barcode: true }
      });
    } catch (err: any) {
      const msg = String(err?.message || "");
      // Handle case where justification or unitPrice field not yet in Prisma client
      if (/Unknown argument/i.test(msg)) {
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
            ownerUserId: String(auth.userId),
            items: body.items && body.items.length > 0 ? {
              create: body.items.map((i) => ({ name: i.name.trim(), quantity: i.quantity, unitId: i.unitId }))
            } : undefined,
          },
          select: { id: true, barcode: true }
        });
      } else {
        throw err;
      }
    }

    try {
      await notify({ userId: String(auth.userId), title: "Talep oluşturuldu", body: `${body.subject} (${body.barcode})` });
      const origin = req.nextUrl.origin;
      const link = `${origin}/talep/detay/${encodeURIComponent(created.id)}`;
      const createdAt = new Date().toLocaleString("tr-TR");
      const after = await prisma.request.findUnique({ where: { id: created.id }, include: { unit: true, owner: true, items: true } });
      const unitLabel = String((after as any)?.unit?.label || "");
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
      const owner = await prisma.user.findUnique({ where: { id: String(auth.userId) } });
      if (owner?.email) await dispatchEmail({ to: owner.email, subject, html, category: "request_create" });
      if (unitEmail) await dispatchEmail({ to: unitEmail, subject, html, category: "request_create" });
    } catch { }

    return NextResponse.json({ ok: true, id: created.id, barcode: created.barcode }, { status: 201 });
  } catch (e) {
    console.error(e);
    return jsonError(500, "server_error");
  }
}

export async function GET(req: NextRequest) {
  try {
    // Import permission helpers
    const { getUserWithPermissions, userHasPermission } = await import("@/lib/apiAuth");

    // Check authentication and get user info
    const user = await getUserWithPermissions(req);
    if (!user) {
      return jsonError(401, "unauthorized");
    }

    // Check read permission
    if (!userHasPermission(user, "talep:read")) {
      return jsonError(403, "forbidden");
    }

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
    // Admin users see all data
    if (user.isAdmin || user.roleRef?.key === "admin") {
      // Admin sees all - apply manual filter if requested
      if (unit) {
        where.unit = { is: { label: unit } };
      }
    } else if (user.unitId) {
      // Non-admin users only see their unit's requests
      where.unitId = user.unitId;
    } else {
      // User has no unit assigned - show nothing
      where.unitId = "___NO_ACCESS___";
    }

    if (status) {
      where.status = { is: { label: status } };
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

    const mapped = rows.map((r) => ({
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
    const auth = await requireAuthApi(req);
    if (!auth) return jsonError(401, "unauthorized");
    const body = (await req.json()) as UpdateStatusBody;
    const identifier = String(body.id || body.barcode || "").trim();
    if (!identifier || !body.statusId) return jsonError(400, "missing_fields");
    const where = body.id ? { id: identifier } : { barcode: identifier };
    const before = await prisma.request.findUnique({ where, include: { status: true, owner: true, responsible: true, unit: true } });
    if (!before) return jsonError(404, "not_found");
    const updated = await prisma.request.update({ where, data: { statusId: String(body.statusId) } });
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
