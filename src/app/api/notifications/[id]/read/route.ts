import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/apiError";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        const safeId = String(id || "").trim();
        if (!safeId) return jsonError(404, "not_found");

        // Mark notification as read
        const updated = await prisma.notification.update({
            where: { id: safeId },
            data: { read: true },
        });

        return NextResponse.json({ ok: true, notification: updated });
    } catch (e: any) {
        if (e?.code === "P2025") {
            return jsonError(404, "notification_not_found");
        }
        return jsonError(500, "server_error", { message: e?.message });
    }
}
