import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { notify } from "@/lib/notification-service";
import { dispatchEmail, renderEmailTemplate } from "@/lib/mailer";
import { jsonError } from "@/lib/apiError";
import { getUserWithPermissions } from "@/lib/apiAuth"; // Import auth helper
import { logAuditWithRequest, computeChanges } from "@/lib/auditLogger";

// Get single order detail by id, including supplier info for autofill
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getUserWithPermissions(req);
  if (!user) return jsonError(401, "unauthorized");

  const { id } = await context.params;
  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        seller: true, // Renamed from supplier
        buyer: { select: { id: true, name: true, taxId: true, address: true } }, // Renamed from company
        status: true,
        method: true,
        regulation: true,
        currency: true,
        items: true,
        request: true,
      },
    });
    if (!order) return jsonError(404, "not_found");

    // Multi-tenant Isolation: User must belong to the same tenant as the order
    if (!user.isSuperAdmin && (order as any).tenantId !== user.tenantId) {
      return jsonError(403, "tenant_mismatch", { message: "Bu veriye erişim yetkiniz yok (Firma uyuşmazlığı)." });
    }

    // Secondary Security Check
    const isSatinalma = user.unitLabel?.toLocaleLowerCase("tr-TR").includes("satınalma") || user.unitLabel?.toLowerCase().includes("satinlama");
    const hasFullAccess = user.isSuperAdmin || user.isAdmin || (user as any).role === "admin" || isSatinalma;
    // Check if user has access: Full Access OR Order belongs to user's unit (via request)
    const isSameUnit = order.request?.unitId === user.unitId;

    if (!hasFullAccess && !isSameUnit) {
      return jsonError(403, "forbidden_access", { message: "Bu siparişi görüntüleme yetkiniz yok." });
    }

    const totalNumber =
      typeof (order as any).realizedTotal?.toNumber === "function"
        ? (order as any).realizedTotal.toNumber()
        : Number((order as any).realizedTotal ?? 0);

    const payload = {
      id: order.id,
      barcode: order.barcode,
      refNumber: order.refNumber, // Include manual ref no
      date: order.createdAt?.toISOString?.() || null,
      estimatedDelivery: (order as any).estimatedDelivery?.toISOString?.() || null,
      total: totalNumber,
      // relations ids
      statusId: (order as any).statusId ?? order.status?.id ?? null,
      methodId: (order as any).methodId ?? order.method?.id ?? null,
      regulationId: (order as any).regulationId ?? order.regulation?.id ?? null,
      currencyId: (order as any).currencyId ?? order.currency?.id ?? null,
      supplierId: (order as any).supplierId ?? order.supplier?.id ?? null,
      companyId: (order as any).companyId ?? order.company?.id ?? null,
      requestId: (order as any).requestId ?? order.request?.id ?? null,
      // relation labels
      status: order.status?.label ?? null,
      method: order.method?.label ?? null,
      regulation: order.regulation?.label ?? null,
      currency: order.currency?.label ?? null,
      supplierName: order.seller?.name ?? null,
      supplierTaxId: (order as any).seller?.taxId ?? null,
      supplierAddress: (order as any).seller?.address ?? null,
      companyName: order.buyer?.name ?? null,
      companyTaxId: (order as any).buyer?.taxId ?? null,
      companyAddress: (order as any).buyer?.address ?? null,
      requestBarcode: order.request?.barcode ?? null,
      requestBudget: order.request?.budget ? Number(order.request.budget) : 0,
      // items
      items: Array.isArray(order.items)
        ? order.items.map((it: any) => ({
          id: it.id,
          name: it.name,
          sku: it.sku || null,
          quantity:
            typeof it.quantity?.toNumber === "function" ? it.quantity.toNumber() : Number(it.quantity as any),
          unitPrice:
            typeof it.unitPrice?.toNumber === "function" ? it.unitPrice.toNumber() : Number(it.unitPrice as any),
        }))
        : [],
    };
    return NextResponse.json(payload);
  } catch (e: any) {
    const code = e?.code === "P2025" ? "not_found" : "server_error";
    return jsonError(500, code, { message: e?.message });
  }
}

