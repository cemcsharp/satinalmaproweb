import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/apiError";
import { requireAuthApi } from "@/lib/apiAuth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuthApi(req);
    if (!auth) return jsonError(401, "unauthorized");
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const title = String(body?.title || "").trim();
    const url = String(body?.url || "").trim();
    const mimeType = String(body?.mimeType || "").trim();
    const details: string[] = [];
    if (!title) details.push("title_required");
    if (!url) details.push("url_required");
    if (!mimeType) details.push("mime_required");
    if (details.length) return jsonError(400, "invalid_payload", { details });
    const exists = await prisma.contract.findUnique({ where: { id } });
    if (!exists) return jsonError(404, "not_found");
    const created = await prisma.contractAttachment.create({ data: { contractId: id, title, url, mimeType } });
    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    return jsonError(500, "attachment_create_failed", { message: e?.message });
  }
}