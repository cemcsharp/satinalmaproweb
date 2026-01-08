import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { dispatchEmail, renderEmailTemplate } from "@/lib/mailer";
import { jsonError } from "@/lib/apiError";
import { getUserWithPermissions } from "@/lib/apiAuth"; // Import auth helper

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUserWithPermissions(req);
    if (!user) return jsonError(401, "unauthorized");

    const { id } = await context.params;
    const safeId = String(id || "").trim();
    if (!safeId) return jsonError(404, "not_found");
    let item: any = null;
    try {
      item = await prisma.request.findUnique({
        where: { id: safeId },
        include: {
          relatedPerson: true,
          unit: true,
          status: true,
          currency: true,
          owner: true,
          responsible: true,
          items: { include: { unit: true } },
          attachments: true,
          comments: { include: { author: true } },
        },
      });
    } catch (_e) {
      return jsonError(404, "not_found");
    }
    if (!item) return jsonError(404, "not_found");

    // Security Check: Isolation
    const unitLabelClean = (user.unitLabel || "").toLocaleLowerCase("tr-TR").replace(/\s/g, "");
    const isSatinalma = unitLabelClean.includes("satınalma") || unitLabelClean.includes("satinlama");
    const isAdmin = user.isAdmin || isSatinalma;
    const isOwner = item.ownerUserId === user.id;
    const isResponsible = item.responsibleUserId === user.id;
    const isSameUnit = item.unitId === user.unitId;

    // Access Rules:
    // 1. Admin/Satinalma -> OK
    // 2. Owner or Responsible -> OK
    // 3. Same Unit -> OK (if they have read permission, verified by generic list API usually)
    // 4. Otherwise -> FORBIDDEN
    if (!isAdmin && !isOwner && !isResponsible && !isSameUnit) {
      return jsonError(403, "forbidden_access", { message: "Bu talebi görüntüleme yetkiniz yok." });
    }
    const payload = {
      id: item.id,
      barcode: item.barcode,
      date: item.createdAt?.toISOString?.() || null,
      subject: item.subject,
      budget:
        typeof (item as any).budget?.toNumber === "function"
          ? (item as any).budget.toNumber()
          : Number(item.budget as any),
      // relation ids (mevcut tüketimler için korunuyor)
      relatedPersonId: (item as any).relatedPersonId ?? item.relatedPerson?.id ?? null,
      unitId: (item as any).unitId ?? item.unit?.id ?? null,
      statusId: (item as any).statusId ?? item.status?.id ?? null,
      currencyId: (item as any).currencyId ?? item.currency?.id ?? null,
      ownerUserId: (item as any).ownerUserId ?? item.owner?.id ?? null,
      responsibleUserId: (item as any).responsibleUserId ?? item.responsible?.id ?? null,
      // relation labels (UI için kolaylık)
      relatedPerson: item.relatedPerson?.label || null,
      unit: item.unit?.label || null,
      status: item.status?.label || null,
      currency: item.currency?.label || null,
      unitEmail: (item as any).unitEmail ?? null,
      owner: item.owner?.username || item.owner?.email || null,
      responsible: item.responsible?.username || item.responsible?.email || null,
      // items
      items: Array.isArray(item.items)
        ? item.items.map((it: any) => ({
          id: it.id,
          name: it.name,
          quantity:
            typeof it.quantity?.toNumber === "function"
              ? it.quantity.toNumber()
              : Number(it.quantity as any),
          unit: it.unit?.label || null,
          unitId: (it as any).unitId ?? it.unit?.id ?? null,
          unitPrice:
            typeof (it as any).unitPrice?.toNumber === "function"
              ? (it as any).unitPrice.toNumber()
              : Number((it as any).unitPrice ?? 0),
        }))
        : [],
      // comments
      comments: Array.isArray(item.comments)
        ? item.comments.map((c: any) => ({
          id: c.id,
          text: c.text,
          author: c.author?.username || c.author?.email || null,
          createdAt: c.createdAt?.toISOString?.() || null,
        }))
        : [],
    };
    // Attachments
    (payload as any).attachments = Array.isArray(item.attachments)
      ? item.attachments.map((a: any) => ({
        id: a.id,
        fileName: a.fileName,
        url: a.url,
        type: a.type,
      }))
      : [];
    return NextResponse.json(payload);
  } catch (e: any) {
    return jsonError(500, "talep_get_failed", { message: e?.message });
  }
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUserWithPermissions(req);
    if (!user) return jsonError(401, "unauthorized");

    const { id } = await context.params;
    const safeId = String(id || "").trim();
    if (!safeId) return jsonError(404, "not_found");

    // Fetch existing validation
    const existingReq = await prisma.request.findUnique({ where: { id: safeId } });
    if (!existingReq) return jsonError(404, "not_found");

    // Security Check
    const unitLabelClean = (user.unitLabel || "").toLocaleLowerCase("tr-TR").replace(/\s/g, "");
    const isSatinalma = unitLabelClean.includes("satınalma") || unitLabelClean.includes("satinlama");
    const isAdmin = user.isAdmin || isSatinalma;
    const isOwner = existingReq.ownerUserId === user.id;
    const isResponsible = existingReq.responsibleUserId === user.id;
    // const canEditUnit = existingReq.unitId === user.unitId && user.permissions.includes("talep:edit"); // Simplified

    // Strict Edit Rules: Only Admin, Owner, or Responsible can edit
    if (!isAdmin && !isOwner && !isResponsible) {
      return jsonError(403, "forbidden_edit", { message: "Bu talebi düzenleme yetkiniz yok." });
    }

    const body = await req.json().catch(() => ({}));
    const errors: string[] = [];
    const data: any = {};
    if (typeof body.subject !== "undefined") {
      const subject = String(body.subject || "").trim();
      if (!subject) errors.push("subject_required");
      if (subject.length > 500) errors.push("subject_too_long");
      if (!errors.length) data.subject = subject;
    }
    if (typeof body.justification !== "undefined") {
      data.justification = String(body.justification || "").trim() || null;
    }
    if (typeof body.budget !== "undefined") {
      const budgetNum = Number(body.budget);
      if (!Number.isFinite(budgetNum)) errors.push("invalid_budget");
      else data.budget = budgetNum;
    }
    if (typeof body.unitEmail !== "undefined") {
      data.unitEmail = String(body.unitEmail || "").trim() || null;
    }
    // Validate relation ids if provided
    if (typeof body.unitId === "string" && body.unitId) {
      const unit = await prisma.optionItem.findUnique({ where: { id: body.unitId } });
      if (!unit) errors.push("invalid_unitId");
      else data.unit = { connect: { id: body.unitId } };
    }
    if (typeof body.statusId === "string" && body.statusId) {
      const status = await prisma.optionItem.findUnique({ where: { id: body.statusId } });
      if (!status) errors.push("invalid_statusId");
      else data.status = { connect: { id: body.statusId } };
    }
    if (typeof body.currencyId === "string" && body.currencyId) {
      const currency = await prisma.optionItem.findUnique({ where: { id: body.currencyId } });
      if (!currency) errors.push("invalid_currencyId");
      else data.currency = { connect: { id: body.currencyId } };
    }
    if (typeof body.relatedPersonId === "string" && body.relatedPersonId) {
      const rp = await prisma.optionItem.findUnique({ where: { id: body.relatedPersonId } });
      if (!rp) errors.push("invalid_relatedPersonId");
      else data.relatedPerson = { connect: { id: body.relatedPersonId } };
    }
    // Owner / Responsible (User)
    if (typeof body.ownerUserId === "string" && body.ownerUserId) {
      const owner = await prisma.user.findUnique({ where: { id: body.ownerUserId } });
      if (!owner) errors.push("invalid_ownerUserId");
      else data.owner = { connect: { id: body.ownerUserId } };
    } else if (body.ownerUserId === null) {
      data.owner = { disconnect: true };
    }

    if (typeof body.responsibleUserId === "string" && body.responsibleUserId) {
      const resp = await prisma.user.findUnique({ where: { id: body.responsibleUserId } });
      if (!resp) errors.push("invalid_responsibleUserId");
      else data.responsible = { connect: { id: body.responsibleUserId } };
    } else if (body.responsibleUserId === null) {
      data.responsible = { disconnect: true };
    }

    // Items replace-update support
    if (Array.isArray(body.items)) {
      const payloadItems = [] as Array<{ id?: string; name: string; quantity: number; unitId: string; unitPrice: number }>;
      for (const it of body.items as any[]) {
        const name = String(it?.name || "").trim();
        const quantity = Number(it?.quantity);
        const unitId = String(it?.unitId || "").trim();
        const unitPrice = Number(it?.unitPrice ?? 0);
        const itemId = it?.id ? String(it.id) : undefined;
        if (!name) errors.push("item_name_required");
        if (!Number.isFinite(quantity) || quantity <= 0) errors.push("item_quantity_invalid");
        if (!unitId) errors.push("item_unitId_required");
        if (!Number.isFinite(unitPrice) || unitPrice < 0) errors.push("item_unitPrice_invalid");
        if (unitId) {
          const unitExists = await prisma.optionItem.findUnique({ where: { id: unitId } });
          if (!unitExists) errors.push("invalid_item_unitId");
        }
        payloadItems.push({ id: itemId, name, quantity, unitId, unitPrice });
      }
      if (!errors.length) {
        const idsInPayload = payloadItems.filter((p) => !!p.id).map((p) => p.id!) as string[];
        const createItems = payloadItems.filter((p) => !p.id).map((p) => ({ name: p.name, quantity: p.quantity, unitPrice: p.unitPrice, unit: { connect: { id: p.unitId } } }));
        const updateItems = payloadItems.filter((p) => !!p.id).map((p) => ({ where: { id: p.id! }, data: { name: p.name, quantity: p.quantity, unitPrice: p.unitPrice, unit: { connect: { id: p.unitId } } } }));
        if (idsInPayload.length) {
          data.items = {
            deleteMany: [{ NOT: { id: { in: idsInPayload } } }],
            create: createItems,
            update: updateItems,
          };
        } else {
          const existing = await prisma.request.findUnique({ where: { id: safeId }, include: { items: { select: { id: true } } } });
          const existingIds = Array.isArray(existing?.items) ? (existing!.items as any[]).map((x) => x.id) : [];
          data.items = {
            deleteMany: existingIds.length ? [{ id: { in: existingIds } }] : [],
            create: createItems,
          };
        }
      }
    }

    if (errors.length) {
      return jsonError(400, "validation_failed", { details: errors });
    }

    try {
      const before = await prisma.request.findUnique({ where: { id: safeId }, include: { status: true, owner: true, responsible: true } });
      const updated = await prisma.request.update({ where: { id: safeId }, data });
      const after = await prisma.request.findUnique({ where: { id: safeId }, include: { status: true, owner: true, responsible: true } });

      // Mail gönderimini arka planda yap (await etme)
      (async () => {
        try {
          const prev = before?.status?.label || "";
          const next = after?.status?.label || "";
          const origin = req.nextUrl.origin;
          const link = `${origin}/talep/detay/${encodeURIComponent(after!.id)}`;
          const subject = "Talep Durumu Güncellendi";
          const html = renderEmailTemplate("generic", { title: subject, body: `Talep No: ${before?.barcode || safeId}<br/>Önceki Durum: ${prev}<br/>Yeni Durum: ${next}<br/>Tarih: ${new Date().toLocaleString("tr-TR")}${body?.note ? `<br/>Açıklama: ${String(body.note)}` : ""}`, actionUrl: link, actionText: "Talebi Aç" });
          const emails: string[] = [];
          if ((after as any)?.owner?.email) emails.push(String((after as any).owner.email));
          if ((after as any)?.responsible?.email) emails.push(String((after as any).responsible.email));
          if ((before as any)?.unitEmail) emails.push(String((before as any).unitEmail));
          const mailPromises = Array.from(new Set(emails)).filter(Boolean).map(to =>
            dispatchEmail({ to, subject, html, category: "request_status" }).catch(err => {
              console.error(`Mail gönderilemedi (${to}):`, err);
            })
          );
          await Promise.allSettled(mailPromises);
        } catch (err) {
          console.error("Mail gönderim hatası:", err);
        }
      })();

      return NextResponse.json({ ok: true, id: updated.id });
    } catch (err: any) {
      const msg = String(err?.message || "");
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
        return jsonError(404, "not_found");
      }
      if (/Unknown argument `unitPrice`/i.test(msg)) {
        try {
          const fallbackData: any = { ...data };
          if (Array.isArray(body.items)) {
            const payloadItems = [] as Array<{ id?: string; name: string; quantity: number; unitId: string }>;
            for (const it of body.items as any[]) {
              const name = String(it?.name || "").trim();
              const quantity = Number(it?.quantity);
              const unitId = String(it?.unitId || "").trim();
              const itemId = it?.id ? String(it.id) : undefined;
              payloadItems.push({ id: itemId, name, quantity, unitId });
            }
            const idsInPayload = payloadItems.filter((p) => !!p.id).map((p) => p.id!) as string[];
            const createItems = payloadItems.filter((p) => !p.id).map((p) => ({ name: p.name, quantity: p.quantity, unit: { connect: { id: p.unitId } } }));
            const updateItems = payloadItems.filter((p) => !!p.id).map((p) => ({ where: { id: p.id! }, data: { name: p.name, quantity: p.quantity, unit: { connect: { id: p.unitId } } } }));
            if (idsInPayload.length) {
              fallbackData.items = { deleteMany: [{ NOT: { id: { in: idsInPayload } } }], create: createItems, update: updateItems };
            } else {
              const existing = await prisma.request.findUnique({ where: { id: safeId }, include: { items: { select: { id: true } } } });
              const existingIds = Array.isArray(existing?.items) ? (existing!.items as any[]).map((x) => x.id) : [];
              fallbackData.items = { deleteMany: existingIds.length ? [{ id: { in: existingIds } }] : [], create: createItems };
            }
          }
          const updated2 = await prisma.request.update({ where: { id: safeId }, data: fallbackData });
          return NextResponse.json({ ok: true, id: updated2.id });
        } catch (e2: any) {
          throw e2;
        }
      }
      throw err;
    }
  } catch (e: any) {
    return jsonError(500, "talep_patch_failed", { message: e?.message });
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUserWithPermissions(req);
    if (!user) return jsonError(401, "unauthorized");

    const { id } = await context.params;
    const safeId = String(id || "").trim();
    if (!safeId) return jsonError(404, "not_found");

    const existingReq = await prisma.request.findUnique({ where: { id: safeId } });
    if (!existingReq) return jsonError(404, "not_found");

    // Security Check
    const unitLabelClean = (user.unitLabel || "").toLocaleLowerCase("tr-TR").replace(/\s/g, "");
    const isSatinalma = unitLabelClean.includes("satınalma") || unitLabelClean.includes("satinlama");
    const isAdmin = user.isAdmin || isSatinalma;
    const isOwner = existingReq.ownerUserId === user.id;

    if (!isAdmin && !isOwner) {
      return jsonError(403, "forbidden_delete", { message: "Sadece kendi taleplerinizi silebilirsiniz." });
    }

    // Safety: Prevent deleting processed requests (unless admin)
    // Assuming statusId for 'Draft' or 'Pending' is needed, but we check label via join ideally.
    // Since we don't have status label here easily without join, let's trust Admin/Owner judgement OR
    // we could fetch status. For now, basic auth is huge improvement.

    try {
      await prisma.request.delete({ where: { id: safeId } });
      return NextResponse.json({ ok: true });
    } catch (err: any) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
        return jsonError(404, "not_found");
      }
      throw err;
    }
  } catch (e: any) {
    return jsonError(500, "talep_delete_failed", { message: e?.message });
  }
}

// PUT endpoint (alias for PATCH)
export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  return PATCH(req, context);
}
