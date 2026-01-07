import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuthApi } from "@/lib/apiAuth";
import { jsonError } from "@/lib/apiError";

export async function GET(req: NextRequest) {
    try {
        const user = await requireAuthApi(req);
        if (!user) return jsonError(401, "unauthorized");

        const url = new URL(req.url);
        const name = url.searchParams.get("name");
        const sku = url.searchParams.get("sku");

        if (!name && !sku) {
            return jsonError(400, "name_or_sku_required");
        }

        // Build the query
        const results = await prisma.orderItem.findMany({
            where: {
                OR: [
                    sku ? { sku: sku } : { id: 'none' },
                    name ? { name: { contains: name, mode: 'insensitive' } } : { id: 'none' }
                ],
                order: {
                    status: { label: { in: ["Tamamlandı", "Kapalı", "Onaylandı"] } } // Only consider finalized orders
                }
            },
            select: {
                unitPrice: true,
                order: {
                    select: {
                        createdAt: true,
                        barcode: true,
                        supplier: { select: { name: true } },
                        currency: { select: { label: true } }
                    }
                }
            },
            orderBy: {
                order: {
                    createdAt: 'asc'
                }
            },
            take: 20 // Last 20 purchases
        });

        const data = results.map(item => ({
            date: item.order.createdAt.toISOString().split('T')[0],
            price: Number(item.unitPrice),
            supplier: item.order.supplier.name,
            barcode: item.order.barcode,
            currency: item.order.currency?.label || "TRY"
        }));

        return NextResponse.json({ items: data });
    } catch (error: any) {
        console.error("[PRICE_HISTORY_GET]", error);
        return jsonError(500, "server_error", { message: error.message });
    }
}
