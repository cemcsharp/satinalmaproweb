import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/apiError";

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const item = await prisma.scoringType.findUnique({ where: { id } });
    if (!item) return jsonError(404, "not_found");
    return NextResponse.json(item);
  } catch (_e) {
    return jsonError(500, "scoring_type_get_failed");
  }
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));
    const data: any = {};
    ["code", "name", "kind", "description"].forEach((k) => {
      if (k in body) data[k] = String(body[k]).trim();
    });
    ["scaleMin", "scaleMax", "step"].forEach((k) => {
      if (k in body) data[k] = Number(body[k]);
    });
    if ("active" in body) data.active = Boolean(body.active);
    const updated = await prisma.scoringType.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (e: any) {
    const msg = e?.code === "P2002" ? "duplicate_code" : "scoring_type_update_failed";
    return jsonError(500, msg);
  }
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    // İlişkili soru kontrolü
    const relatedCount = await prisma.evaluationQuestion.count({ where: { scoringTypeId: id } });
    if (relatedCount > 0) {
      return jsonError(400, "has_related_questions", { details: { count: relatedCount } });
    }
    await prisma.scoringType.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (_e) {
    return jsonError(500, "scoring_type_delete_failed");
  }
}