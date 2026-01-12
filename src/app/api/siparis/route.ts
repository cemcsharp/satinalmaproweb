import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { parseDecimalFlexible } from "@/lib/format";
import { jsonError } from "@/lib/apiError";
import { requirePermissionApi } from "@/lib/apiAuth";
import { dispatchEmail, renderEmailTemplate } from "@/lib/mailer";
import { logAuditWithRequest } from "@/lib/auditLogger";

type CreateOrderBody = {
  barcode: string;
  statusId: string;
  methodId: string;
  regulationId: string;
  currencyId: string;
  supplierId: string;
  companyId: string;
  requestBarcode?: string;
  responsibleUserId?: string;
  estimatedDelivery?: string;
  items: { name: string; quantity: number | string; unitPrice: number | string; unitId?: string; extraCosts?: number | string }[];
};

/**
 * @swagger
 * /api/siparis:
 *   post:
 *     summary: Yeni satın alma siparişi oluştur
 *     description: Talebe istinaden veya bağımsız olarak yeni bir sipariş oluşturur. Birim ataması ve kalem detaylarını içerir.
 *     tags:
 *       - Order
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
 *               - statusId
 *               - methodId
 *               - regulationId
 *               - currencyId
 *               - supplierId
 *             properties:
 *               barcode: { type: 'string', description: 'Benzersiz sipariş barkodu' }
 *               statusId: { type: 'string', description: 'Durum ID' }
 *               methodId: { type: 'string', description: 'Satınalma yöntemi ID' }
 *               regulationId: { type: 'string', description: 'Mevzuat ID' }
 *               currencyId: { type: 'string', description: 'Para birimi ID' }
 *               supplierId: { type: 'string', description: 'Tedarikçi ID' }
 *               companyId: { type: 'string', description: 'Şirket ID' }
 *               requestBarcode: { type: 'string', description: 'İlgili talep barkodu (isteğe bağlı)' }
 *               responsibleUserId: { type: 'string', description: 'Sorumlu kullanıcı ID' }
 *               estimatedDelivery: { type: 'string', format: 'date-time', description: 'Tahmini teslimat tarihi' }
 *               items:
 *                 type: 'array',
 *                 items:
 *                   type: 'object',
 *                   required: [name, quantity, unitPrice]
 *                   properties:
 *                     name: { type: 'string' }
 *                     quantity: { type: 'number' }
 *                     unitPrice: { type: 'number' }
 *                     unitId: { type: 'string' }
 *                     extraCosts: { type: 'number' }
 *     responses:
 *       201:
 *         description: Sipariş başarıyla oluşturuldu
 *       400:
 *         description: Geçersiz veri veya eksik alanlar
 *       403:
 *         description: Yetkisiz erişim
 *       409:
 *         description: Barkod çakışması
 */