// Update order: supports basic fields and replacing items list
export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getUserWithPermissions(req);
  if (!user) return jsonError(401, "unauthorized");

  const { id } = await context.params;
  const orderId = String(id || "").trim();
  if (!orderId) return jsonError(404, "not_found");

  // Multi-tenant Isolation
  const existingOrder = await prisma.order.findUnique({ where: { id: orderId } });
  if (!existingOrder) return jsonError(404, "not_found");
  if (!user.isSuperAdmin && (existingOrder as any).tenantId !== user.tenantId) {
    return jsonError(403, "tenant_mismatch", { message: "Bu veriyi düzenleme yetkiniz yok." });
  }

  // Security Check: Only Admin or Satinalma can update orders
  const isSatinalma = user.unitLabel?.toLocaleLowerCase("tr-TR").includes("satınalma") || user.unitLabel?.toLowerCase().includes("satinlama");
  const hasFullAccess = user.isSuperAdmin || user.isAdmin || (user as any).role === "admin" || isSatinalma;

  if (!hasFullAccess) {
    return jsonError(403, "forbidden_edit", { message: "Sipariş güncelleme yetkiniz yok. Sadece Satınalma birimi yapabilir." });
  }
  try {
    const before = await prisma.order.findUnique({ where: { id: orderId }, include: { status: true, request: { include: { owner: true, responsible: true } } } });
    const body = await req.json().catch(() => ({}));
    const data: any = {};
    const errors: string[] = [];

    // Numbers
    if (typeof body.realizedTotal !== "undefined") {
      const totalNum = Number(body.realizedTotal);
      if (!Number.isFinite(totalNum) || totalNum < 0) errors.push("invalid_realizedTotal");
      else data.realizedTotal = totalNum;
    }

    // Relations via OptionItem
    const connectOption = async (field: string, value: any, relationKey: "status" | "method" | "regulation" | "currency") => {
      if (typeof value === "string" && value) {
        const ok = await prisma.optionItem.findUnique({ where: { id: value } });
        if (!ok) errors.push(`invalid_${field}`);
        else (data as any)[relationKey] = { connect: { id: value } };
      }
    };
    await connectOption("statusId", body.statusId, "status");
    await connectOption("methodId", body.methodId, "method");
    await connectOption("regulationId", body.regulationId, "regulation");
    await connectOption("currencyId", body.currencyId, "currency");

    // Seller (Supplier) & Buyer (Company)
    if (typeof body.supplierId === "string" && body.supplierId) {
      const sup = await prisma.tenant.findUnique({ where: { id: body.supplierId, isSupplier: true } });
      if (!sup) errors.push("invalid_supplierId");
      else data.seller = { connect: { id: body.supplierId } };
    }
    if (typeof body.companyId === "string" && body.companyId) {
      const comp = await prisma.tenant.findUnique({ where: { id: body.companyId, isBuyer: true } });
      if (!comp) errors.push("invalid_companyId");
      else data.buyer = { connect: { id: body.companyId } };
    }
    // Responsible user
    if (typeof body.responsibleUserId === "string") {
      const uid = body.responsibleUserId.trim();
      if (uid) {
        const u = await prisma.user.findUnique({ where: { id: uid } });
        if (!u) errors.push("invalid_responsibleUserId");
        else data.responsible = { connect: { id: uid } };
      } else {
        data.responsibleUserId = null;
      }
    }

    // Items replacement (optional)
    const items = Array.isArray(body.items) ? body.items : undefined;
    if (items) {
      for (const it of items) {
        const name = String(it?.name || "").trim();
        const qty = Number(it?.quantity);
        const up = Number(it?.unitPrice);
        if (!name) errors.push("item_name_required");
        if (!Number.isFinite(qty) || qty <= 0) errors.push("item_quantity_invalid");
        if (!Number.isFinite(up) || up < 0) errors.push("item_unitPrice_invalid");
      }
    }

    if (errors.length) return jsonError(400, "invalid_payload", { details: errors });

    // Execute update in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({ where: { id: orderId }, data });
      if (items) {
        await tx.orderItem.deleteMany({ where: { orderId } });
        if (items.length > 0) {
          await tx.orderItem.createMany({
            data: items.map((it: any) => ({ orderId, name: String(it.name).trim(), quantity: Number(it.quantity), unitPrice: Number(it.unitPrice) })),
          });
        }
      }
      return updated;
    });

    try {
      const after = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          status: true,
          responsible: true,
          seller: true, // Renamed from supplier
          request: { include: { owner: true, responsible: true, unit: true } }
        }
      });
      const prev = (before?.status?.label || "").toLowerCase();
      const next = (after?.status?.label || "").toLowerCase();
      const approvedWords = ["tamamlandı", "onaylı", "onaylanmış", "kapalı"];
      const wasApproved = approvedWords.includes(prev);
      const isApproved = approvedWords.includes(next);
      const orderRespId = (after as any)?.responsible?.id || null;
      const reqOwnerId = (after as any)?.request?.owner?.id || null;
      const reqRespId = (after as any)?.request?.responsible?.id || null;
      const targets = [orderRespId, reqOwnerId, reqRespId].filter(Boolean) as string[];
      for (const uid of targets) {
        await notify({ userId: uid, title: "Sipariş durumu güncellendi", body: `${after?.barcode || orderId} → ${after?.status?.label || ""}` });
      }
      // Email to recipients about status change
      const origin = (req as any)?.nextUrl?.origin || "";
      const link = origin ? `${origin}/siparis/detay/${encodeURIComponent(orderId)}` : `https://example.com/siparis/detay/${encodeURIComponent(orderId)}`;
      const unitLabel = String((after as any)?.request?.unit?.label || "");
      const subject = unitLabel ? `Sipariş Durumu Güncellendi – Birim: ${unitLabel}` : "Sipariş Durumu Güncellendi";
      const fields = [
        { label: "Sipariş No", value: String(after?.barcode || orderId) },
        ...(unitLabel ? [{ label: "Birim", value: unitLabel }] : []),
        { label: "Yeni Durum", value: String(after?.status?.label || "") },
        ...((after as any)?.estimatedDelivery ? [{ label: "Tahmini Teslim", value: new Date((after as any).estimatedDelivery).toLocaleDateString("tr-TR") }] : []),
        { label: "Değişiklik Tarihi", value: new Date().toLocaleString("tr-TR") },
      ];
      const html = renderEmailTemplate("detail", { title: subject, intro: "Sipariş durum güncellemesi detayları:", fields, items: [], actionUrl: link, actionText: "Detayı Aç" });
      const emails: string[] = [];
      if ((after as any)?.responsible?.email) emails.push(String((after as any).responsible.email));
      if ((after as any)?.request?.owner?.email) emails.push(String((after as any).request.owner.email));
      if ((after as any)?.request?.responsible?.email) emails.push(String((after as any).request.responsible.email));
      if ((after as any)?.request?.unitEmail) emails.push(String((after as any).request.unitEmail));
      for (const to of Array.from(new Set(emails)).filter(Boolean)) {
        await dispatchEmail({ to, subject, html, category: "order_status" });
      }

      // SPECIAL: Send evaluation request email when order becomes "Tamamlandı"
      const wasCompleted = prev.includes("tamamlan");
      const isCompleted = next.includes("tamamlan");
      if (!wasCompleted && isCompleted) {
        const evalLink = origin
          ? `${origin}/tedarikci/degerlendirme?orderId=${encodeURIComponent(orderId)}`
          : `https://example.com/tedarikci/degerlendirme?orderId=${encodeURIComponent(orderId)}`;
        const supplierName = (after as any)?.supplier?.name || "Tedarikçi";
        const evalSubject = unitLabel
          ? `Tedarikçi Değerlendirmesi Bekleniyor – ${supplierName} – Birim: ${unitLabel}`
          : `Tedarikçi Değerlendirmesi Bekleniyor – ${supplierName}`;
        const evalFields = [
          { label: "Sipariş No", value: String(after?.barcode || orderId) },
          { label: "Tedarikçi", value: supplierName },
          ...(unitLabel ? [{ label: "Birim", value: unitLabel }] : []),
          { label: "Tamamlanma Tarihi", value: new Date().toLocaleDateString("tr-TR") },
          { label: "Değerlendirme Süresi", value: "7 gün içinde değerlendirmenizi yapmanız beklenmektedir." },
        ];
        const evalHtml = renderEmailTemplate("detail", {
          title: "Tedarikçi Değerlendirmesi Bekleniyor",
          intro: `"${supplierName}" tedarikçisi ile tamamlanan sipariş için değerlendirme yapmanız gerekmektedir. Lütfen aşağıdaki butona tıklayarak değerlendirme formunu doldurunuz.`,
          fields: evalFields,
          items: [],
          actionUrl: evalLink,
          actionText: "Değerlendirme Yap"
        });
        // Send to unit email and request owner
        const evalEmails: string[] = [];
        if ((after as any)?.request?.unitEmail) evalEmails.push(String((after as any).request.unitEmail));
        if ((after as any)?.request?.owner?.email) evalEmails.push(String((after as any).request.owner.email));
        for (const to of Array.from(new Set(evalEmails)).filter(Boolean)) {
          await dispatchEmail({ to, subject: evalSubject, html: evalHtml, category: "evaluation_request" });
        }
      }

      // SUPPLIER NOTIFICATION: Send order confirmation email when status becomes "Onaylandı" or "Sipariş Geçildi"
      const approvalWords = ["onaylı", "onaylanmış", "onaylan", "sipariş geçildi", "siparis gecildi"];
      const wasApprovedBefore = approvalWords.some(w => prev.includes(w));
      const isNowApproved = approvalWords.some(w => next.includes(w));
      const supplierEmail = (after as any)?.supplier?.email;

      if (!wasApprovedBefore && isNowApproved && supplierEmail) {
        const supplierName = (after as any)?.seller?.name || "Tedarikçi";
        const companyName = (after as any)?.buyer?.name || "";
        const orderTotal = typeof (after as any)?.realizedTotal?.toNumber === "function"
          ? (after as any).realizedTotal.toNumber()
          : Number((after as any)?.realizedTotal ?? 0);
        const currencyLabel = (after as any)?.currency?.label || "TRY";
        // ... rest of logic for supplier email ...
        const orderItems = await prisma.orderItem.findMany({ where: { orderId } });

        const supplierSubject = `Sipariş Onayı – ${after?.barcode} – ${companyName}`;
        const supplierFields = [
          { label: "Sipariş No", value: String(after?.barcode || orderId) },
          ...(after?.refNumber ? [{ label: "Referans No", value: after.refNumber }] : []),
          { label: "Alıcı Firma", value: companyName },
          { label: "Sipariş Durumu", value: String(after?.status?.label || "") },
          { label: "Toplam Tutar", value: `${orderTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ${currencyLabel}` },
          { label: "Sipariş Tarihi", value: new Date().toLocaleDateString("tr-TR") },
        ];
        const supplierItemsList = orderItems.map((it: any) => ({
          name: it.name,
          quantity: typeof it.quantity?.toNumber === "function" ? it.quantity.toNumber() : Number(it.quantity),
          unitPrice: typeof it.unitPrice?.toNumber === "function" ? it.unitPrice.toNumber() : Number(it.unitPrice),
        }));

        const supplierHtml = renderEmailTemplate("detail", {
          title: "Siparişiniz Onaylandı",
          intro: `Sayın ${supplierName}, siparişiniz onaylanmıştır. Aşağıda sipariş detaylarını bulabilirsiniz.`,
          fields: supplierFields,
          items: supplierItemsList,
          actionUrl: "",
          actionText: ""
        });

        try {
          await dispatchEmail({ to: supplierEmail, subject: supplierSubject, html: supplierHtml, category: "supplier_order_notification" });
          // Email sent
        } catch (emailErr) {
          // Email sent
        }
      }
    } catch { }

    // Audit log for order update
    try {
      const changes = computeChanges(before || {}, result || {});
      if (changes) {
        await logAuditWithRequest(req, {
          userId: user.id,
          action: "UPDATE",
          entityType: "Order",
          entityId: result.id,
          oldData: changes.old,
          newData: changes.new,
        });
      }
    } catch (auditErr) {
      console.error("[AuditLog] Failed to log order update:", auditErr);
    }

    return NextResponse.json({ ok: true, id: result.id });
  } catch (e: any) {
    const code = e?.code === "P2025" ? "not_found" : "server_error";
    return jsonError(500, code, { message: e?.message });
  }
}

