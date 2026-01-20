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

    const item = await prisma.request.findUnique({
      where: { id: safeId },
      include: {
        relatedPerson: true,
        status: true,
        currency: true,
        owner: true,
        responsible: true,
        unit: {
          include: {
            approvalWorkflow: {
              include: {
                steps: true
              }
            }
          }
        },
        items: { include: { unit: true } },
        attachments: true,
        comments: { include: { author: true } },
        approvalRecords: { include: { approver: { select: { username: true, email: true } } }, orderBy: { stepOrder: "asc" } },
      },
    });

    if (!item) return jsonError(404, "not_found");

    // Multi-tenant Isolation: User must belong to the same tenant as the request
    if (!user.isSuperAdmin && item.tenantId !== user.tenantId) {
      return jsonError(403, "tenant_mismatch", { message: "Bu veriye erişim yetkiniz yok (Firma uyuşmazlığı)." });
    }

    // Secondary Security Check: Unit/Role Isolation
    const unitLabelClean = (user.unitLabel || "").toLocaleLowerCase("tr-TR").replace(/\s/g, "");
    const isSatinalma = unitLabelClean.includes("satınalma") || unitLabelClean.includes("satinlama");
    const isAdmin = user.isSuperAdmin || user.isAdmin || isSatinalma;
    const isOwner = item.ownerUserId === user.id;
    const isResponsible = item.responsibleUserId === user.id;
    const isSameUnit = item.unitId === user.unitId;
    const isSameDept = item.departmentId === user.departmentId;

    if (!isAdmin && !isOwner && !isResponsible && !isSameUnit && !isSameDept) {
      return jsonError(403, "forbidden_access", { message: "Bu talebi görüntüleme yetkiniz yok." });
    }

    const payload = {
      id: item.id,
      barcode: item.barcode,
      date: item.createdAt?.toISOString() || null,
      subject: item.subject,
      budget: Number(item.budget || 0),
      // relation ids (mevcut tüketimler için korunuyor)
      relatedPersonId: item.relatedPersonId || null,
      unitId: item.unitId || null,
      departmentId: item.departmentId || null,
      statusId: item.statusId || null,
      currencyId: item.currencyId || null,
      ownerUserId: item.ownerUserId || null,
      responsibleUserId: item.responsibleUserId || null,
      // relation labels (UI için kolaylık)
      relatedPerson: item.relatedPerson?.label || null,
      unit: item.unit?.label || null,
      department: item.department?.name || null,
      status: item.status?.label || null,
      currency: item.currency?.label || null,
      unitEmail: item.unitEmail || null,
      owner: item.owner?.username || item.owner?.email || null,
      responsible: item.responsible?.username || item.responsible?.email || null,
      // items
      items: item.items.map((it) => ({
        id: it.id,
        name: it.name,
        quantity: Number(it.quantity || 0),
        unit: it.unit?.label || null,
        unitId: it.unitId,
        unitPrice: Number(it.unitPrice || 0),
      })),
      // comments
      comments: item.comments.map((c) => ({
        id: c.id,
        text: c.text,
        author: c.author?.username || c.author?.email || null,
        createdAt: c.createdAt?.toISOString() || null,
      })),
      // attachments
      attachments: item.attachments.map((a) => ({
        id: a.id,
        fileName: a.fileName,
        url: a.url,
        type: a.type,
      })),
      // approval records
      approvalRecords: item.approvalRecords.map((r) => {
        const step = item.unit?.approvalWorkflow?.steps.find(s => s.stepOrder === r.stepOrder);
        return {
          id: r.id,
          stepOrder: r.stepOrder,
          stepName: r.stepName,
          status: r.status,
          approver: r.approver?.username || r.approver?.email || null,
          approverRole: step?.approverRole || null,
          comment: r.comment,
          processedAt: r.processedAt?.toISOString() || null,
        };
      })
    };

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

    // Multi-tenant Isolation
    if (!user.isSuperAdmin && existingReq.tenantId !== user.tenantId) {
      return jsonError(403, "tenant_mismatch", { message: "Bu veriyi düzenleme yetkiniz yok." });
    }

    // Security Check
    const unitLabelClean = (user.unitLabel || "").toLocaleLowerCase("tr-TR").replace(/\s/g, "");
    const isSatinalma = unitLabelClean.includes("satınalma") || unitLabelClean.includes("satinlama");
    const isAdmin = user.isSuperAdmin || user.isAdmin || isSatinalma;
    const isOwner = existingReq.ownerUserId === user.id;
    const isResponsible = existingReq.responsibleUserId === user.id;

    // Strict Edit Rules: Only Admin, Owner, or Responsible can edit
    if (!isAdmin && !isOwner && !isResponsible) {
      return jsonError(403, "forbidden_edit", { message: "Bu talebi düzenleme yetkiniz yok." });
    }

    const body = await req.json().catch(() => ({}));
    const errors: string[] = [];
    const data: Prisma.RequestUpdateInput = {};

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

    // Validate relations
    if (typeof body.unitId === "string" && body.unitId) {
      data.unit = { connect: { id: body.unitId } };
    }
    if (typeof body.statusId === "string" && body.statusId) {
      data.status = { connect: { id: body.statusId } };
    }
    if (typeof body.currencyId === "string" && body.currencyId) {
      data.currency = { connect: { id: body.currencyId } };
    }
    if (typeof body.relatedPersonId === "string" && body.relatedPersonId) {
      data.relatedPerson = { connect: { id: body.relatedPersonId } };
    }

    // Owner / Responsible
    if (typeof body.ownerUserId === "string" && body.ownerUserId) {
      data.owner = { connect: { id: body.ownerUserId } };
    } else if (body.ownerUserId === null) {
      data.owner = { disconnect: true };
    }

    if (typeof body.responsibleUserId === "string" && body.responsibleUserId) {
      data.responsible = { connect: { id: body.responsibleUserId } };
    } else if (body.responsibleUserId === null) {
      data.responsible = { disconnect: true };
    }

    // Items management
    if (Array.isArray(body.items)) {
      const payloadItems = body.items.map((it: any) => ({
        id: it.id ? String(it.id) : undefined,
        name: String(it.name || "").trim(),
        quantity: Number(it.quantity),
        unitId: String(it.unitId || "").trim(),
        unitPrice: Number(it.unitPrice || 0)
      }));

      for (const it of payloadItems) {
        if (!it.name) errors.push("item_name_required");
        if (!Number.isFinite(it.quantity) || it.quantity <= 0) errors.push("item_quantity_invalid");
        if (!it.unitId) errors.push("item_unitId_required");
      }

      if (!errors.length) {
        const idsInPayload = payloadItems.filter((p: any) => p.id).map((p: any) => p.id);

        data.items = {
          deleteMany: {
            id: { notIn: idsInPayload }
          },
          upsert: payloadItems.map((p: any) => ({
            where: { id: p.id || "new-item" },
            update: {
              name: p.name,
              quantity: p.quantity,
              unitPrice: p.unitPrice,
              unit: { connect: { id: p.unitId } }
            },
            create: {
              name: p.name,
              quantity: p.quantity,
              unitPrice: p.unitPrice,
              unit: { connect: { id: p.unitId } }
            }
          }))
        };
      }
    }

    if (errors.length) {
      return jsonError(400, "validation_failed", { details: errors });
    }

    try {
      const before = await prisma.request.findUnique({ where: { id: safeId }, include: { status: true, owner: true, responsible: true } });
      const updated = await prisma.request.update({ where: { id: safeId }, data });
      const after = await prisma.request.findUnique({ where: { id: safeId }, include: { status: true, owner: true, responsible: true } });

      if (before && after) {
        // Background email task
        (async () => {
          try {
            const prev = before.status?.label || "";
            const next = after.status?.label || "";
            const origin = req.nextUrl.origin;
            const link = `${origin}/talep/detay/${encodeURIComponent(after.id)}`;
            const subject = "Talep Durumu Güncellendi";
            const html = renderEmailTemplate("generic", {
              title: subject,
              body: `Talep No: ${before.barcode || safeId}<br/>Önceki Durum: ${prev}<br/>Yeni Durum: ${next}`,
              actionUrl: link,
              actionText: "Talebi Aç"
            });
            const emails = new Set<string>();
            if (after.owner?.email) emails.add(after.owner.email);
            if (after.responsible?.email) emails.add(after.responsible.email);
            if (before.unitEmail) emails.add(before.unitEmail);

            await Promise.allSettled([...emails].map(to => dispatchEmail({ to, subject, html, category: "request_status" })));
          } catch (err) {
            console.error("Mail error:", err);
          }
        })();
      }

      return NextResponse.json({ ok: true, id: updated.id });
    } catch (err: any) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
        return jsonError(404, "not_found");
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

    if (!user.isSuperAdmin && existingReq.tenantId !== user.tenantId) {
      return jsonError(403, "tenant_mismatch", { message: "Bu veriyi silme yetkiniz yok." });
    }

    const unitLabelClean = (user.unitLabel || "").toLocaleLowerCase("tr-TR").replace(/\s/g, "");
    const isSatinalma = unitLabelClean.includes("satınalma") || unitLabelClean.includes("satinlama");
    const isAdmin = user.isSuperAdmin || user.isAdmin || isSatinalma;
    const isOwner = existingReq.ownerUserId === user.id;

    if (!isAdmin && !isOwner) {
      return jsonError(403, "forbidden_delete", { message: "Sadece kendi taleplerinizi silebilirsiniz." });
    }

    await prisma.request.delete({ where: { id: safeId } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return jsonError(500, "talep_delete_failed", { message: e?.message });
  }
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  return PATCH(req, context);
}
