import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/apiError";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

// Get single supplier detail with lightweight aggregates
export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const safeId = String(id || "").trim();
  if (!safeId) return jsonError(404, "not_found");
  try {
    const supplier = await prisma.supplier.findUnique({ where: { id: safeId } });
    if (!supplier) return jsonError(404, "not_found");

    // Latest evaluation summary (by period desc)
    const latestSummary = await prisma.supplierEvaluationSummary.findFirst({
      where: { supplierId: safeId },
      orderBy: { period: "desc" },
    });

    // Metrics for the same latest period if exists
    const latestMetrics = latestSummary
      ? await prisma.supplierPerformanceMetric.findMany({ where: { supplierId: safeId, period: latestSummary.period } })
      : [];

    // Recent orders count (last 6 months)
    const since = new Date();
    since.setMonth(since.getMonth() - 6);
    const recentOrders = await prisma.order.count({ where: { supplierId: safeId, createdAt: { gte: since } } });




    const payload = {
      id: supplier.id,
      name: supplier.name,
      active: supplier.active,
      taxId: (supplier as any).taxId ?? null,
      contactName: (supplier as any).contactName ?? null,
      email: (supplier as any).email ?? null,
      phone: (supplier as any).phone ?? null,
      address: (supplier as any).address ?? null,
      website: (supplier as any).website ?? null,
      notes: (supplier as any).notes ?? null,
      createdAt: (supplier as any).createdAt?.toISOString?.() ?? null,
      aggregates: {
        recentOrders,

        latestSummary: latestSummary
          ? {
            period: latestSummary.period,
            qualityScore: (latestSummary as any).qualityScore ?? 0,
            deliveryScore: (latestSummary as any).deliveryScore ?? 0,
            costScore: (latestSummary as any).costScore ?? 0,
            serviceScore: (latestSummary as any).serviceScore ?? 0,
            totalScore: (latestSummary as any).totalScore ?? 0,
            decision: (latestSummary as any).decision ?? null,
          }
          : null,
        latestMetrics: Array.isArray(latestMetrics)
          ? latestMetrics.map((m: any) => ({
            id: m.id,
            period: m.period,
            source: m.source,
            onTimeRate: m.onTimeRate ?? null,
            defectRate: m.defectRate ?? null,
            avgLeadTime: m.avgLeadTime ?? null,
            priceIndex: m.priceIndex ?? null,
            serviceScore: m.serviceScore ?? null,
          }))
          : [],
      },
    };
    return NextResponse.json(payload);
  } catch (e: any) {
    return jsonError(500, "server_error", { message: e?.message });
  }
}

// Minimal PATCH to update supplier core fields with validation
export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const safeId = String(id || "").trim();
  if (!safeId) return jsonError(404, "not_found");
  try {
    const session = await getServerSession(authOptions);
    if (!session) return jsonError(401, "unauthorized");

    const body = await req.json().catch(() => ({}));
    const data: any = {};
    const errors: string[] = [];

    const setStr = (key: string) => {
      if (body[key] !== undefined) {
        const v = String(body[key] || "").trim();
        data[key] = v || null;
      }
    };
    if (body.name !== undefined) {
      const v = String(body.name || "").trim();
      if (!v) errors.push("name_required");
      else data.name = v;
    }
    setStr("taxId");
    setStr("contactName");
    setStr("email");
    setStr("phone");
    setStr("address");
    setStr("website");
    setStr("notes");
    if (body.active !== undefined) data.active = Boolean(body.active);

    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.push("invalid_email");
    if (data.phone && String(data.phone).replace(/\D/g, "").length < 7) errors.push("invalid_phone");
    if (data.taxId && String(data.taxId).replace(/\D/g, "").length < 8) errors.push("invalid_taxId");
    if (errors.length) return jsonError(400, "validation_failed", { details: errors });

    const updated = await prisma.supplier.update({ where: { id: safeId }, data });
    return NextResponse.json(updated);
  } catch (e: any) {
    // Not found on update
    if (e?.code === "P2025") {
      return jsonError(404, "not_found");
    }
    // Unique constraint violation
    if (e?.code === "P2002") {
      const target = Array.isArray(e?.meta?.target) ? e.meta.target[0] : e?.meta?.target || "unknown";
      const field = typeof target === "string" ? target : "unknown";
      // Map to a cleaner field name if composite index
      return jsonError(409, "duplicate", { details: { field } });
    }
    return jsonError(500, "server_error", { message: e?.message });
  }
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const safeId = String(id || "").trim();
  if (!safeId) return jsonError(404, "not_found");
  try {
    const session = await getServerSession(authOptions);
    if (!session) return jsonError(401, "unauthorized");
    try {
      await prisma.supplier.delete({ where: { id: safeId } });
      return NextResponse.json({ ok: true });
    } catch (e: any) {
      // Foreign key constraint, linked orders/contracts etc.
      const code = e?.code === "P2003" ? "linked_records" : e?.code === "P2025" ? "not_found" : "server_error";
      const status = code === "linked_records" ? 409 : code === "not_found" ? 404 : 500;
      return jsonError(status, code, { message: e?.message });
    }
  } catch (e: any) {
    return jsonError(500, "server_error", { message: e?.message });
  }
}