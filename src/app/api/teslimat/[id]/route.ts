
import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/apiError";

// GET /api/teslimat/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { getUserWithPermissions } = await import("@/lib/apiAuth");
        const user = await getUserWithPermissions(req);
        if (!user) return jsonError(401, "unauthorized");

        const { id } = await params;
        const delivery = await prisma.deliveryReceipt.findUnique({
            where: { id },
            include: {
                items: { include: { orderItem: true } },
                receiver: { select: { id: true, username: true, email: true } },
                receiverUnit: { select: { id: true, label: true } },
                order: { include: { supplier: true, items: true } },
                attachments: true
            }
        });

        if (!delivery) return jsonError(404, "delivery_not_found");

        return NextResponse.json(delivery);
    } catch (e: any) {
        return jsonError(500, "server_error", { message: e.message });
    }
}

// PATCH /api/teslimat/[id] - Update Status (Approve/Reject)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { getUserWithPermissions, userHasPermission } = await import("@/lib/apiAuth");
        const user = await getUserWithPermissions(req);
        if (!user) return jsonError(401, "unauthorized");
        // Permission check can be added here (e.g. teslimat:approve)

        const { id } = await params;
        const body = await req.json();
        const { status } = body;

        if (!["approved", "rejected"].includes(status)) {
            return jsonError(400, "invalid_status");
        }

        // Transaction to ensure data consistency
        const result = await prisma.$transaction(async (tx) => {
            // 1. Update Delivery Receipt
            const delivery = await tx.deliveryReceipt.update({
                where: { id },
                data: {
                    status,
                    // Store who approved it? Maybe add approvedById later
                },
                include: { items: true, order: { include: { items: true } } }
            });

            if (status === "approved") {
                // 2. Logic to update Order Status if needed
                // Calculate total delivered quantities for the order
                const allDeliveries = await tx.deliveryReceipt.findMany({
                    where: { orderId: delivery.orderId, status: "approved" },
                    include: { items: true }
                });

                let allItemsDelivered = true;
                let partiallyDelivered = false;

                // Check each order item
                for (const orderItem of delivery.order.items) {
                    let totalDelivered = 0;
                    for (const d of allDeliveries) {
                        const dItem = d.items.find(di => di.orderItemId === orderItem.id);
                        if (dItem) {
                            totalDelivered += Number(dItem.quantity);
                        }
                    }

                    if (totalDelivered < Number(orderItem.quantity)) {
                        allItemsDelivered = false;
                    }
                    if (totalDelivered > 0) {
                        partiallyDelivered = true;
                    }
                }

                // Update Order Status based on delivery state
                if (allItemsDelivered) {
                    const completedStatus = await tx.optionItem.findFirst({
                        where: { category: { key: "siparisDurumu" }, label: "Teslim Alındı" }
                    });
                    if (completedStatus) {
                        await tx.order.update({
                            where: { id: delivery.orderId },
                            data: { statusId: completedStatus.id, estimatedDelivery: new Date() } // Update est delivery to now as actual
                        });
                    }
                } else if (partiallyDelivered) {
                    const partialStatus = await tx.optionItem.findFirst({
                        where: { category: { key: "siparisDurumu" }, label: "Kısmi Teslimat" }
                    });
                    if (partialStatus) {
                        await tx.order.update({
                            where: { id: delivery.orderId },
                            data: { statusId: partialStatus.id }
                        });
                    }
                }
            }

            return delivery;
        });

        return NextResponse.json(result);

    } catch (e: any) {
        console.error(e);
        return jsonError(500, "server_error", { message: e.message });
    }
}
