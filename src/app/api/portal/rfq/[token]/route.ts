import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/apiError";
import { logAuditWithRequest } from "@/lib/auditLogger";

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
    try {
        const { token } = await params;
        const body = await req.json();

        // 1. Validate invitation
        const invitation = await prisma.rfqSupplier.findUnique({
            where: { token },
            include: { rfq: true, offer: true }
        });

        if (!invitation) {
            // Log failed attempt for security monitoring
            const ip = req.headers.get("x-forwarded-for") || "unknown";
            await prisma.loginAttempt.create({
                data: {
                    reason: `PORTAL_TOKEN_${token.substring(0, 8)}...`,
                    ip,
                    success: false,
                    userAgent: req.headers.get("user-agent") || "unknown"
                }
            }).catch(() => { }); // Don't crash if loginAttempt fails

            return jsonError(404, "invitation_not_found");
        }

        // 2. Check deadline
        if (invitation.rfq.deadline && new Date(invitation.rfq.deadline) < new Date()) {
            await logAuditWithRequest(req, {
                userId: "system_portal",
                action: "VIEW",
                entityType: "Rfq",
                entityId: invitation.rfq.id,
                oldData: { status: "Expired Attempt", email: invitation.email },
                newData: {},
            }).catch(() => { });
            return jsonError(403, "rfq_expired");
        }

        const { items, notes, validUntil, currency } = body;

        // 3. Calculate total amount
        const totalAmount = items.reduce((sum: number, item: any) => {
            const lineTotal = item.quantity * item.unitPrice;
            const vat = lineTotal * (item.vatRate / 100);
            return sum + lineTotal + vat;
        }, 0);

        // 4. Use transaction to save Offer and Items
        const result = await prisma.$transaction(async (tx) => {
            // Create or update offer
            const offer = await tx.offer.upsert({
                where: { rfqSupplierId: invitation.id },
                update: {
                    totalAmount,
                    currency,
                    validUntil: validUntil ? new Date(validUntil) : null,
                    notes,
                    submittedAt: new Date(),
                },
                create: {
                    rfqSupplierId: invitation.id,
                    totalAmount,
                    currency,
                    validUntil: validUntil ? new Date(validUntil) : null,
                    notes,
                    submittedAt: new Date(),
                }
            });

            // Clear old items and add new ones (cleanest way for updates)
            await tx.offerItem.deleteMany({ where: { offerId: offer.id } });

            await tx.offerItem.createMany({
                data: items.map((item: any) => ({
                    offerId: offer.id,
                    rfqItemId: item.rfqItemId,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    vatRate: item.vatRate,
                    totalPrice: item.quantity * item.unitPrice, // We store net total in totalPrice usually
                    brand: item.brand || null,
                    notes: item.notes || null,
                }))
            });

            // Update invitation stage
            await tx.rfqSupplier.update({
                where: { id: invitation.id },
                data: { stage: "OFFERED" }
            });

            return offer;
        });

        // 5. Log success
        await logAuditWithRequest(req, {
            userId: "system_portal",
            action: invitation.offer ? "UPDATE" : "CREATE",
            entityType: "Rfq",
            entityId: invitation.rfq.id,
            oldData: invitation.offer ? { totalAmount: invitation.offer.totalAmount, currency: invitation.offer.currency } : null,
            newData: { totalAmount, currency, supplier: invitation.email },
        }).catch(() => { });

        return NextResponse.json({ ok: true, id: result.id });
    } catch (error: any) {
        console.error("[PORTAL_OFFER_POST]", error);
        return jsonError(500, "server_error", { message: error.message });
    }
}
