import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermissionApi } from "@/lib/apiAuth";
import { publishRfqAndNotify } from "@/lib/rfqNotifications";

// POST: Publish an RFQ (change status to OPEN) and notify suppliers
export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const authResult = await requirePermissionApi(req, "rfq:manage");
        if (authResult instanceof NextResponse) return authResult;

        const rfqId = params.id;

        // Check if RFQ exists
        const rfq = await prisma.rfq.findUnique({
            where: { id: rfqId }
        });

        if (!rfq) {
            return NextResponse.json({ error: "rfq_not_found" }, { status: 404 });
        }

        if (rfq.status === "OPEN") {
            return NextResponse.json({ error: "already_published", message: "Bu RFQ zaten yayında." }, { status: 400 });
        }

        // Publish RFQ and notify suppliers
        const result = await publishRfqAndNotify(rfqId);

        if (!result.success) {
            return NextResponse.json({ error: "publish_failed" }, { status: 500 });
        }

        // Get updated RFQ
        const updatedRfq = await prisma.rfq.findUnique({
            where: { id: rfqId },
            include: {
                items: {
                    include: {
                        category: true
                    }
                }
            }
        });

        return NextResponse.json({
            ok: true,
            message: "RFQ yayınlandı ve ilgili tedarikçilere bildirim gönderildi.",
            rfq: updatedRfq
        });
    } catch (error) {
        console.error("Publish RFQ error:", error);
        return NextResponse.json({ error: "internal_error" }, { status: 500 });
    }
}
