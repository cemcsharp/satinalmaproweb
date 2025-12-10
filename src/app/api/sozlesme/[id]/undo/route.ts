import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/apiError";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const existing = await prisma.contract.findUnique({ where: { id } });
    if (!existing) return jsonError(404, "not_found");
    if (!existing.deletedAt) return NextResponse.json({ status: "not_deleted" });
    const restored = await prisma.contract.update({ where: { id }, data: { deletedAt: null } });
    return NextResponse.json(restored);
  } catch (e: any) {
    return jsonError(500, "undo_failed", { message: e?.message });
  }
}