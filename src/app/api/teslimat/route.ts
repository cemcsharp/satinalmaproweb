import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/apiError";
import { requirePermissionApi } from "@/lib/apiAuth";
import * as crypto from "crypto";

// Create Delivery Receipt
export async function POST(req: NextRequest) {
    try {
        // Permission check: teslimat:create required
        const user = await requirePermissionApi(req, "teslimat:create");
        if (!user) return jsonError(403, "forbidden", { message: "Teslimat fişi oluşturma yetkiniz yok." });

        const body = await req.json();
        const { orderId, code, date, items, action } = body;

        // Token Creation Action
        if (action === "create-token") {
            if (!orderId) return jsonError(400, "missing_orderId");

            // Create a token valid for 7 days
            const token = "DLV-" + crypto.randomBytes(4).toString("hex").toUpperCase();
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7);

            await prisma.deliveryToken.create({
                data: { token, orderId, expiresAt }
            });

            return NextResponse.json({ ok: true, token });
        }

        // Email Sharing Action
        if (action === "send-email") {
            const { token, email } = body;

            if (!token || !email) return jsonError(400, "missing_token_or_email");

            const origin = process.env.NEXTAUTH_URL || req.headers.get("origin");
            const link = `${origin}/teslimat/${token}`;

            try {
                // Send email
                const { sendEmail } = await import("@/lib/mailer");
                const info = await sendEmail(
                    email,
                    "Teslimat Giriş Linki",
                    `
                    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #0f172a; margin-bottom: 20px;">Teslimat Girişi Daveti</h2>
                        <p style="color: #334155;">Merhaba,</p>
                        <p style="color: #334155;">Aşağıdaki linki kullanarak sipariş teslimat/irsaliye bilgilerinizi sisteme girebilirsiniz.</p>
                        <div style="margin: 30px 0; text-align: center;">
                            <a href="${link}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Teslimat Formunu Aç</a>
                        </div>
                        <p style="color: #64748b; font-size: 14px;">Bu link 7 gün süreyle geçerlidir.</p>
                        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                        <p style="color: #94a3b8; font-size: 12px;">Link çalışmazsa: ${link}</p>
                    </div>
                    `
                );
                return NextResponse.json({ ok: true });
            } catch (err: any) {
                console.error(`[API/Teslimat] Email Send Failed:`, err);
                return jsonError(500, "email_send_failed", { message: err.message });
            }
        }

        if (!orderId || !items || !Array.isArray(items) || items.length === 0) {
            return jsonError(400, "invalid_payload", { message: "orderId and items required" });
        }

        // Verify Order
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                items: true,
                deliveries: { include: { items: true } },
                request: { include: { unit: true, owner: true } } // Include unit info
            }
        });
        if (!order) return jsonError(404, "order_not_found");

        // Calculate previously delivered quantities
        const deliveredMap = new Map<string, number>();
        for (const d of order.deliveries) {
            // Only count approved deliveries? Or all? 
            // If we count pending too, we prevent over-delivery creation.
            // Let's count all non-rejected ones.
            if (d.status === "rejected") continue;

            for (const di of d.items) {
                const current = deliveredMap.get(di.orderItemId) || 0;
                deliveredMap.set(di.orderItemId, current + Number(di.quantity));
            }
        }

        // Process new delivery items with strict quantity validation
        const deliveryItemsData = [];
        let totalNewDelivery = 0;

        for (const item of items) {
            const { orderItemId, quantity, notes } = item;
            const q = Number(quantity);
            if (q <= 0) continue;

            const orderItem = order.items.find((i) => i.id === orderItemId);
            if (!orderItem) continue;

            const prev = deliveredMap.get(orderItemId) || 0;
            const max = Number(orderItem.quantity);
            const remaining = max - prev;

            // Strict validation: reject over-delivery
            if (q > remaining) {
                return jsonError(400, "over_delivery", {
                    message: `"${orderItem.name}" için maksimum ${remaining} adet teslim alabilirsiniz. (Sipariş: ${max}, Önceki Teslim: ${prev})`
                });
            }

            deliveryItemsData.push({
                orderItemId,
                quantity: q,
                approvedQuantity: 0, // Initially 0 until approved by unit
                notes
            });
            totalNewDelivery += q;
        }

        if (deliveryItemsData.length === 0) {
            return jsonError(400, "no_valid_items", { message: "quantity must be > 0" });
        }

        // Create Receipt
        // Assign to the Requesting Unit (so they can approve it)
        const targetUnitId = order.request?.unitId;

        const delivery = await prisma.deliveryReceipt.create({
            data: {
                code: code || `IRS-${Date.now()}`, // Auto-generate if missing
                date: date ? new Date(date) : new Date(),
                orderId,
                receiverId: user.id,
                receiverUnitId: targetUnitId, // Assigned to Request Unit
                status: "pending", // Wait for Unit Approval
                items: {
                    create: deliveryItemsData
                }
            }
        });

        // Send Email to Request Owner / Unit
        try {
            // ... email logic (will implement below in separate block if needed, but here is cleaner)
            const origin = process.env.NEXTAUTH_URL || req.headers.get("origin");
            const link = `${origin}/teslimat/onay`; // Page to approve deliveries

            const targets = [];
            if (order.request?.owner?.email) targets.push(order.request.owner.email);
            if (order.request?.unitEmail) targets.push(order.request.unitEmail);

            if (targets.length > 0) {
                const { dispatchEmail } = await import("@/lib/mailer");
                for (const to of new Set(targets)) {
                    await dispatchEmail({
                        to,
                        subject: "Teslimat Onayı Bekleniyor",
                        html: `
                            <p>Merhaba,</p>
                            <p>Siparişiniz (<strong>${order.barcode}</strong>) için Satınalma birimi tarafından teslimat girişi yapılmıştır.</p>
                            <p>Lütfen teslim aldığınız ürünleri kontrol edip sistemi onaylayınız.</p>
                            <p><a href="${link}">Onay Ekranına Git</a></p>
                        `,
                        category: "delivery_pending"
                    });
                }
            }
        } catch (e) {
            console.error("Email send error", e);
        }

        // Update Order Status
        // Re-calculate total delivered vs total ordered
        let allDelivered = true;
        let anyDelivered = false;

        // We must include the just created delivery in calculation
        // So let's re-fetch or calc manually
        const finalDeliveredMap = new Map(deliveredMap);
        for (const di of deliveryItemsData) {
            const cur = finalDeliveredMap.get(di.orderItemId) || 0;
            finalDeliveredMap.set(di.orderItemId, cur + Number(di.quantity));
        }

        for (const oi of order.items) {
            const total = Number(oi.quantity);
            const del = finalDeliveredMap.get(oi.id) || 0;
            if (del > 0) anyDelivered = true;
            if (del < total) allDelivered = false;
        }

        let nextStatus = order.statusId;
        const statusLabel = allDelivered ? "Teslim Alındı" : (anyDelivered ? "Kısmi Teslimat" : null);

        if (statusLabel) {
            // Try to find status ID by label
            const s = await prisma.optionItem.findFirst({
                where: { category: { key: "siparisDurumu" }, label: statusLabel }
            });
            if (s) {
                // Update order status if changed
                await prisma.order.update({
                    where: { id: orderId },
                    data: { statusId: s.id }
                });
            }
        }

        return NextResponse.json({ ok: true, id: delivery.id });

    } catch (e: any) {
        console.error("Delivery POST Error (Stack):", e.stack);

        // Handle Unique Constraint Violation (P2002)
        if (e.code === 'P2002' && e.meta?.target?.includes('code')) {
            return jsonError(400, "duplicate_code", { message: "Bu İrsaliye Numarası/Belge Kodu ile daha önce bir kayıt oluşturulmuş. Lütfen kontrol edip farklı bir numara giriniz." });
        }

        return jsonError(500, "server_error", { message: e.message });
    }
}

