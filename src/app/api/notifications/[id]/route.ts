import { NextRequest, NextResponse } from "next/server";
import { markAsRead } from "@/lib/notification-service";
import { requireAuthApi } from "@/lib/apiAuth";

export const runtime = "nodejs";

// PATCH /api/notifications/[id] - Mark notification as read
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireAuthApi(req);
    if (!auth) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const { id } = await params;

    try {
        await markAsRead(String(auth.userId), id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error marking notification as read:", error);
        return NextResponse.json({ error: "failed" }, { status: 500 });
    }
}
