import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuthApi } from "@/lib/apiAuth";
import { jsonError } from "@/lib/apiError";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await requireAuthApi(req);
        if (!auth) return jsonError(401, "unauthorized");

        const { id: rfqId } = await params;

        // Fetch user and their supplier relation
        const user = await prisma.user.findUnique({
            where: { id: auth.userId },
            select: { supplierId: true }
        });

        if (!user?.supplierId) return jsonError(403, "supplier_access_denied");

        // Ensure the supplier is assigned to this RFX
        const participation = await prisma.rfqSupplier.findFirst({
            where: { rfqId, supplierId: user.supplierId },
            include: {
                rfq: {
                    include: {
                        items: true,
                        deliveryAddress: true,
                        company: true
                    }
                },
                offer: {
                    include: {
                        items: true
                    }
                }
            }
        });

        if (!participation) return jsonError(404, "rfq_not_found_for_supplier");

        // Update status to VIEWED if it was SENT
        if (participation.stage === "SENT") {
            await prisma.rfqSupplier.update({
                where: { id: participation.id },
                data: { stage: "VIEWED" }
            });
        }

        return NextResponse.json({
            participationId: participation.id,
            rfq: participation.rfq,
            existingOffer: participation.offer
        });
    } catch (e: any) {
        return jsonError(500, "server_error", { message: e.message });
    }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await requireAuthApi(req);
        if (!auth) return jsonError(401, "unauthorized");

        const { id: rfqId } = await params;

        const user = await prisma.user.findUnique({
            where: { id: auth.userId },
            select: { supplierId: true }
        });
        if (!user?.supplierId) return jsonError(403, "forbidden");

        const body = await req.json();
        const { items, totalAmount, currency, notes, validUntil } = body;

        // Find participation
        const participation = await prisma.rfqSupplier.findFirst({
            where: { rfqId, supplierId: user.supplierId }
        });
        if (!participation) return jsonError(404, "participation_not_found");

        // Upsert the Offer
        const offerData = {
            rfqSupplierId: participation.id,
            totalAmount: Number(totalAmount),
            currency: currency || "TRY",
            notes,
            validUntil: validUntil ? new Date(validUntil) : null,
            submittedAt: new Date()
        };

        const offer = await prisma.offer.upsert({
            where: { rfqSupplierId: participation.id },
            update: {
                ...offerData,
                items: {
                    deleteMany: {},
                    create: items.map((item: any) => ({
                        rfqItemId: item.rfqItemId,
                        quantity: Number(item.quantity),
                        unitPrice: Number(item.unitPrice),
                        vatRate: Number(item.vatRate || 20)
                    }))
                }
            },
            create: {
                ...offerData,
                items: {
                    create: items.map((item: any) => ({
                        rfqItemId: item.rfqItemId,
                        quantity: Number(item.quantity),
                        unitPrice: Number(item.unitPrice),
                        vatRate: Number(item.vatRate || 20)
                    }))
                }
            }
        });

        // Update participation stage
        await prisma.rfqSupplier.update({
            where: { id: participation.id },
            data: { stage: "OFFERED" }
        });

        return NextResponse.json({ ok: true, offerId: offer.id });
    } catch (e: any) {
        console.error("[Post Offer Error]", e);
        return jsonError(500, "submit_failed", { message: e.message });
    }
}