// List Deliveries (Order-specific or Global)
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");
    const status = searchParams.get("status");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    try {
        // Permission check: teslimat:read required
        const user = await requirePermissionApi(req, "teslimat:read");
        if (!user) return jsonError(403, "forbidden", { message: "Teslimat görüntüleme yetkiniz yok." });

        const where: any = {};
        if (orderId) where.orderId = orderId;
        if (status) {
            if (status.includes(",")) {
                where.status = { in: status.split(",") };
            } else {
                where.status = status;
            }
        }
        if (dateFrom || dateTo) {
            where.date = {};
            if (dateFrom) where.date.gte = new Date(dateFrom);
            if (dateTo) where.date.lte = new Date(dateTo);
        }

        // Birim bazlı filtreleme:
        // - Admin → tümünü görsün
        // - Satınalma Müdürlüğü (unitLabel içinde "Satınalma" geçiyorsa) → tümünü görsün
        // - Diğer birimler → sadece kendi birimlerine ait teslimatları görsün
        const isSatinalma = user.unitLabel?.includes("Satınalma") || user.unitLabel?.includes("Satinlama");

        if (!user.isAdmin && !isSatinalma) {
            if (user.unitId) {
                // Kendi biriminin teslimatlarını gör
                where.receiverUnitId = user.unitId;
            } else {
                // Birimi yoksa sadece kendi kayıtlarını gör
                where.receiverId = user.id;
            }
        }

        const deliveries = await prisma.deliveryReceipt.findMany({
            where,
            include: {
                items: { include: { orderItem: true } },
                receiver: { select: { id: true, username: true, email: true } },
                receiverUnit: { select: { id: true, label: true } },
                order: { select: { id: true, barcode: true, supplier: { select: { name: true } }, company: { select: { name: true } } } },
                attachments: true
            },
            orderBy: { date: "desc" }
        });
        return NextResponse.json(deliveries);
    } catch (e: any) {
        return jsonError(500, "server_error", { message: e.message });
    }
}
