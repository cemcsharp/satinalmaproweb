import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/apiError";
import { requirePermissionApi } from "@/lib/apiAuth";

/**
 * POST /api/rfq/suggest-suppliers
 * Body: { categoryIds: string[] }
 * Returns: List of suppliers matching the given categories
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

        // Find suppliers that match THESE categories
        // We look into SupplierCategoryMapping for M2M links
        // AND maybe fallback/also check the single categoryId on Supplier model
        const matchingSuppliers = await prisma.supplier.findMany({
            where: {
                active: true,
                registrationStatus: "approved",
                OR: [
                    {
                        categoryId: { in: uniqueCategoryIds }
                    },
                    {
                        categories: {
                            some: {
                                categoryId: { in: uniqueCategoryIds }
                            }
                        }
                    }
                ],
                // Multi-tenant check
                ...(user.isSuperAdmin ? {} : {
                    supplierLinks: {
                        some: { tenantId: user.tenantId }
                    }
                })
            },
            include: {
                category: {
                    select: { name: true }
                },
                categories: {
                    include: {
                        category: {
                            select: { name: true }
                        }
                    }
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
            // Primary category
            categoryName: s.category?.name || (s.categories.length > 0 ? s.categories[0].category.name : null),
            // All linked categories for detailed UI
            allCategories: s.categories.map(c => c.category.name)
        }));

        return NextResponse.json({ items });

    } catch (e: any) {
        console.error("[SuggestSuppliers] Error:", e);
        return jsonError(500, "server_error", { message: e.message });
    }
}