export async function POST(req: NextRequest) {
  try {
    // Permission check: siparis:create required
    const user = await requirePermissionApi(req, "siparis:create");
    if (!user) return jsonError(403, "forbidden", { message: "Sipariş oluşturma yetkiniz yok." });

    const body = (await req.json()) as CreateOrderBody;
    const isSatinalma = user.unitLabel?.toLocaleLowerCase("tr-TR").includes("satınalma") || user.unitLabel?.toLowerCase().includes("satinlama");
    const hasFullAccess = user.isAdmin || isSatinalma;

    // Safety check: Avoid creating orders without request linking unless Admin/Satinalma
    // Actually, even satinalma should link to a request usually. 
    // But if they want to create ad-hoc order (e.g. direct purchase), we allow it ONLY if they specify unit or if we can infer it.
    // For now, let's just allow it but warn or ensure requestId is present if possible.
    // User requested "Sipariş oluştururken birim atamasını zorunlu kılalım".

    if (!body.requestBarcode && !hasFullAccess) {
      return jsonError(400, "request_required", { message: "Normal kullanıcılar sadece bir talebe istinaden sipariş oluşturabilir." });
    }
    if (!body?.barcode || !body.statusId || !body.methodId || !body.regulationId || !body.currencyId || !body.supplierId) {
      return jsonError(400, "missing_fields");
    }
    const existing = await prisma.order.findUnique({ where: { barcode: body.barcode.trim() } });
    if (existing) return jsonError(409, "duplicate_barcode");

    // Tek şirketli senaryo için companyId fallback: gelmezse otomatik seç
    let companyId = body.companyId?.trim();
    if (!companyId) {
      const companies = await prisma.company.findMany({ select: { id: true }, take: 2 });
      if (companies.length === 1) {
        companyId = companies[0].id;
      } else {
        return jsonError(400, "missing_company");
      }
    }

    let requestId: string | undefined = undefined;
    if (body.requestBarcode) {
      const reqFound = await prisma.request.findUnique({ where: { barcode: body.requestBarcode.trim() } });
      if (reqFound) requestId = reqFound.id;
    }

    const parsedItems = (body.items || []).map((i) => {
      const q = typeof i.quantity === "string" ? parseDecimalFlexible(i.quantity) : Number(i.quantity);
      const up = typeof i.unitPrice === "string" ? parseDecimalFlexible(i.unitPrice) : Number(i.unitPrice);
      const ec = typeof i.extraCosts === "string" ? parseDecimalFlexible(i.extraCosts) : Number(i.extraCosts || 0);
      if (q == null || up == null || (!Number.isFinite(q)) || (!Number.isFinite(up)) || (!Number.isFinite(ec || 0))) {
        throw new Error("invalid_number_format");
      }
      return { name: i.name.trim(), quantity: Math.max(q, 0), unitPrice: Math.max(up, 0), extraCosts: Math.max(ec || 0, 0), unitId: i.unitId };
    });
    const total = parsedItems.reduce((sum, it) => sum + (it.quantity * it.unitPrice) + (it.extraCosts || 0), 0);

    const created = await prisma.order.create({
      data: {
        barcode: body.barcode.trim(),
        statusId: body.statusId,
        methodId: body.methodId,
        regulationId: body.regulationId,
        currencyId: body.currencyId,
        supplierId: body.supplierId,
        companyId,
        realizedTotal: total,
        requestId,
        tenantId: user.tenantId, // Multi-tenant
        estimatedDelivery: (typeof body.estimatedDelivery === "string" && body.estimatedDelivery) ? new Date(body.estimatedDelivery) : undefined,
        ...(body.responsibleUserId ? { responsibleUserId: String(body.responsibleUserId) } : {}),
        items: parsedItems.length > 0 ? {
          create: parsedItems.map((i) => ({ name: i.name.trim(), quantity: i.quantity, unitPrice: i.unitPrice }))
        } : undefined,
      } as any,
      select: { id: true, barcode: true }
    });
    // Email: Yeni Sipariş Oluşturuldu
    try {
      const origin = req.nextUrl.origin;
      const link = `${origin}/siparis/detay/${encodeURIComponent(created.id)}`;
      // Responsible, order.request owner, company email
      const after = await prisma.order.findUnique({ where: { id: created.id }, include: { status: true, method: true, responsible: true, company: true, request: { include: { owner: true, unit: true } }, items: true } });
      const total = (after?.items || []).reduce((sum: number, it: any) => sum + Number(it.quantity) * Number(it.unitPrice), 0);
      const unitLabel = String((after as any)?.request?.unit?.label || "");

      // Budget difference calculation
      const requestBudget = (after as any)?.request?.budget ? Number((after as any).request.budget) : null;
      const budgetDiff = requestBudget !== null ? requestBudget - total : 0;
      const budgetStatus = budgetDiff > 0 ? "Bütçe Altında" : budgetDiff < 0 ? "Bütçe Aşımı" : "Tam Uyumlu";

      const fields = [
        { label: "Sipariş No", value: String(created.barcode) },
        ...(unitLabel ? [{ label: "Birim", value: unitLabel }] : []),
        { label: "Durum", value: String((after as any)?.status?.label || "") },
        { label: "Yöntem", value: String((after as any)?.method?.label || "") },
        ...(requestBudget !== null ? [{ label: "Talep Bütçesi", value: `${requestBudget.toFixed(2)} TL` }] : []),
        { label: "Sipariş Toplamı", value: `${total.toFixed(2)} TL` },
        ...(requestBudget !== null ? [{ label: "Bütçe Farkı", value: `${Math.abs(budgetDiff).toFixed(2)} TL (${budgetStatus})` }] : []),
        ...((after as any)?.estimatedDelivery ? [{ label: "Tahmini Teslim", value: new Date((after as any).estimatedDelivery).toLocaleDateString("tr-TR") }] : []),
      ];
      const items = (after?.items || []).map((it: any) => ({ name: String(it.name), quantity: Number(it.quantity), unitPrice: Number(it.unitPrice) }));
      const html = renderEmailTemplate("detail", {
        title: "Yeni Sipariş Oluşturuldu",
        intro: "Aşağıda siparişin kısa özeti ve kalemleri yer almaktadır.",
        fields,
        items,
        actionUrl: link,
        actionText: "Siparişi Aç",
      });
      const subject = unitLabel ? `Yeni Sipariş Oluşturuldu – Birim: ${unitLabel}` : "Yeni Sipariş Oluşturuldu";
      const targets: string[] = [];
      if ((after as any)?.responsible?.email) targets.push(String((after as any).responsible.email));
      if ((after as any)?.request?.owner?.email) targets.push(String((after as any).request.owner.email));
      if ((after as any)?.company?.email) targets.push(String((after as any).company.email));
      if ((after as any)?.request?.unitEmail) targets.push(String((after as any).request.unitEmail));
      for (const to of Array.from(new Set(targets)).filter(Boolean)) {
        await dispatchEmail({ to, subject, html, category: "order_create" });
      }
    } catch { }

    // Audit log for order creation
    await logAuditWithRequest(req, {
      userId: user.id,
      action: "CREATE",
      entityType: "Order",
      entityId: created.id,
      newData: { barcode: created.barcode, supplierId: body.supplierId, total },
    });

    return NextResponse.json({ ok: true, id: created.id, barcode: created.barcode }, { status: 201 });
  } catch (e: any) {
    if (e?.message === "invalid_number_format") {
      return jsonError(400, "invalid_number_format");
    }
    console.error(e);
    return jsonError(500, "server_error", { message: e?.message });
  }
}