// Delete order safely: detach nullable relations, remove items, then delete order
export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getUserWithPermissions(req);
  if (!user) return jsonError(401, "unauthorized");

  const { id } = await context.params;
  const orderId = String(id || "").trim();
  if (!orderId) return jsonError(404, "not_found");

  // Multi-tenant Isolation
  const existingOrder = await prisma.order.findUnique({ where: { id: orderId } });
  if (!existingOrder) return jsonError(404, "not_found");
  if (!user.isSuperAdmin && (existingOrder as any).tenantId !== user.tenantId) {
    return jsonError(403, "tenant_mismatch", { message: "Bu veriyi silme yetkiniz yok." });
  }

  // Security Check: Only Admin or Satinalma can delete orders
  const isSatinalma = user.unitLabel?.toLocaleLowerCase("tr-TR").includes("satınalma") || user.unitLabel?.toLowerCase().includes("satinlama");
  const hasFullAccess = user.isSuperAdmin || user.isAdmin || (user as any).role === "admin" || isSatinalma;

  if (!hasFullAccess) {
    return jsonError(403, "forbidden_delete", { message: "Sipariş silme yetkiniz yok." });
  }
  try {
    await prisma.$transaction(async (tx) => {
      // 1) First, remove delivery items (they reference order items via orderItemId)
      const deliveries = await tx.deliveryReceipt.findMany({ where: { orderId }, select: { id: true } });
      if (deliveries.length > 0) {
        const deliveryIds = deliveries.map((d) => d.id);
        await tx.deliveryItem.deleteMany({ where: { deliveryId: { in: deliveryIds } } });
        await tx.attachment.deleteMany({ where: { deliveryId: { in: deliveryIds } } });
        await tx.deliveryReceipt.deleteMany({ where: { id: { in: deliveryIds } } });
      }

      // 2) Now safe to remove order items
      await tx.orderItem.deleteMany({ where: { orderId } });

      // 3) Remove delivery tokens  
      await tx.deliveryToken.deleteMany({ where: { orderId } });

      // 4) Null-out nullable relations
      await tx.contract.updateMany({ where: { orderId }, data: { orderId: null } });
      await tx.invoice.updateMany({ where: { orderId }, data: { orderId: null } });

      // 5) Supplier evaluations linked to order: delete answers by evaluation, then evaluations
      const evals = await tx.supplierEvaluation.findMany({ where: { orderId }, select: { id: true } });
      if (evals.length > 0) {
        const evalIds = evals.map((e) => e.id);
        await tx.supplierEvaluationAnswer.deleteMany({ where: { evaluationId: { in: evalIds } } });
        await tx.supplierEvaluation.deleteMany({ where: { id: { in: evalIds } } });
      }
      // 6) Finally delete order
      await tx.order.delete({ where: { id: orderId } });
    });
    // Audit log for order deletion
    await logAuditWithRequest(req, {
      userId: user.id,
      action: "DELETE",
      entityType: "Order",
      entityId: orderId,
      oldData: { barcode: (await prisma.order.findUnique({ where: { id: orderId }, select: { barcode: true } }))?.barcode || orderId },
    });

    return NextResponse.json({ ok: true, id: orderId });
  } catch (e: any) {
    const code = e?.code === "P2025" ? "not_found" : "server_error";
    return jsonError(500, code, { message: e?.message });
  }
}
