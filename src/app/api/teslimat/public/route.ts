
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/apiError";
import * as crypto from "crypto";

// Cache Buster: 123456789
// Generate Token (Internal usage or via admin action)
// POST /api/teslimat/public?action=create-token
export async function POST(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const action = searchParams.get("action");

        // Public Submission
        if (!action) {
            const body = await req.json();
            const { receiverName, date, code, notes, items, attachments } = body;

            // Validate Token
            const deliveryToken = await prisma.deliveryToken.findUnique({
                where: { token: body.token },
                include: { order: { include: { items: true, deliveries: { include: { items: true } } } } }
            });

            if (!deliveryToken || deliveryToken.expiresAt < new Date()) {
                return jsonError(400, "invalid_or_expired_token");
            }

            const order = deliveryToken.order;

            // Calculate already delivered quantities (all statuses count toward limit)
            const deliveredMap = new Map<string, number>();
            for (const d of order.deliveries) {
                for (const di of d.items) {
                    const current = deliveredMap.get(di.orderItemId) || 0;
                    deliveredMap.set(di.orderItemId, current + Number(di.quantity));
                }
            }

            // Validate that new delivery doesn't exceed remaining
            const validatedItems: { orderItemId: string; quantity: number }[] = [];
            for (const item of items) {
                const orderItem = order.items.find(oi => oi.id === item.orderItemId);
                if (!orderItem) continue;

                const qty = Number(item.quantity);
                if (qty <= 0) continue;

                const ordered = Number(orderItem.quantity);
                const alreadyDelivered = deliveredMap.get(item.orderItemId) || 0;
                const remaining = ordered - alreadyDelivered;

                if (qty > remaining) {
                    return jsonError(400, "over_delivery", {
                        message: `"${orderItem.name}" için maksimum ${remaining} adet teslim alabilirsiniz. (Sipariş: ${ordered}, Önceki Teslim: ${alreadyDelivered})`
                    });
                }

                validatedItems.push({ orderItemId: item.orderItemId, quantity: qty });
            }

            if (validatedItems.length === 0) {
                return jsonError(400, "no_valid_items", { message: "En az bir geçerli ürün girmelisiniz." });
            }

            const delivery = await prisma.$transaction(async (tx) => {
                const receipt = await tx.deliveryReceipt.create({
                    data: {
                        orderId: order.id,
                        receiverName,
                        receiverEmail: body.receiverEmail || null,
                        receiverUnitId: body.receiverUnitId || null,
                        status: "pending_verification", // Requires admin approval
                        code: code || `IRS-${order.barcode}-${Date.now()}`,
                        date: date ? new Date(date) : new Date(),
                        notes,
                        items: {
                            create: validatedItems.map((i) => ({
                                quantity: i.quantity,
                                orderItem: { connect: { id: i.orderItemId } }
                            }))
                        }
                    }
                });

                // Handle Attachments
                if (attachments && Array.isArray(attachments)) {
                    const fs = await import("fs");
                    const path = await import("path");

                    const uploadDir = path.join(process.cwd(), "public", "uploads");
                    if (!fs.existsSync(uploadDir)) {
                        fs.mkdirSync(uploadDir, { recursive: true });
                    }

                    for (const file of attachments) {
                        if (!file.data || !file.name) continue;

                        const matches = file.data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
                        if (!matches || matches.length !== 3) continue;

                        const type = matches[1];
                        const buffer = Buffer.from(matches[2], "base64");
                        const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
                        const filePath = path.join(uploadDir, fileName);

                        fs.writeFileSync(filePath, buffer);

                        await tx.attachment.create({
                            data: {
                                deliveryId: receipt.id,
                                fileName: file.name,
                                url: `/uploads/${fileName}`,
                                type: type
                            }
                        });
                    }
                }

                return receipt;
            });

            return NextResponse.json({ ok: true, id: delivery.id });
        }

        // Create Token (Requires Auth) - Not implemented here or blocked
        if (action === "create-token") {
            return jsonError(400, "invalid_action_for_public_route");
        }

    } catch (e: any) {
        console.error("Public delivery error:", e);
        return jsonError(500, "server_error", { message: e.message });
    }
}

// GET /api/teslimat/public?token=...
// Fetch order details for the public form
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) return jsonError(400, "missing_token");

    try {
        const validToken = await prisma.deliveryToken.findUnique({
            where: { token },
            include: {
                order: {
                    include: {
                        items: { include: { unit: true } },
                        supplier: true,
                        company: true
                    }
                }
            }
        });

        if (!validToken) return jsonError(404, "invalid_token");
        if (new Date() > validToken.expiresAt) return jsonError(400, "token_expired");

        // Return only necessary data for public form
        const units = await prisma.optionItem.findMany({
            where: { category: { key: "birim" }, active: true },
            select: { id: true, label: true }
        });

        // Calculate already delivered quantities from approved receipts
        const approvedDeliveries = await prisma.deliveryReceipt.findMany({
            where: { orderId: validToken.order.id, status: "approved" },
            include: { items: true }
        });

        const deliveredMap = new Map<string, number>();
        for (const d of approvedDeliveries) {
            for (const item of d.items) {
                const current = deliveredMap.get(item.orderItemId) || 0;
                deliveredMap.set(item.orderItemId, current + Number(item.quantity));
            }
        }

        const items = validToken.order.items.map(i => {
            const delivered = deliveredMap.get(i.id) || 0;
            const total = Number(i.quantity);
            const remaining = Math.max(0, total - delivered);

            return {
                id: i.id,
                name: i.name,
                quantity: total,
                delivered: delivered,
                remaining: remaining,
                unit: i.unit?.label || "Adet"
            };
        });

        const totalDeliveriesCount = await prisma.deliveryReceipt.count({
            where: { orderId: validToken.order.id }
        });

        const orderData = {
            id: validToken.order.id,
            barcode: validToken.order.barcode,
            supplierName: validToken.order.supplier?.name,
            companyName: validToken.order.company?.name,
            items,
            units,
            deliveryCount: totalDeliveriesCount
        };

        return NextResponse.json(orderData);

    } catch (e: any) {
        return jsonError(500, "server_error");
    }
}
