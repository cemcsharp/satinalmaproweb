import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/apiError";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { getUserWithPermissions } = await import("@/lib/apiAuth");
        const user = await getUserWithPermissions(req);
        if (!user) return jsonError(401, "unauthorized");

        const { id } = await params;

        const rfq = await prisma.rfq.findUnique({
            where: { id },
            include: {
                items: true,
                suppliers: {
                    include: {
                        offer: {
                            include: { items: true }
                        }
                    }
                },
                requests: {
                    select: { id: true, barcode: true, subject: true }
                }
            }
        });

        if (!rfq) return jsonError(404, "not_found");

        // Multi-tenant Isolation: User must belong to the same tenant as the RFQ
        if (!user.isSuperAdmin && (rfq as any).tenantId !== user.tenantId) {
            return jsonError(403, "tenant_mismatch", { message: "Bu veriye erişim yetkiniz yok (Firma uyuşmazlığı)." });
        }

        // Authorization check (unit isolation if needed, for now simplified)

        // Transform Decimal to Number for UI
        const mappedRfq = {
            ...rfq,
            items: rfq.items.map(i => ({
                ...i,
                quantity: Number(i.quantity)
            })),
            suppliers: rfq.suppliers.map(s => ({
                ...s,
                offer: s.offer ? {
                    ...s.offer,
                    totalAmount: Number(s.offer.totalAmount),
                    items: s.offer.items.map(oi => ({
                        ...oi,
                        quantity: Number(oi.quantity),
                        unitPrice: Number(oi.unitPrice),
                        totalPrice: Number(oi.totalPrice)
                    }))
                } : null
            }))
        };

        return NextResponse.json(mappedRfq);

    } catch (e) {
        return jsonError(500, "server_error");
    }
}

// Update RFQ (e.g. Cancel, Complete)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    // ... implementation for status update
    return NextResponse.json({ ok: true });
}
