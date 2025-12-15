import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/apiError";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const items = await prisma.cAPAWhy.findMany({ where: { capaId: id }, orderBy: { idx: "asc" } });
    return NextResponse.json({ items, total: items.length });
  } catch (e: any) {
    return jsonError(500, "server_error", { message: e?.message });
  }
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const body = await req.json();
    const idx = Number(body?.idx || 0);
    const text = String(body?.text || "").trim();
    if (!idx || !text) return jsonError(400, "invalid_payload");
    // Upsert to allow editing a specific why index
    const existing = await prisma.cAPAWhy.findUnique({ where: { capaId_idx: { capaId: id, idx } } });
    const saved = existing
      ? await prisma.cAPAWhy.update({ where: { capaId_idx: { capaId: id, idx } }, data: { text } })
      : await prisma.cAPAWhy.create({ data: { capaId: id, idx, text } });
    await prisma.cAPAHistory.create({ data: { capaId: id, event: "rootcause_updated", details: `Why #${idx} güncellendi` } });
    return NextResponse.json(saved, { status: existing ? 200 : 201 });
  } catch (e: any) {
    return jsonError(500, "server_error", { message: e?.message });
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const { searchParams } = new URL(req.url);
    const idx = Number(searchParams.get("idx") || 0);
    if (!idx) return jsonError(400, "invalid_payload");
    await prisma.cAPAWhy.delete({ where: { capaId_idx: { capaId: id, idx } } });
    await prisma.cAPAHistory.create({ data: { capaId: id, event: "rootcause_updated", details: `Why #${idx} silindi` } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return jsonError(500, "server_error", { message: e?.message });
  }
}