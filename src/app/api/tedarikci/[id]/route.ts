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
    const supplier = await prisma.tenant.findUnique({
      where: { id: safeId, isSupplier: true },
      include: {
        users: {
          select: {
            id: true,
            username: true,
            email: true,
            isActive: true,
          }
        }
      }
    });
    if (!supplier) return jsonError(404, "not_found");

    const { getUserWithPermissions } = await import("@/lib/apiAuth");
    const user = await getUserWithPermissions(_req);
    if (!user) return jsonError(401, "unauthorized");

    // Latest evaluation summary (by period desc) - Filtered by Tenant
    const latestSummary = await prisma.supplierEvaluationSummary.findFirst({
      where: {
        supplierId: safeId,
        tenantId: user.isSuperAdmin ? undefined : user.tenantId
      },
      orderBy: { period: "desc" },
    });

    // Metrics for the same latest period if exists - Filtered by Tenant
    const latestMetrics = latestSummary
      ? await prisma.supplierPerformanceMetric.findMany({
        where: {
          supplierId: safeId,
          period: latestSummary.period,
          tenantId: user.isSuperAdmin ? undefined : user.tenantId
        }
      })
      : [];

    // Recent orders count (last 6 months) - Filtered by Tenant
    const since = new Date();
    since.setMonth(since.getMonth() - 6);
    const recentOrders = await prisma.order.count({
      where: {
        supplierId: safeId,
        createdAt: { gte: since },
        tenantId: user.isSuperAdmin ? undefined : user.tenantId
      }
    });

    const payload = {
      id: supplier.id,
      name: supplier.name,
      active: supplier.isActive,
      taxId: (supplier as any).taxId ?? null,
      contactName: (supplier as any).contactName ?? null,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      website: supplier.website,
      taxOffice: (supplier as any).taxOffice,
      bankName: (supplier as any).bankName,
      bankBranch: (supplier as any).bankBranch,
      bankIban: (supplier as any).bankIban,
      bankAccountNo: (supplier as any).bankAccountNo,
      bankCurrency: (supplier as any).bankCurrency,
      commercialRegistrationNo: (supplier as any).commercialRegistrationNo,
      mersisNo: (supplier as any).mersisNo,
      notes: supplier.notes,
      users: (supplier as any).users || [],
      createdAt: supplier.createdAt?.toISOString?.() ?? null,
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

// Minimal PATCH/PUT to update supplier core fields with validation
export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  return PATCH(req, context);
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const safeId = String(id || "").trim();
  if (!safeId) return jsonError(404, "not_found");
  try {
    const { getUserWithPermissions } = await import("@/lib/apiAuth");
    const user = await getUserWithPermissions(req);
    if (!user) return jsonError(401, "unauthorized");

    // Security: Only SuperAdmin or Platform Admin can global edit? 
    if (!user.isSuperAdmin && user.roleRef?.key !== "admin") {
      return jsonError(403, "forbidden", { message: "Tedarikçi bilgilerini düzenleme yetkiniz yok." });
    }

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
    setStr("taxOffice");
    setStr("bankName");
    setStr("bankBranch");
    setStr("bankIban");
    setStr("bankAccountNo");
    setStr("bankCurrency");
    setStr("commercialRegistrationNo");
    setStr("mersisNo");
    if (body.active !== undefined) data.isActive = Boolean(body.active);

    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.push("invalid_email");
    if (data.phone && String(data.phone).replace(/\D/g, "").length < 7) errors.push("invalid_phone");
    if (data.taxId && String(data.taxId).replace(/\D/g, "").length < 8) errors.push("invalid_taxId");
    if (errors.length) return jsonError(400, "validation_failed", { details: errors });

    const updated = await prisma.tenant.update({ where: { id: safeId, isSupplier: true }, data });
    return NextResponse.json(updated);
  } catch (e: any) {
    if (e?.code === "P2025") {
      return jsonError(404, "not_found");
    }
    if (e?.code === "P2002") {
      const target = Array.isArray(e?.meta?.target) ? e.meta.target[0] : e?.meta?.target || "unknown";
      const field = typeof target === "string" ? target : "unknown";
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
    const { getUserWithPermissions } = await import("@/lib/apiAuth");
    const user = await getUserWithPermissions(_req);
    if (!user || !user.isSuperAdmin) return jsonError(401, "unauthorized");

    try {
      await prisma.tenant.delete({ where: { id: safeId, isSupplier: true } });
      return NextResponse.json({ ok: true });
    } catch (e: any) {
      const code = e?.code === "P2003" ? "linked_records" : e?.code === "P2025" ? "not_found" : "server_error";
      const status = code === "linked_records" ? 409 : code === "not_found" ? 404 : 500;
      return jsonError(status, code, { message: e?.message });
    }
  } catch (e: any) {
    return jsonError(500, "server_error", { message: e?.message });
  }
}