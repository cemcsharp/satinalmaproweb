import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/apiError";
import { prisma } from "@/lib/db";

// Fetch weights from database ScoringType table
async function getWeightsFromDB(scoringTypeCode: string): Promise<{ weightA: number; weightB: number; weightC: number } | null> {
  try {
    const scoringType = await prisma.scoringType.findFirst({
      where: {
        OR: [
          { code: scoringTypeCode },
          { code: scoringTypeCode.toUpperCase() },
          { code: scoringTypeCode.toLowerCase() },
          { name: { contains: scoringTypeCode, mode: "insensitive" } },
        ],
        active: true,
      },
      select: { weightA: true, weightB: true, weightC: true },
    });
    if (scoringType) {
      return {
        weightA: scoringType.weightA ?? 0.4,
        weightB: scoringType.weightB ?? 0.3,
        weightC: scoringType.weightC ?? 0.3,
      };
    }
    return null;
  } catch {
    return null;
  }
}

const DEFAULT_WEIGHTS: Record<string, [number, number, number]> = {
  malzeme: [0.4, 0.4, 0.2],
  hizmet: [0.3, 0.5, 0.2],
  danismanlik: [0.2, 0.4, 0.4],
  bakim: [0.5, 0.4, 0.1],
  insaat: [0.4, 0.5, 0.1],
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const orderId = String(body?.orderId || "").trim();
    const supplierId = String(body?.supplierId || "").trim();
    const scoringType = String(body?.scoringType || "").trim().toLowerCase();
    const answers = Array.isArray(body?.answers) ? body.answers : [];
    if (!orderId || !supplierId) return jsonError(400, "invalid_payload", { message: "missing_order_or_supplier" });

    const normalized = answers.map((a: any) => ({
      questionId: String(a?.questionId || "").trim(),
      section: String(a?.section || "").trim(),
      value: a?.value,
    }));
    const validAnswers = normalized.filter((a: any) => a.questionId && String(a.value ?? "").trim() !== "");
    if (validAnswers.length === 0) return jsonError(400, "invalid_payload", { message: "answers_missing_or_invalid" });

    const questionIds: string[] = Array.from(new Set<string>(validAnswers.map((a: any) => String(a.questionId))));
    const existing = await prisma.evaluationQuestion.findMany({ where: { id: { in: questionIds } }, select: { id: true } });
    const existingSet = new Set(existing.map((q) => q.id));
    const unknownIds = questionIds.filter((id) => !existingSet.has(id));
    if (unknownIds.length > 0) {
      return jsonError(400, "invalid_question_ids", { message: "unknown_question_ids", details: { unknownIds, count: unknownIds.length } });
    }

    // Ensure order and supplier exist
    const [order, supplier] = await Promise.all([
      prisma.order.findUnique({ where: { id: orderId }, include: { status: true } }),
      prisma.tenant.findUnique({ where: { id: supplierId, isSupplier: true } }),
    ]);
    if (!order || !supplier) return jsonError(404, "not_found");

    const toNumeric = (val: any) => {
      const s = String(val ?? "").trim();
      const n = Number(s);
      if (Number.isFinite(n) && n >= 0) return n;
      if (s === "o1") return 5;
      if (s === "o2") return 4;
      if (s === "o3") return 3;
      if (s === "o4") return 2;
      return 0;
    };
    const values = validAnswers.map((a: any) => toNumeric(a?.value));

    const dbWeights = await getWeightsFromDB(scoringType);

    let weights: [number, number, number];
    let weightsSource: "database" | "default" | "equal";

    if (dbWeights) {
      weights = [dbWeights.weightA, dbWeights.weightB, dbWeights.weightC];
      weightsSource = "database";
    } else if (DEFAULT_WEIGHTS[scoringType]) {
      weights = DEFAULT_WEIGHTS[scoringType];
      weightsSource = "default";
    } else {
      weights = [1 / 3, 1 / 3, 1 / 3];
      weightsSource = "equal";
    }

    const bySection: Record<string, number[]> = {};
    for (let i = 0; i < validAnswers.length; i++) {
      const sec = String(validAnswers[i]?.section || "").toUpperCase();
      const v = values[i] ?? 0;
      if (!bySection[sec]) bySection[sec] = [];
      bySection[sec].push(v);
    }

    const avg = (arr: number[]) => (arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0);
    const avgA = avg(bySection["A"] || []);
    const avgB = avg(bySection["B"] || []);
    const avgC = avg(bySection["C"] || []);

    const overallRating = Number((avgA * weights[0] + avgB * weights[1] + avgC * weights[2]).toFixed(2));
    const score = Number(((overallRating / 5) * 100).toFixed(2));

    const decision = (() => {
      const dOnayli = scoringType === "insaat" ? "Onaylı Yüklenici" : "Onaylı Tedarikçi";
      const dCalis = scoringType === "insaat" ? "Çalışılabilir Yüklenici" : "Çalışılabilir";
      const dSartli = scoringType === "insaat" ? "Şartlı Yüklenici" : "Şartlı Çalışılabilir";
      const dYetersiz = "Yetersiz";
      if (overallRating >= 4.5) return dOnayli;
      if (overallRating >= 3.5) return dCalis;
      if (overallRating >= 2.5) return dSartli;
      if (overallRating >= 1.0) return dYetersiz;
      return "Belirsiz";
    })();

    const created = await prisma.$transaction(async (tx) => {
      const ev = await tx.supplierEvaluation.create({
        data: {
          orderId,
          supplierId,
          submittedAt: new Date(),
          totalScore: score,
        },
      });
      await tx.supplierEvaluationAnswer.createMany({
        data: validAnswers.map((a: any) => ({
          evaluationId: ev.id,
          questionId: String(a?.questionId || ""),
          value: String(a?.value ?? ""),
        })),
      });
      return ev;
    });

    return NextResponse.json({
      id: created.id,
      orderId,
      supplierId,
      scoringType: scoringType || "genel",
      avgA,
      avgB,
      avgC,
      weights: { A: weights[0], B: weights[1], C: weights[2] },
      weightsSource,
      overallRating,
      score,
      decision,
    }, { status: 201 });

  } catch (e: any) {
    return jsonError(500, "server_error", { message: e?.message });
  }
}