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
    const type = String(body?.type || "").trim();
    const dateRaw = body?.date;
    const note = body?.note ? String(body.note) : undefined;
    const date = dateRaw ? new Date(dateRaw) : null;
    const details: string[] = [];
    if (!type) details.push("type_required");
    if (!date || isNaN(date.getTime())) details.push("invalid_date");
    if (details.length) return jsonError(400, "invalid_payload", { details });
    const exists = await prisma.contract.findUnique({ where: { id } });
    if (!exists) return jsonError(404, "not_found");
    const created = await prisma.contractEvent.create({ data: { contractId: id, type, date: date as Date, note } });
    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    return jsonError(500, "event_create_failed", { message: e?.message });
  }
}