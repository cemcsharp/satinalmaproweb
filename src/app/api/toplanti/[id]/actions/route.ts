import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { publish } from "@/app/api/toplanti/sse/[id]/route";
import { jsonError } from "@/lib/apiError";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const body = await req.json().catch(() => ({}));
    const title = String(body?.title || "").trim();
    const description = typeof body?.description === "string" ? String(body.description) : undefined;
    const ownerId = typeof body?.ownerId === "string" ? String(body.ownerId) : undefined;
    const dueDateRaw = body?.dueDate || null;
    const dueDate = dueDateRaw ? new Date(dueDateRaw) : null;
    if (dueDate && isNaN(dueDate.getTime())) return jsonError(400, "invalid_dueDate");
    if (!title) return jsonError(400, "title_required");
    const created = await prisma.meetingActionItem.create({
      data: {
        meetingId: id,
        title,
        description: description || null,
        ownerId: ownerId || null,
        dueDate,
        status: "planned",
      },
    });
    try { publish(id, "action_created", { id: created.id }); } catch {}
    return NextResponse.json({ ok: true, id: created.id });
  } catch (e: any) {
    return jsonError(500, "server_error", { message: e?.message });
  }
}
