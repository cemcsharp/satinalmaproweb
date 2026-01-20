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
            select: { tenantId: true }
        });

        if (!user?.tenantId) {
            return jsonError(403, "supplier_access_denied", { message: "Bu hesap bir tedarikçi ile iliştirilmemiş." });
        }

        // Fetch summary totals
        const [rfqCount, offerCount, orderCount, contractCount] = await Promise.all([
            prisma.rfqSupplier.count({ where: { supplierId: user.tenantId } }),
            prisma.offer.count({ where: { rfqSupplier: { supplierId: user.tenantId } } }),
            prisma.order.count({ where: { supplierId: user.tenantId } }),
            prisma.contract.count({ where: { order: { supplierId: user.tenantId } } })
        ]);

        // Fetch RFQs assigned to this supplier via RfqSupplier junction
        const participations = await prisma.rfqSupplier.findMany({
            where: { supplierId: user.tenantId },
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
                offers: {
                    orderBy: { round: 'desc' },
                    take: 1,
                    select: {
                        id: true,
                        submittedAt: true,
                        totalAmount: true,
                        currency: true
                    }
                }
            },
            take: 10,
            orderBy: { rfq: { createdAt: "desc" } }
        });

        const items = participations.map(p => {
            const latestOffer = p.offers[0] || null;
            return {
                participationId: p.id,
                rfqId: p.rfq.id,
                rfxCode: p.rfq.rfxCode,
                title: p.rfq.title,
                status: p.rfq.status,
                deadline: p.rfq.deadline,
                stage: p.stage, // SENT, VIEWED, OFFERED, DECLINED
                hasSubmittedOffer: !!latestOffer,
                offerDetails: latestOffer ? {
                    id: latestOffer.id,
                    submittedAt: latestOffer.submittedAt,
                    totalAmount: latestOffer.totalAmount,
                    currency: latestOffer.currency
                } : null
            };
        });

        const totals = {
            rfqs: rfqCount,
            offers: offerCount,
            orders: orderCount,
            contracts: contractCount
        };

        return NextResponse.json({ totals, items });
    } catch (e: any) {
        console.error("[Portal Dashboard API Error]", e);
        return jsonError(500, "server_error", { message: e.message });
    }
}
