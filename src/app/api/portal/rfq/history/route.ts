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

        // Parse query params for pagination
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const skip = (page - 1) * limit;

        // Fetch RFQ participations where offer was submitted
        const [participations, total] = await Promise.all([
            prisma.rfqSupplier.findMany({
                where: {
                    supplierId: user.supplierId,
                    offer: { isNot: null }
                },
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
                            totalAmount: true,
                            currency: true,
                            submittedAt: true,
                            isWinner: true,
                            validUntil: true,
                            items: {
                                select: {
                                    id: true,
                                    quantity: true,
                                    unitPrice: true,
                                    totalPrice: true,
                                    rfqItem: {
                                        select: { name: true }
                                    }
                                }
                            }
                        }
                    }
                },
                orderBy: { offer: { submittedAt: "desc" } },
                skip,
                take: limit
            }),
            prisma.rfqSupplier.count({
                where: {
                    supplierId: user.supplierId,
                    offer: { isNot: null }
                }
            })
        ]);

        // Transform response
        const history = participations.map(p => ({
            participationId: p.id,
            rfqId: p.rfq.id,
            rfxCode: p.rfq.rfxCode,
            title: p.rfq.title,
            rfqStatus: p.rfq.status,
            deadline: p.rfq.deadline,
            offer: p.offer ? {
                id: p.offer.id,
                totalAmount: p.offer.totalAmount,
                currency: p.offer.currency,
                submittedAt: p.offer.submittedAt,
                isWinner: p.offer.isWinner,
                validUntil: p.offer.validUntil,
                itemCount: p.offer.items.length,
                items: p.offer.items.map(item => ({
                    name: item.rfqItem.name,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    totalPrice: item.totalPrice
                }))
            } : null
        }));

        return NextResponse.json({
            history,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (e: unknown) {
        console.error("[Portal RFQ History API Error]", e);
        const message = e instanceof Error ? e.message : "Unknown error";
        return jsonError(500, "server_error", { message });
    }
}
