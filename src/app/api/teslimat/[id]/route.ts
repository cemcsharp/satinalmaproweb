
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
                order: { include: { supplier: true, items: true, request: true } },
                attachments: true
            }
        });

        if (!delivery) return jsonError(404, "delivery_not_found");

        // Security Check: Isolation
        const isSatinalma = user.unitLabel?.toLocaleLowerCase("tr-TR").includes("satınalma") || user.unitLabel?.toLowerCase().includes("satinlama");
        const hasFullAccess = user.isAdmin || (user as any).role === "admin" || isSatinalma;
        const isReceiverUnit = delivery.receiverUnitId === user.unitId;
        const isCreator = delivery.receiverId === user.id;

        if (!hasFullAccess && !isReceiverUnit && !isCreator) {
            return jsonError(403, "forbidden_access", { message: "Bu teslimat fişini görüntüleme yetkiniz yok." });
        }

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

        const { id } = await params;

        // Fetch to verify ownership/permission
        const delivery = await prisma.deliveryReceipt.findUnique({ where: { id } });
        if (!delivery) return jsonError(404, "not_found");

        const isSatinalma = user.unitLabel?.toLocaleLowerCase("tr-TR").includes("satınalma") || user.unitLabel?.toLowerCase().includes("satinlama");
        const hasFullAccess = user.isAdmin || (user as any).role === "admin" || isSatinalma;
        const isReceiverUnit = delivery.receiverUnitId === user.unitId;

        // Only Receiver Unit or Admin/Satinalma can approve/reject
        if (!hasFullAccess && !isReceiverUnit) {
            return jsonError(403, "forbidden_approve", { message: "Bu teslimatı onaylama/reddetme yetkiniz yok." });
        }
        const body = await req.json();
        const { status, updatedItems } = body;

        if (!["approved", "rejected"].includes(status)) {
            return jsonError(400, "invalid_status");
        }

        // Transaction to ensure data consistency
        const result = await prisma.$transaction(async (tx) => {
            // 0. Update items if provided (only when approving)
            if (status === "approved" && Array.isArray(updatedItems)) {
                for (const item of updatedItems) {
                    if (item.id && (item.approvedQuantity !== undefined)) {
                        await tx.deliveryItem.update({
                            where: { id: item.id, deliveryId: id }, // Ensure item belongs to this delivery
                            data: { approvedQuantity: Number(item.approvedQuantity) }
                        });
                    }
                }
            } else if (status === "approved") {
                // If checking approved but no specific items sent, set approvedQuantity = quantity for all
                // This might be redundant if we did it on creation, but good for safety
                // Actually we set approvedQuantity = 0 on creation now. So we must set it to quantity if not specified? 
                // Let's assume frontend sends items always or we auto-approve current quantities.
                // For now, if updatedItems is missing, we assume FULL APPROVAL of original quantities
                const currentItems = await tx.deliveryItem.findMany({ where: { deliveryId: id } });
                for (const ci of currentItems) {
                    if (!ci.approvedQuantity || Number(ci.approvedQuantity) === 0) {
                        await tx.deliveryItem.update({
                            where: { id: ci.id },
                            data: { approvedQuantity: ci.quantity }
                        });
                    }
                }
            }

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
                            // Use approvedQuantity if available, otherwise quantity
                            // But since we enforced approvedQuantity logic, we should use it.
                            const qty = dItem.approvedQuantity ? Number(dItem.approvedQuantity) : Number(dItem.quantity);
                            totalDelivered += qty;
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
