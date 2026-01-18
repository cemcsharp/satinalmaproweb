import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/apiError";
import { requirePermissionApi } from "@/lib/apiAuth";

/**
 * GET /api/siparis/[id]/match
 * Üçlü Eşleşme (Order, Delivery, Invoice) Analizini Döndürür
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await requirePermissionApi(req, "siparis:read");
        if (!user) return jsonError(403, "forbidden");

        const { id } = await params;

        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                items: true,
                deliveries: {
                    where: { status: "approved" },
                    include: { items: true }
                },
                invoices: {
                    include: { items: true }
                }
            }
        });

        if (!order) return jsonError(404, "order_not_found");

        // Aggregated Analysis
        const analysis = order.items.map(oi => {
            // Delivery Total for this item
            const delivered = order.deliveries.reduce((sum, d) => {
                const item = d.items.find(di => di.orderItemId === oi.id);
                return sum + Number(item?.approvedQuantity || 0);
            }, 0);

            // Invoice Total for this item (matching by name or SKU)
            const invoiced = order.invoices.reduce((sum, inv) => {
                const item = inv.items.find(ii => ii.name === oi.name || (oi.sku && ii.name.includes(oi.sku)));
                return sum + Number(item?.quantity || 0);
            }, 0);

            const orderedQty = Number(oi.quantity);
            const orderedPrice = Number(oi.unitPrice);

            return {
                id: oi.id,
                name: oi.name,
                sku: oi.sku,
                ordered: orderedQty,
                delivered: delivered,
                invoiced: invoiced,
                price: orderedPrice,
                // Status Flags
                status: {
                    qtyMatch: orderedQty === delivered && delivered === invoiced,
                    overDelivered: delivered > orderedQty,
                    underDelivered: delivered < orderedQty,
                    overInvoiced: invoiced > delivered,
                    priceVariance: false // Could check invoice prices too if needed
                }
            };
        });

        const totals = {
            ordered: Number(order.realizedTotal),
            invoiced: order.invoices.reduce((sum, inv) => sum + Number(inv.amount), 0),
            balance: Number(order.realizedTotal) - order.invoices.reduce((sum, inv) => sum + Number(inv.amount), 0)
        };

        return NextResponse.json({
            analysis,
            totals,
            orderBarcode: order.barcode
        });

    } catch (e: any) {
        console.error("[Match API] Error:", e);
        return jsonError(500, "server_error", { message: e.message });
    }
}
