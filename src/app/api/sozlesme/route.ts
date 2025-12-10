import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/apiError";
import { dispatchEmail, renderEmailTemplate } from "@/lib/mailer";

// Standardized list API: supports filtering, sorting and pagination
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
    if (!userHasPermission(user, "sozlesme:read")) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const status = searchParams.get("status") || "";
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const sortBy = (searchParams.get("sortBy") || "date") as "date" | "number";
    const sortDir = (searchParams.get("sortDir") || "desc") as "asc" | "desc";
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") || 20)));
    const expiry = (searchParams.get("expiry") || "") as "" | "expiring" | "expired" | "active" | "perpetual";

    // Base filters
    const baseFilters: any[] = [
      q
        ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { number: { contains: q, mode: "insensitive" } },
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
      (() => {
        if (!expiry) return {};
        const now = new Date();
        const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
        if (expiry === "expired") return { endDate: { lt: now } };
        if (expiry === "expiring") return { AND: [{ endDate: { gte: now } }, { endDate: { lte: addDays(now, 30) } }] };
        if (expiry === "active") return { AND: [{ startDate: { lte: now } }, { OR: [{ endDate: null }, { endDate: { gt: now } }] }] };
        if (expiry === "perpetual") return { endDate: null };
        return {};
      })(),
    ];

    // Unit-based data isolation
    if (!user.isAdmin && user.unitId) {
      // Contracts are linked to orders, orders to requests, requests to units
      baseFilters.push({
        order: {
          request: {
            unitId: user.unitId
          }
        }
      });
    }

    // Prefer soft-delete filter, but be resilient if column doesn't exist yet
    let where: any = { AND: [{ deletedAt: null }, ...baseFilters] };

    const orderBy =
      sortBy === "number"
        ? ({ number: sortDir } as any)
        : ({ createdAt: sortDir } as any);

    try {
      const [items, total] = await Promise.all([
        prisma.contract.findMany({ where, orderBy, skip: (page - 1) * pageSize, take: pageSize }),
        prisma.contract.count({ where }),
      ]);
      return NextResponse.json({ items, total, page, pageSize });
    } catch (e: any) {
      const msg = String(e?.message || "");
      const isDeletedAtIssue = msg.includes("deletedAt") || msg.includes("Unknown arg `deletedAt`");
      if (!isDeletedAtIssue) throw e;
      // Retry without soft-delete filter as a fallback (migration not applied yet)
      where = { AND: [...baseFilters] };
      const [items, total] = await Promise.all([
        prisma.contract.findMany({ where, orderBy, skip: (page - 1) * pageSize, take: pageSize }),
        prisma.contract.count({ where }),
      ]);
      return NextResponse.json({ items, total, page, pageSize, warning: "soft_delete_unavailable" });
    }
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
    if (!userHasPermission(user, "sozlesme:create")) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const numberRaw = body?.number;
    const title = String(body?.title || "").trim();
    const type = String(body?.type || "").trim();
    const template = (body?.template ? String(body.template).trim() : "") || null;
    const partiesRaw = body?.parties;
    const parties = Array.isArray(partiesRaw)
      ? partiesRaw.map((x: any) => String(x)).join(", ")
      : String(partiesRaw || "").trim();
    const startDateRaw = body?.startDate;
    const endDateRaw = body?.endDate;
    const status = String(body?.status || "Taslak").trim();
    const responsibleUserId = typeof body?.responsibleUserId === "string" ? String(body.responsibleUserId).trim() || null : null;
    const orderId = body?.orderId ?? null;

    const startDate = startDateRaw ? new Date(startDateRaw) : null;
    const endDate = endDateRaw ? new Date(endDateRaw) : null;

    const details: string[] = [];
    if (!title) details.push("title_required");
    if (!type) details.push("type_required");
    if (!parties) details.push("parties_required");
    if (!startDate || isNaN(startDate.getTime())) details.push("invalid_startDate");
    // Bitiş tarihi opsiyonel olmalı; yalnızca gönderilmişse doğrula
    if (endDateRaw && (!endDate || isNaN(endDate.getTime()))) details.push("invalid_endDate");
    if (!status) details.push("status_required");
    if (startDate && endDate && startDate > endDate) details.push("start_after_end");
    if (details.length) return jsonError(400, "invalid_payload", { details });

    // Duplicate guard: same order + same title + overlapping period
    // Duplicate guard
    // - Eğer bitiş tarihi varsa: tarih aralığı çakışmasını kontrol et
    // - Eğer yoksa: aynı başlık ve aynı başlangıç tarihine sahip kaydı kontrol et
    if (orderId && title && startDate) {
      const where = endDate
        ? {
          orderId,
          title: { equals: title },
          AND: [
            { startDate: { lte: endDate } },
            { endDate: { gte: startDate } },
          ],
        }
        : {
          orderId,
          title: { equals: title },
          startDate,
        };
      const duplicate = await prisma.contract.findFirst({ where });
      if (duplicate) {
        return jsonError(409, "duplicate_contract", { details: { id: duplicate.id, number: duplicate.number } });
      }
    }

    const generatedNumber = numberRaw || `S-${new Date().getFullYear()}-${Date.now()}`;
    const data: any = {
      number: generatedNumber,
      title,
      type,
      template,
      parties,
      startDate: startDate as Date,
      status,
      orderId,
    };
    if (endDate) data.endDate = endDate as Date;
    if (responsibleUserId) data.responsible = { connect: { id: responsibleUserId } };

    // Attachments ekle (varsa)
    if (Array.isArray(body?.attachments) && body.attachments.length > 0) {
      data.attachments = {
        create: body.attachments.map((att: any) => ({
          title: String(att.title || ""),
          url: String(att.url || ""),
          mimeType: String(att.mimeType || ""),
        })),
      };
    }

    const created = await prisma.contract.create({ data });
    try {
      const origin = req.nextUrl.origin;
      const link = `${origin}/sozlesme/detay/${encodeURIComponent(created.id)}`;
      const after = await prisma.contract.findUnique({ where: { id: created.id }, include: { order: { include: { request: { include: { unit: true, owner: true } } } } } });
      const unitLabel = String((after as any)?.order?.request?.unit?.label || "");
      const fields = [
        { label: "Sözleşme No", value: String(created.number) },
        { label: "Başlık", value: String(created.title) },
        ...(unitLabel ? [{ label: "Birim", value: unitLabel }] : []),
        { label: "Başlangıç", value: created.startDate.toISOString().slice(0, 10) },
        ...((created.endDate ? [{ label: "Bitiş", value: created.endDate.toISOString().slice(0, 10) }] : [])),
      ];
      const html = renderEmailTemplate("detail", {
        title: unitLabel ? `Yeni Sözleşme Oluşturuldu – Birim: ${unitLabel}` : "Yeni Sözleşme Oluşturuldu",
        intro: "Sözleşmenin kısa özeti aşağıdadır.",
        fields,
        items: [],
        actionUrl: link,
        actionText: "Sözleşmeyi Aç",
      });
      const subject = unitLabel ? `Yeni Sözleşme Oluşturuldu – Birim: ${unitLabel}` : "Yeni Sözleşme Oluşturuldu";
      const emails: string[] = [];
      const resp = created.responsibleUserId ? await prisma.user.findUnique({ where: { id: created.responsibleUserId } }) : null;
      if (resp?.email) emails.push(String(resp.email));
      if (created.orderId) {
        const ord = await prisma.order.findUnique({ where: { id: created.orderId }, include: { request: { include: { owner: true } } } });
        const ownerEmail = (ord as any)?.request?.owner?.email || null;
        const unitEmail = (ord as any)?.request?.unitEmail || null;
        if (ownerEmail) emails.push(String(ownerEmail));
        if (unitEmail) emails.push(String(unitEmail));
      }
      for (const to of Array.from(new Set(emails)).filter(Boolean)) {
        await dispatchEmail({ to, subject, html, category: "contract_create" });
      }
    } catch { }
    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    const code = e?.code;
    if (code === "P2002") {
      return jsonError(409, "duplicate_number");
    }
    return jsonError(500, "contract_create_failed", { message: e?.message });
  }
}
