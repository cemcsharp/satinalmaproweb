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

        // Fetch RFQs assigned to this supplier via RfqSupplier junction
        const participations = await prisma.rfqSupplier.findMany({
            where: { supplierId: user.supplierId },
            include: {
                rfq: {
                    select: {
                        id: true,
                        rfxCode: true,
                        title: true,
                        status: true,
                        deadline: true,
                        createdAt: true
                    }
                },
                offer: {
                    select: {
                        id: true,
                        submittedAt: true,
                        totalAmount: true,
                        currency: true
                    }
                }
            },
            orderBy: { rfq: { createdAt: "desc" } }
        });

        const items = participations.map(p => ({
            participationId: p.id,
            rfqId: p.rfq.id,
            rfxCode: p.rfq.rfxCode,
            title: p.rfq.title,
            status: p.rfq.status,
            deadline: p.rfq.deadline,
            stage: p.stage, // SENT, VIEWED, OFFERED, DECLINED
            hasSubmittedOffer: !!p.offer,
            offerDetails: p.offer ? {
                id: p.offer.id,
                submittedAt: p.offer.submittedAt,
                totalAmount: p.offer.totalAmount,
                currency: p.offer.currency
            } : null
        }));

        return NextResponse.json({ items });
    } catch (e: any) {
        console.error("[Portal Dashboard API Error]", e);
        return jsonError(500, "server_error", { message: e.message });
    }
}
