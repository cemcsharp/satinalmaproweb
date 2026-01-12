import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuthApi } from "@/lib/apiAuth";
import { jsonError } from "@/lib/apiError";

export async function GET(req: NextRequest) {
    try {
        const auth = await requireAuthApi(req);
        if (!auth) return jsonError(401, "unauthorized");

        // Fetch user and their supplier relation
        const user = await prisma.user.findUnique({
            where: { id: auth.userId },
            select: { supplierId: true }
        });

        if (!user?.supplierId) {
            return jsonError(403, "supplier_access_denied", { message: "Bu hesap bir tedarikçi ile iliştirilmemiş." });
        }

        // Parse query params
        const { searchParams } = new URL(req.url);
        const statusFilter = searchParams.get("status");

        // Build where clause
        const where: Record<string, unknown> = { supplierId: user.supplierId };
        if (statusFilter) {
            where.status = { label: statusFilter };
        }

        // Fetch orders for this supplier
        const orders = await prisma.order.findMany({
            where,
            include: {
                status: { select: { label: true } },
                currency: { select: { label: true } },
                company: { select: { name: true } },
                items: {
                    select: {
                        id: true,
                        name: true,
                        quantity: true,
                        unitPrice: true,
                        unit: { select: { label: true } }
                    }
                },
                deliveries: {
                    select: {
                        id: true,
                        code: true,
                        status: true,
                        deliveryDate: true
                    },
                    orderBy: { deliveryDate: "desc" },
                    take: 1
                }
            },
            orderBy: { createdAt: "desc" }
        });

        // Transform response
        const result = orders.map(order => ({
            id: order.id,
            barcode: order.barcode,
            refNumber: order.refNumber,
            status: order.status.label,
            company: order.company.name,
            currency: order.currency.label,
            total: order.realizedTotal,
            estimatedDelivery: order.estimatedDelivery,
            createdAt: order.createdAt,
            itemCount: order.items.length,
            items: order.items.map(item => ({
                id: item.id,
                name: item.name,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                unit: item.unit?.label || "Adet"
            })),
            lastDelivery: order.deliveries[0] ? {
                code: order.deliveries[0].code,
                status: order.deliveries[0].status,
                date: order.deliveries[0].deliveryDate
            } : null
        }));

        return NextResponse.json({ orders: result, total: result.length });
    } catch (e: unknown) {
        console.error("[Portal Orders API Error]", e);
        const message = e instanceof Error ? e.message : "Unknown error";
        return jsonError(500, "server_error", { message });
    }
}
