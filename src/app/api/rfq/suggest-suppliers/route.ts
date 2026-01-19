import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/apiError";
import { requirePermissionApi } from "@/lib/apiAuth";

/**
 * POST /api/rfq/suggest-suppliers
 * Body: { categoryIds: string[] }
 * Returns: List of suppliers (tenants) matching the given categories
 */
export async function POST(req: NextRequest) {
    try {
        const user = await requirePermissionApi(req, "rfq:create");
        if (!user) return jsonError(403, "forbidden");

        const { categoryIds } = await req.json();
        if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
            return NextResponse.json({ items: [] });
        }

        // Clean and deduplicate IDs
        const uniqueCategoryIds = Array.from(new Set(categoryIds.filter(Boolean)));

        // Find suppliers (tenants with isSupplier: true) that match THESE categories
        const matchingSuppliers = await prisma.tenant.findMany({
            where: {
                isActive: true,
                isSupplier: true,
                registrationStatus: "approved",
                categoryId: { in: uniqueCategoryIds },
                // Multi-tenant check
                ...(user.isSuperAdmin ? {} : {
                    buyerLinks: {
                        some: { tenantId: user.tenantId }
                    }
                })
            },
            include: {
                category: {
                    select: { name: true }
                }
            },
            orderBy: { name: "asc" }
        });

        // Format response
        const items = matchingSuppliers.map(s => ({
            id: s.id,
            name: s.name,
            email: s.email,
            contactName: s.contactName,
            categoryName: s.category?.name || null
        }));

        return NextResponse.json({ items });

    } catch (e: any) {
        console.error("[SuggestSuppliers] Error:", e);
        return jsonError(500, "server_error", { message: e.message });
    }
}
