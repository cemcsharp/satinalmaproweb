import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/apiError";
import { prisma } from "@/lib/db";

// Submit supplier evaluation per order
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const orderId = String(body?.orderId || "").trim();
    const supplierId = String(body?.supplierId || "").trim();
    const scoringType = String(body?.scoringType || "").trim().toLowerCase();
    const answers = Array.isArray(body?.answers) ? body.answers : [];
    if (!orderId || !supplierId) return jsonError(400, "invalid_payload", { message: "missing_order_or_supplier" });
    // Normalize and validate answers
    const normalized = answers.map((a: any) => ({
      questionId: String(a?.questionId || "").trim(),
      section: String(a?.section || "").trim(),
      value: a?.value,
    }));
    const validAnswers = normalized.filter((a: any) => a.questionId && String(a.value ?? "").trim() !== "");
    if (validAnswers.length === 0) return jsonError(400, "invalid_payload", { message: "answers_missing_or_invalid" });
    // Ensure all questionIds exist to avoid FK violations
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
      prisma.supplier.findUnique({ where: { id: supplierId } }),
    ]);
    if (!order || !supplier) return jsonError(404, "not_found");
  // Map answers to numeric scale 1..5
  const toNumeric = (val: any) => {
    const s = String(val ?? "").trim();
    const n = Number(s);
    if (Number.isFinite(n) && n >= 0) return n; // rating values "1".."5"
    // dropdown option ids mapping (demo: o1..o4)
    if (s === "o1") return 5; // Mükemmel
    if (s === "o2") return 4; // İyi
    if (s === "o3") return 3; // Orta
    if (s === "o4") return 2; // Zayıf
    return 0;
  };
  const values = validAnswers.map((a: any) => toNumeric(a?.value));

  // Define weights per scoring type (sum to 1)
  const pickWeights = (t: string) => {
    switch (t) {
      case "malzeme":
        return [0.4, 0.4, 0.2]; // Zamanında teslimat, kalite, iletişim
      case "hizmet":
        return [0.3, 0.5, 0.2]; // Zamanında hizmet, kalite, iletişim
      case "danismanlik":
        return [0.2, 0.4, 0.4]; // Zamanında, kalite, iletişim (iletişim ağırlık)
      case "bakim":
        return [0.5, 0.4, 0.1]; // Zamanında müdahale, kalite, iletişim
      case "insaat":
        return [0.4, 0.5, 0.1]; // Zamanında iş, kalite, iletişim
      default:
        const len = Math.max(values.length, 1);
        return Array.from({ length: len }, () => 1 / len);
    }
  };
  let overallRating = 0;
  let score = 0;
  if (scoringType === "hizmet" || scoringType === "malzeme" || scoringType === "danismanlik" || scoringType === "bakim" || scoringType === "insaat") {
    const bySection: Record<string, number[]> = {};
    for (let i = 0; i < validAnswers.length; i++) {
      const sec = String(validAnswers[i]?.section || "");
      const v = values[i] ?? 0;
      if (!bySection[sec]) bySection[sec] = [];
      bySection[sec].push(v);
    }
    const avg = (arr: number[]) => (arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0);
    const avgA = avg(bySection["A"] || []);
    const avgB = avg(bySection["B"] || []);
    const avgC = avg(bySection["C"] || []);
    const weights = scoringType === "danismanlik" ? [0.45, 0.30, 0.25]
      : scoringType === "bakim" ? [0.45, 0.35, 0.20]
      : [0.40, 0.30, 0.30];
    overallRating = Number((avgA * weights[0] + avgB * weights[1] + avgC * weights[2]).toFixed(2)); // 1..5 ölçeği
    score = Number(((overallRating / 5) * 100).toFixed(2));
    const decision = (() => {
      const dOnayli = scoringType === "insaat" ? "Onaylı Yüklenici" : "Onaylı Tedarikçi";
      const dCalis = scoringType === "insaat" ? "Çalışılabilir Yüklenici" : "Çalışılabilir";
      const dSartli = scoringType === "insaat" ? "Şartlı Yüklenici" : "Şartlı Çalışılabilir";
      const dYetersiz = scoringType === "insaat" ? "Yetersiz" : "Yetersiz";
      if (overallRating >= 4.5) return dOnayli;
      if (overallRating >= 3.5) return dCalis;
      if (overallRating >= 2.5) return dSartli;
      if (overallRating >= 1.0) return dYetersiz;
      return "Belirsiz";
    })();
    // Persist evaluation and answers
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
    return NextResponse.json({ id: created.id, orderId, supplierId, scoringType, avgA, avgB, avgC, overallRating, score, decision }, { status: 201 });
  } else {
    const weights = pickWeights(scoringType);
    const W = weights.slice(0, values.length);
    const totalW = W.reduce((s, w) => s + w, 0) || 1;
    const weighted = values.reduce((s: number, v: number, i: number) => s + v * (W[i] ?? 0), 0) / totalW;
    overallRating = Number(weighted.toFixed(2));
    score = Number(((weighted / 5) * 100).toFixed(2));
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
    return NextResponse.json({ id: created.id, orderId, supplierId, scoringType: scoringType || "genel", overallRating, score }, { status: 201 });
  }
  } catch (e: any) {
    return jsonError(500, "server_error", { message: e?.message });
  }
}