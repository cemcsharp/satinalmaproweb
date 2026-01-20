import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/apiError";

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
    try {
        const { token } = await params;

        // 1. Validate token
        const invitation = await prisma.rfqSupplier.findUnique({
            where: { token },
            include: { rfq: true }
        });

        if (!invitation) return jsonError(404, "invitation_not_found");

        const rfqId = invitation.rfqId;
        const currentRound = invitation.rfq.negotiationRound;

        // 2. Fetch all latest offers for this RFQ
        // We need to compare current offers. If a supplier hasn't offered in current round, we take their latest previous round offer?
        // For "Corporate Order", usually each round is a fresh start or we compare latest.
        // Let's take the LATEST offer of each supplier invited to this RFQ.
        const allSuppliers = await prisma.rfqSupplier.findMany({
            where: { rfqId },
            include: {
                offers: {
                    orderBy: { round: 'desc' },
                    take: 1
                }
            }
        });

        const offersList = allSuppliers
            .filter(s => s.offers.length > 0)
            .map(s => ({
                supplierId: s.id,
                amount: Number(s.offers[0].totalAmount),
                round: s.offers[0].round
            }))
            .sort((a, b) => a.amount - b.amount); // Best price first

        const totalSuppliersWithOffers = offersList.length;
        const myOffer = offersList.find(o => o.supplierId === invitation.id);

        const rank = myOffer ? offersList.findIndex(o => o.supplierId === invitation.id) + 1 : null;
        const averageAmount = totalSuppliersWithOffers > 0
            ? offersList.reduce((acc, curr) => acc + curr.amount, 0) / totalSuppliersWithOffers
            : 0;

        return NextResponse.json({
            ok: true,
            rfqTitle: invitation.rfq.title,
            negotiationStatus: invitation.rfq.negotiationStatus,
            negotiationRound: currentRound,
            negotiationDeadline: invitation.rfq.negotiationDeadline,
            stats: {
                totalParticipants: totalSuppliersWithOffers,
                myRank: rank,
                marketAverage: Number(averageAmount.toFixed(2)),
                isMyOfferLatest: myOffer ? myOffer.round === currentRound : false
            }
        });

    } catch (error) {
        console.error("[PORTAL_NEGOTIATION_GET]", error);
        return jsonError(500, "server_error");
    }
}
