import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/apiError";
import { renderEmailTemplate, dispatchEmail } from "@/lib/mailer";
import { requirePermissionApi } from "@/lib/apiAuth";
import { logAuditWithRequest, computeChanges } from "@/lib/auditLogger";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const url = new URL(req.url);
    const p = await params;
    const id = String(p?.id || "").trim() || url.pathname.split("/").filter(Boolean).pop() || "";
    if (!id) return jsonError(400, "bad_request", { message: "Geçersiz sözleşme ID" });
    if (!contract) return jsonError(404, "not_found");

    // Multi-tenant Isolation
    const { getUserWithPermissions } = await import("@/lib/apiAuth");
    const user = await getUserWithPermissions(req);
    if (!user) return jsonError(401, "unauthorized");

    if (!user.isSuperAdmin && (contract as any).tenantId !== user.tenantId) {
      return jsonError(403, "tenant_mismatch", { message: "Bu veriye erişim yetkiniz yok." });
    }
    const payload: any = {
      id: contract.id,
      number: (contract as any).number ?? null,
      title: (contract as any).title ?? null,
      status: (contract as any).status ?? null,
      type: (contract as any).type ?? null,
      startDate: contract.startDate?.toISOString?.() || null,
      endDate: contract.endDate?.toISOString?.() || null,
      parties: (contract as any).parties ?? null,
      order: contract.order
        ? {
          barcode: (contract.order as any).barcode ?? null,
          request: contract.order.request
            ? {
              unit: contract.order.request.unit
                ? { label: (contract.order.request.unit as any).label ?? null }
                : null,
            }
            : null,
        }
        : null,
    };
    return NextResponse.json(payload);
  } catch (e: any) {
    return jsonError(500, "server_error", { message: e?.message });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermissionApi(req, "sozlesme:edit");
    if (!user) return jsonError(403, "forbidden");
    const { id } = await params;
    const url = new URL(req.url);
    const confirm = url.searchParams.get("confirm") === "true";
    const body = await req.json().catch(() => ({}));

    const existing = await prisma.contract.findUnique({ where: { id } });
    if (!existing) return jsonError(404, "not_found");

    // Multi-tenant Isolation
    if (!user.isSuperAdmin && (existing as any).tenantId !== user.tenantId) {
      return jsonError(403, "tenant_mismatch", { message: "Bu veriyi düzenleme yetkiniz yok." });
    }

    const before = existing;

    const patch: any = {};
    const allowed = ["title", "parties", "startDate", "endDate", "status", "type", "template"] as const;
    for (const key of allowed) {
      if (key in body) patch[key] = body[key];
    }
    // Normalize dates if provided as strings
    if (typeof patch.startDate === "string") patch.startDate = new Date(patch.startDate);
    if (typeof patch.endDate === "string") patch.endDate = new Date(patch.endDate);

    if (Object.keys(patch).length === 0) return jsonError(400, "nothing_to_update");

    // If update requires approval, store as pending revision
    if (!confirm) {
      const revision = await prisma.contractRevision.create({
        data: {
          contractId: id,
          pending: true,
          changes: patch,
        },
      });
      return NextResponse.json({ status: "pending", revisionId: revision.id }, { status: 202 });
    }

    // Apply update
    const nextVersion = (existing.version || 1) + 1;
    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.contract.update({ where: { id }, data: { ...patch, version: nextVersion } });
      if (patch.status && patch.status !== existing.status) {
        await tx.contractHistory.create({
          data: {
            contractId: id,
            fromStatus: existing.status,
            toStatus: patch.status,
            version: nextVersion,
          },
        });
      }
      // Mark latest pending revision (if any) as approved
      await tx.contractRevision.updateMany({
        where: { contractId: id, pending: true },
        data: { pending: false, approvedAt: new Date() },
      });
      return u;
    });
    try {
      const after = await prisma.contract.findUnique({
        where: { id },
        include: { responsible: true, order: { include: { request: { include: { owner: true, responsible: true, unit: true } } } } },
      });
      const origin = (req as any)?.nextUrl?.origin || "";
      const link = origin ? `${origin}/sozlesme/detay/${encodeURIComponent(id)}` : `https://example.com/sozlesme/detay/${encodeURIComponent(id)}`;
      const unitLabel = String((after as any)?.order?.request?.unit?.label || "");
      const noteText = typeof (body as any)?.note === "string" ? String((body as any).note).trim() : "";
      const subject = unitLabel ? `Sözleşme Durumu Güncellendi – Birim: ${unitLabel}` : "Sözleşme Durumu Güncellendi";
      const fields = [
        { label: "Sözleşme No", value: String((after as any)?.number || id) },
        ...(unitLabel ? [{ label: "Birim", value: unitLabel }] : []),
        { label: "Yeni Durum", value: String((after as any)?.status || patch.status || "") },
        { label: "Değişiklik Tarihi", value: new Date().toLocaleString("tr-TR") },
        ...(noteText ? [{ label: "Açıklama", value: noteText }] : []),
      ];
      const html = renderEmailTemplate("detail", { title: subject, intro: "Sözleşme durum güncellemesi detayları:", fields, items: [], actionUrl: link, actionText: "Detayı Aç" });
      const emails: string[] = [];
      if ((after as any)?.responsible?.email) emails.push(String((after as any).responsible.email));
      if ((after as any)?.order?.request?.owner?.email) emails.push(String((after as any).order.request.owner.email));
      if ((after as any)?.order?.request?.responsible?.email) emails.push(String((after as any).order.request.responsible.email));
      if ((after as any)?.order?.request?.unitEmail) emails.push(String((after as any).order.request.unitEmail));
      for (const to of Array.from(new Set(emails)).filter(Boolean)) {
        await dispatchEmail({ to, subject, html, category: "contract_status" });
      }
    } catch { }

    // Audit log
    const changes = computeChanges(before || {}, updated || {});
    if (changes) {
      await logAuditWithRequest(req, {
        userId: user.id, // user is from requirePermissionApi
        action: "UPDATE",
        entityType: "Contract",
        entityId: id,
        oldData: changes.old,
        newData: changes.new,
      });
    }

    return NextResponse.json(updated);
  } catch (e: any) {
    return jsonError(500, "update_failed", { message: e?.message });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermissionApi(req, "sozlesme:delete");
    if (!user) return jsonError(403, "forbidden");
    const { id } = await params;
    const existing = await prisma.contract.findUnique({ where: { id } });
    if (!existing) return jsonError(404, "not_found");

    // Multi-tenant Isolation
    if (!user.isSuperAdmin && (existing as any).tenantId !== user.tenantId) {
      return jsonError(403, "tenant_mismatch", { message: "Bu veriyi silme yetkiniz yok." });
    }
    if (existing.deletedAt) return NextResponse.json({ status: "already_deleted" });
    const deleted = await prisma.contract.update({ where: { id }, data: { deletedAt: new Date() } });

    // Audit log
    await logAuditWithRequest(req, {
      userId: user.id,
      action: "DELETE",
      entityType: "Contract",
      entityId: id,
      oldData: { number: (existing as any).number, title: (existing as any).title },
    });

    return NextResponse.json(deleted);
  } catch (e: any) {
    return jsonError(500, "delete_failed", { message: e?.message });
  }
}
