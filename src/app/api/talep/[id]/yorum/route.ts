import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/apiError";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const body = await req.json().catch(() => ({}));
    const text = String(body?.text || "").trim();
    const authorId = String(body?.authorId || "").trim();
    if (!text || !authorId) return jsonError(400, "invalid_payload", { details: { required: ["text", "authorId"] } });
    const { id } = await context.params;
    const requestId = String(id || "").trim();
    if (!requestId) return jsonError(400, "invalid_request_id");
    // Validate request existence. Prisma throws if where is invalid; we guard above.
    const exists = await prisma.request.findUnique({ where: { id: requestId }, select: { id: true } });
    if (!exists) return jsonError(404, "request_not_found");

    const created = await prisma.comment.create({
      data: {
        text,
        authorId,
        requestId,
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    // Convert known Prisma error patterns into client-meaningful responses
    const msg = String(e?.message || "");
    if (/Argument `where`/.test(msg)) {
      return jsonError(400, "invalid_request_id", { message: msg });
    }
    if (e?.code === "P2003") {
      return jsonError(400, "invalid_author_or_request", { message: e?.message });
    }
    return jsonError(500, "server_error", { message: e?.message });
  }
}