/**
 * @swagger
 * /api/siparis:
 *   get:
 *     summary: Siparişleri listele
 *     description: Yetki dahilindeki siparişleri filtreleme ve sıralama seçenekleriyle listeler.
 *     tags:
 *       - Order
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: 'string' }
 *         description: Barkod veya referans numarasında arama
 *       - in: query
 *         name: status
 *         schema: { type: 'string' }
 *         description: Durum etiketine göre filtrele
 *       - in: query
 *         name: method
 *         schema: { type: 'string' }
 *         description: Yöntem etiketine göre filtrele
 *       - in: query
 *         name: dateFrom
 *         schema: { type: 'string', format: 'date' }
 *       - in: query
 *         name: dateTo
 *         schema: { type: 'string', format: 'date' }
 *       - in: query
 *         name: sortBy
 *         schema: { type: 'string', enum: [date, total], default: date }
 *       - in: query
 *         name: sortDir
 *         schema: { type: 'string', enum: [asc, desc], default: desc }
 *       - in: query
 *         name: page
 *         schema: { type: 'integer', default: 1 }
 *       - in: query
 *         name: pageSize
 *         schema: { type: 'integer', default: 20 }
 *       - in: query
 *         name: mode
 *         schema: { type: 'string', enum: [pending-delivery] }
 *         description: Özel görünüm modları
 *     responses:
 *       200:
 *         description: Sipariş listesi başarıyla döndürüldü
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: 'array'
 *                   items: { $ref: '#/components/schemas/Order' }
 *                 total: { type: 'integer' }
 *                 page: { type: 'integer' }
 *                 pageSize: { type: 'integer' }
 *                 totalPages: { type: 'integer' }
 */
