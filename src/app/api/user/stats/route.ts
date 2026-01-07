import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/apiAuth";

export async function GET() {
    try {
        const user = await getSessionUser();

        if (!user) {
            return NextResponse.json({ requests: 0, orders: 0 });
        }

        const userId = user.id;

        // Count user's requests, orders and rfqs
        const [requests, orders, rfqs] = await Promise.all([
            prisma.request.count({ where: { ownerUserId: userId } }).catch(() => 0),
            prisma.order.count({ where: { responsibleUserId: userId } }).catch(() => 0),
            prisma.rfq.count({ where: { createdById: userId } }).catch(() => 0),
        ]);

        return NextResponse.json({ requests, orders, rfqs });
    } catch {
        // Return default values on error
        return NextResponse.json({ requests: 0, orders: 0, rfqs: 0 });
    }
}
