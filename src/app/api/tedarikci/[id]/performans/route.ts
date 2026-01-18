import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/apiError";
import { requirePermissionApi } from "@/lib/apiAuth";

/**
 * GET /api/tedarikci/[id]/performans
 * Tedarikçi Performans Metriklerini Hesaplar ve Döndürür
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await requirePermissionApi(req, "tedarikci:read");
        if (!user) return jsonError(403, "forbidden");

        const { id } = await params;

        // 1. Fetch historical orders and their deliveries
        const orders = await prisma.order.findMany({
            where: { supplierId: id, tenantId: user.tenantId },
            include: {
                deliveries: {
                    where: { status: "approved" },
                    include: { items: { include: { orderItem: true } } }
                }
            },
            take: 50, // Analyze last 50 orders
            orderBy: { createdAt: "desc" }
        });

        if (orders.length === 0) {
            return NextResponse.json({
                hasData: false,
                message: "Analiz için yeterli veri bulunamadı."
            });
        }

        let totalLeadTime = 0;
        let leadTimeCount = 0;
        let totalItemsOrdered = 0;
        let totalItemsDelivered = 0;
        let totalItemsApproved = 0;

        orders.forEach(order => {
            // Lead Time Calculation (Order to First Approved Delivery)
            if (order.deliveries.length > 0) {
                const firstDelivery = order.deliveries[0];
                const leadTimeDays = (new Date(firstDelivery.date).getTime() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60 * 24);
                totalLeadTime += Math.max(0, leadTimeDays);
                leadTimeCount++;
            }

            // Quality & Fill Rate Calculation
            order.deliveries.forEach(d => {
                d.items.forEach(di => {
                    totalItemsDelivered += Number(di.quantity);
                    totalItemsApproved += Number(di.approvedQuantity || 0);
                });
            });

            // Sum up expected quantities (if items are loaded)
            // Note: This is an approximation across multiple deliveries
            // We usually want to compare ordered quantity vs total delivered quantity for THAT order
        });

        const avgLeadTime = leadTimeCount > 0 ? (totalLeadTime / leadTimeCount).toFixed(1) : 0;
        const qualityRate = totalItemsDelivered > 0 ? ((totalItemsApproved / totalItemsDelivered) * 100).toFixed(1) : 0;

        return NextResponse.json({
            hasData: true,
            metrics: {
                avgLeadTime: Number(avgLeadTime), // Days
                qualityRate: Number(qualityRate), // Percentage
                reliabilityScore: 85, // Placeholder for complex logic
                orderCount: orders.length
            }
        });

    } catch (e: any) {
        console.error("[Supplier Performance API] Error:", e);
        return jsonError(500, "server_error", { message: e.message });
    }
}
