import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/apiError";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const _id = String(id || "").trim();
    if (!_id) return jsonError(400, "invalid_id", { message: "missing_id" });

    const ev = await prisma.supplierEvaluation.findUnique({
      where: { id: _id },
      include: {
        supplier: { select: { id: true, name: true } },
        order: { select: { id: true, barcode: true } },
        answers: {
          include: {
            question: {
              include: { scoringType: true },
            },
          },
          orderBy: [{ question: { section: "asc" } }, { questionId: "asc" }],
        },
      },
    });
    if (!ev) return jsonError(404, "not_found", { message: "evaluation_not_found" });

    const shaped = {
      id: ev.id,
      supplierId: ev.supplierId,
      supplierName: ev.supplier?.name || "",
      orderId: ev.orderId,
      orderBarcode: ev.order?.barcode || null,
      submittedAt: ev.submittedAt,
      totalScore: ev.totalScore ? Number(ev.totalScore) : null,
      answers: (ev.answers || []).map((a) => ({
        id: a.id,
        questionId: a.questionId,
        questionText: a.question?.text || "",
        section: (a.question?.section as string | null) || null,
        type: (a.question?.type as string | null) || null,
        scoringType: a.question?.scoringType
          ? { code: a.question.scoringType.code, name: a.question.scoringType.name }
          : null,
        value: a.value,
      })),
    };

    return NextResponse.json({ item: shaped });
  } catch (e: any) {
    return jsonError(500, "server_error", { message: e?.message });
  }
}