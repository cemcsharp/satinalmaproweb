import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ requests: 0, orders: 0, meetings: 0 });
        }

        const userId = session.user.id;

        // Count user's requests, orders, and meetings
        const [requests, orders, meetings] = await Promise.all([
            prisma.request.count({ where: { ownerId: userId } }).catch(() => 0),
            prisma.order.count({ where: { createdById: userId } }).catch(() => 0),
            prisma.meeting.count({ where: { organizerId: userId } }).catch(() => 0),
        ]);

        return NextResponse.json({ requests, orders, meetings });
    } catch {
        // Return default values on error
        return NextResponse.json({ requests: 0, orders: 0, meetings: 0 });
    }
}
