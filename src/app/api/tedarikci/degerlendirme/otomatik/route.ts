import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";

function normalize(value: number | null | undefined, { min, max, invert = false }: { min: number; max: number; invert?: boolean }): number {
  if (value == null) return 0;
  const clamped = Math.max(min, Math.min(max, value));
  const base = (clamped - min) / (max - min);
  const v = invert ? 1 - base : base;
  return Math.round(v * 100);
}

function currentPeriod(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

const WEIGHTS = {
  quality: 0.4,
  delivery: 0.25,
  cost: 0.2,
  service: 0.15,
};

function decide(totalScore: number): string {
  if (totalScore >= 80) return "Onaylı";
  if (totalScore >= 60) return "Şartlı";
  return "Yetersiz";
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const period = url.searchParams.get("period") ?? currentPeriod();
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all suppliers (tenants with isSupplier: true)
    const suppliers = await prisma.tenant.findMany({
      where: { isActive: true, isSupplier: true },
      select: { id: true, name: true }
    });
    const summaries: any[] = [];

    for (const s of suppliers) {
      const metrics = await prisma.supplierPerformanceMetric.findMany({ where: { supplierId: s.id, period } });
      if (metrics.length === 0) {
        const summary = {
          supplierId: s.id,
          period,
          qualityScore: 0,
          deliveryScore: 0,
          costScore: 0,
          serviceScore: 0,
          totalScore: 0,
          decision: "Yetersiz",
        };
        summaries.push(summary);
        try {
          await prisma.supplierEvaluationSummary.upsert({
            where: { supplierId_period: { supplierId: s.id, period } },
            update: summary,
            create: summary,
          });
        } catch { }
        continue;
      }

      const avg = (arr: (number | null)[]) => {
        const vals = arr.filter((v) => typeof v === "number") as number[];
        if (vals.length === 0) return null;
        return vals.reduce((a, b) => a + b, 0) / vals.length;
      };

      const onTimeRate = avg(metrics.map((m) => m.onTimeRate ?? null));
      const defectRate = avg(metrics.map((m) => m.defectRate ?? null));
      const leadTime = avg(metrics.map((m) => m.avgLeadTime ?? null));
      const priceIndex = avg(metrics.map((m) => m.priceIndex ?? null));
      const serviceScoreRaw = avg(metrics.map((m) => m.serviceScore ?? null));

      const qualityScore = Math.round(
        (normalize(onTimeRate, { min: 0, max: 1 }) + normalize(defectRate, { min: 0, max: 1, invert: true })) / 2
      );
      const deliveryScore = Math.round(
        (normalize(onTimeRate, { min: 0, max: 1 }) + normalize(leadTime, { min: 1, max: 60, invert: true })) / 2
      );
      const costScore = normalize(priceIndex, { min: 0.5, max: 1.5, invert: true });
      const serviceScore = normalize(serviceScoreRaw, { min: 0, max: 1 });

      const totalScore = Math.round(
        qualityScore * WEIGHTS.quality +
        deliveryScore * WEIGHTS.delivery +
        costScore * WEIGHTS.cost +
        serviceScore * WEIGHTS.service
      );
      const decision = decide(totalScore);

      const summary = { supplierId: s.id, period, qualityScore, deliveryScore, costScore, serviceScore, totalScore, decision };
      summaries.push(summary);
      try {
        await prisma.supplierEvaluationSummary.upsert({
          where: { supplierId_period: { supplierId: s.id, period } },
          update: summary,
          create: summary,
        });
      } catch { }
    }

    try {
      await prisma.supplierReport.create({ data: { period, scope: "Global", payload: summaries } });
    } catch { }

    return NextResponse.json({ ok: true, period, count: summaries.length, summaries });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Unknown error" }, { status: 500 });
  }
}