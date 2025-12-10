import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { publish } from "@/app/api/toplanti/sse/[id]/route";
import { jsonError } from "@/lib/apiError";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const body = await req.json().catch(() => ({}));
    const content = String(body?.content || "").trim();
    const authorId = typeof body?.authorId === "string" ? String(body.authorId) : undefined;
    const isEncrypted = Boolean(body?.isEncrypted || false);
    if (!content) return jsonError(400, "content_required");
    const created = await prisma.meetingNote.create({ data: { meetingId: id, content, authorId: authorId || null, isEncrypted } });
    try { publish(id, "note_created", { id: created.id }); } catch {}
    return NextResponse.json({ ok: true, id: created.id });
  } catch (e: any) {
    return jsonError(500, "server_error", { message: e?.message });
  }
}
