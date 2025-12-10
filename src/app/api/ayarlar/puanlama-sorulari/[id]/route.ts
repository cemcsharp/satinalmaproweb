import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/apiError";

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const item = await prisma.evaluationQuestion.findUnique({ where: { id }, include: { scoringType: true } });
    if (!item) return jsonError(404, "not_found");
    return NextResponse.json(item);
  } catch (_e) {
    return jsonError(500, "question_get_failed");
  }
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));
    const data: any = {};
    ["text", "type", "section"].forEach((k) => {
      if (k in body) data[k] = String(body[k]).trim();
    });
    ["required", "active"].forEach((k) => {
      if (k in body) data[k] = Boolean(body[k]);
    });
    if ("sort" in body) data.sort = Number(body.sort);
    if ("scoringTypeId" in body) data.scoringTypeId = body.scoringTypeId ? String(body.scoringTypeId) : null;
    const updated = await prisma.evaluationQuestion.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (_e) {
    return jsonError(500, "question_update_failed");
  }
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    await prisma.$transaction([
      prisma.evaluationOption.deleteMany({ where: { questionId: id } }),
      prisma.evaluationQuestion.delete({ where: { id } }),
    ]);
    return NextResponse.json({ ok: true });
  } catch (_e) {
    return jsonError(500, "question_delete_failed");
  }
}