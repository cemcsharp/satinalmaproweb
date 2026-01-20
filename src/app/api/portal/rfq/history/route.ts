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

        // Parse query params for pagination
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const skip = (page - 1) * limit;

        // Fetch RFQ participations where offer was submitted
        const [participations, total] = await Promise.all([
            prisma.rfqSupplier.findMany({
                where: {
                    supplierId: user.tenantId,
                    offers: { some: {} }
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
                    offers: {
                        orderBy: { round: 'desc' },
                        take: 1,
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
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.rfqSupplier.count({
                where: {
                    supplierId: user.tenantId,
                    offers: { some: {} }
                }
            })
        ]);

        // Transform response
        const history = participations.map((p: any) => {
            return {
                participationId: p.id,
                rfqId: p.rfq.id,
                rfxCode: p.rfq.rfxCode,
                title: p.rfq.title,
                rfqStatus: p.rfq.status,
                deadline: p.rfq.deadline,
                offers: p.offers.map((off: any) => ({
                    id: off.id,
                    totalAmount: off.totalAmount,
                    currency: off.currency,
                    submittedAt: off.submittedAt,
                    isWinner: off.isWinner,
                    validUntil: off.validUntil,
                    round: off.round,
                    itemCount: off.items.length,
                    items: off.items.map((item: any) => ({
                        name: item.rfqItem.name,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        totalPrice: item.totalPrice
                    }))
                }))
            };
        });

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