export async function GET(req: NextRequest) {
  try {
    // Permission check: siparis:read required
    const user = await requirePermissionApi(req, "siparis:read");
    if (!user) return jsonError(403, "forbidden", { message: "Sipariş görüntüleme yetkiniz yok." });

    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.trim() || ""; // barcode
    const status = url.searchParams.get("status")?.trim() || ""; // label
    const method = url.searchParams.get("method")?.trim() || ""; // label
    const dateFrom = url.searchParams.get("dateFrom");
    const dateTo = url.searchParams.get("dateTo");
    const sortBy = (url.searchParams.get("sortBy") || "date") as "date" | "total";
    const sortDir = (url.searchParams.get("sortDir") || "desc") as "asc" | "desc";
    const page = Math.max(1, Number(url.searchParams.get("page") || 1));
    const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("pageSize") || 20)));
    const reviewPendingParam = (url.searchParams.get("reviewPending") || "").toLowerCase();
    const reviewPending = reviewPendingParam === "1" || reviewPendingParam === "true";
    const unit = url.searchParams.get("unit") || "";
    const statusId = url.searchParams.get("statusId");
    const mode = url.searchParams.get("mode"); // 'pending-delivery'

    // Status Filter Construction
    let statusFilter: any = {};
    if (statusId) {
      statusFilter = { statusId };
    } else if (mode === "pending-delivery") {
      // Fetch active statuses for delivery (Approved, Ordered, Partial)
      // Excluding: Draft, Pending Approval, Completed, Cancelled
      // We need to match label names or specific IDs. 
      // For robustness, let's fetch IDs for "Sipariş Verildi", "Onaylandı", "Kısmi Teslimat"
      const targetStatuses = ["Sipariş Verildi", "Onaylandı", "Kısmi Teslimat"];
      const statusItems = await prisma.optionItem.findMany({
        where: { category: { key: "siparisDurumu" }, label: { in: targetStatuses } },
        select: { id: true }
      });
      if (statusItems.length > 0) {
        statusFilter = { statusId: { in: statusItems.map((s: any) => s.id) } };
      }
    }
    // Only apply status filter if we have one
    const where: any = {
      ...(Object.keys(statusFilter).length > 0 ? statusFilter : {}),
    };

    if (q) {
      where.OR = [
        { barcode: { contains: q, mode: "insensitive" } },
        { refNumber: { contains: q, mode: "insensitive" } }
      ];
    }
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }
    if (status) {
      where.status = { is: { label: status } };
    }
    if (method) {
      where.method = { is: { label: method } };
    }

    // MULTI-TENANT: Apply enterprise/firm isolation
    if (!user.isSuperAdmin) {
      where.tenantId = user.tenantId;
    }

    // Unit-based data isolation: non-admin users only see their unit's data
    // Unit-based data isolation
    const isSatinalmaFilter = user.unitLabel?.toLocaleLowerCase("tr-TR").includes("satınalma") || user.unitLabel?.toLowerCase().includes("satinlama");
    const hasFullAccess = user.isAdmin || isSatinalmaFilter;

    if (!hasFullAccess) {
      if (user.unitId) {
        where.request = { is: { unitId: user.unitId } };
      } else {
        // No unit, no access (unless specifically granted somehow, but safe default is block)
        where.request = { is: { unitId: "___NO_ACCESS___" } };
      }
    } else if (unit) {
      // Admin/Satinalma can filter by unit
      where.request = { is: { unit: { is: { label: unit } } } };
    }

    // For reviewPending: show completed/invoiced orders with no evaluations
    if (reviewPending) {
      where.OR = [
        { status: { is: { label: { contains: "tamamlan", mode: "insensitive" } } } },
        { status: { is: { label: { contains: "faturalandı", mode: "insensitive" } } } },
      ];
      where.evaluations = { none: {} };
    }

    const include = {
      status: true,
      method: true,
      currency: true,
      request: { include: { unit: true } },
      _count: { select: { evaluations: true } },
    };

    const total = await prisma.order.count({ where });
    const rows = await prisma.order.findMany({
      where,
      include,
      orderBy: sortBy === "date" ? { createdAt: sortDir } : { realizedTotal: sortDir },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const mapped = rows.map((o: any) => ({
      id: o.id,
      barcode: o.barcode,
      refNumber: o.refNumber || "", // Include user ref no
      date: o.createdAt.toISOString(),
      status: o.status?.label || "",
      method: o.method?.label || "",
      currency: o.currency?.label || "",
      unit: (o as any).request?.unit?.label || "",
      total: typeof (o as any).realizedTotal?.toNumber === "function" ? (o as any).realizedTotal.toNumber() : Number(o.realizedTotal as any),
      hasEvaluation: (o as any)._count?.evaluations > 0,
      reviewPending: ((o as any)._count?.evaluations === 0) && ((o.status?.label || "").toLowerCase().includes("tamamlan")),
    }));

    return NextResponse.json({
      items: mapped,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
  } catch (e) {
    console.error(e);
    return jsonError(500, "list_failed");
  }
}
