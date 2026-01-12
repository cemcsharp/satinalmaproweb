import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { randomBytes } from "crypto";

// POST: Join an open RFQ (create RfqSupplier participation)
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: "unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { rfqId } = body;

        if (!rfqId) {
            return NextResponse.json({ error: "rfqId_required" }, { status: 400 });
        }

        // Get the supplier for this user
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { supplier: true }
        });

        if (!user?.supplier) {
            return NextResponse.json({ error: "supplier_not_found" }, { status: 404 });
        }

        const supplier = user.supplier;

        // Check if RFQ exists and is open
        const rfq = await prisma.rfq.findUnique({
            where: { id: rfqId }
        });

        if (!rfq) {
            return NextResponse.json({ error: "rfq_not_found" }, { status: 404 });
        }

        if (rfq.status !== "OPEN") {
            return NextResponse.json({ error: "rfq_not_open" }, { status: 400 });
        }

        // Check if already participating
        const existing = await prisma.rfqSupplier.findFirst({
            where: {
                rfqId,
                supplierId: supplier.id
            }
        });

        if (existing) {
            return NextResponse.json({ ok: true, token: existing.token });
        }

        // Create new participation
        const token = randomBytes(32).toString("hex");
        const tokenExpiry = new Date();
        tokenExpiry.setDate(tokenExpiry.getDate() + 30); // 30 day expiry

        const participation = await prisma.rfqSupplier.create({
            data: {
                rfqId,
                supplierId: supplier.id,
                email: supplier.email || session.user.email,
                token,
                tokenExpiry,
                stage: "VIEWED"
            }
        });

        return NextResponse.json({ ok: true, token: participation.token });
    } catch (error) {
        console.error("Join RFQ error:", error);
        return NextResponse.json({ error: "internal_error" }, { status: 500 });
    }
}
