import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/apiError";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const items = await prisma.cAPAAction.findMany({ where: { capaId: id }, orderBy: { createdAt: "asc" } });
    return NextResponse.json({ items, total: items.length });
  } catch (e: any) {
    return jsonError(500, "server_error", { message: e?.message });
  }
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const body = await req.json();
    const type = String(body?.type || "").trim();
    const description = String(body?.description || "").trim();
    if (!type || !description) return jsonError(400, "invalid_payload");
    const created = await prisma.cAPAAction.create({
      data: {
        capaId: id,
        type,
        description,
        ownerId: body?.ownerId || null,
        dueDate: body?.dueDate || null,
        status: String(body?.status || "planned"),
      },
    });
    await prisma.cAPAHistory.create({ data: { capaId: id, event: "action_added", details: `${type}: ${description.substring(0, 80)}` } });
    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    return jsonError(500, "server_error", { message: e?.message });
  }
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const body = await req.json();
    const actionId = String(body?.id || "").trim();
    if (!actionId) return jsonError(400, "invalid_payload");
    const existing = await prisma.cAPAAction.findUnique({ where: { id: actionId } });
    if (!existing || existing.capaId !== id) return jsonError(404, "not_found");
    const data: any = {};
    if (typeof body.description === "string") data.description = body.description;
    if (typeof body.type === "string") data.type = body.type;
    if (typeof body.ownerId !== "undefined") data.ownerId = body.ownerId ?? null;
    if (typeof body.dueDate !== "undefined") data.dueDate = body.dueDate ?? null;
    if (typeof body.status === "string") data.status = body.status;
    if (typeof body.completedAt !== "undefined") data.completedAt = body.completedAt ?? null;
    const updated = await prisma.cAPAAction.update({ where: { id: actionId }, data });
    if (typeof body.status === "string" && body.status !== existing.status) {
      await prisma.cAPAHistory.create({ data: { capaId: id, event: "action_updated", details: `${existing.status} -> ${body.status}` } });
    }
    if (updated.status === "done" && !existing.completedAt) {
      await prisma.cAPAHistory.create({ data: { capaId: id, event: "action_completed", details: `${existing.type}: ${existing.description.substring(0, 80)}` } });
    }
    return NextResponse.json(updated);
  } catch (e: any) {
    return jsonError(500, "server_error", { message: e?.message });
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const { searchParams } = new URL(req.url);
    const actionId = String(searchParams.get("id") || "").trim();
    if (!actionId) return jsonError(400, "invalid_payload");
    const existing = await prisma.cAPAAction.findUnique({ where: { id: actionId } });
    if (!existing || existing.capaId !== id) return jsonError(404, "not_found");
    await prisma.cAPAAction.delete({ where: { id: actionId } });
    await prisma.cAPAHistory.create({ data: { capaId: id, event: "action_deleted", details: `${existing.type}: ${existing.description.substring(0, 80)}` } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return jsonError(500, "server_error", { message: e?.message });
  }
}