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

        // Count user's requests and orders
        const [requests, orders] = await Promise.all([
            prisma.request.count({ where: { ownerUserId: userId } }).catch(() => 0),
            prisma.order.count({ where: { responsibleUserId: userId } }).catch(() => 0),
        ]);

        return NextResponse.json({ requests, orders });
    } catch {
        // Return default values on error
        return NextResponse.json({ requests: 0, orders: 0 });
    }
}
