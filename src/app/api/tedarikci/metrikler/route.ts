import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";

type MetricInput = {
  supplierId: string;
  period?: string; // YYYY-MM
  source?: string; // ERP | QA | Purchasing | API
  onTimeRate?: number; // 0..1
  defectRate?: number; // 0..1 (lower is better)
  avgLeadTime?: number; // days
  priceIndex?: number; // relative index, lower is better
  serviceScore?: number; // 0..1
};

function currentPeriod(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const items: MetricInput[] = Array.isArray(body) ? body : [body];
    const data = items.map((i) => ({
      supplierId: i.supplierId,
      period: i.period ?? currentPeriod(),
      source: i.source ?? "API",
      onTimeRate: i.onTimeRate ?? null,
      defectRate: i.defectRate ?? null,
      avgLeadTime: i.avgLeadTime ?? null,
      priceIndex: i.priceIndex ?? null,
      serviceScore: i.serviceScore ?? null,
    }));

    const created: any[] = [];
    for (const row of data) {
      try {
        const upserted = await prisma.supplierPerformanceMetric.upsert({
          where: { supplierId_period_source: { supplierId: row.supplierId, period: row.period!, source: row.source! } },
          update: {
            onTimeRate: row.onTimeRate,
            defectRate: row.defectRate,
            avgLeadTime: row.avgLeadTime,
            priceIndex: row.priceIndex,
            serviceScore: row.serviceScore,
          },
          create: row,
        });
        created.push(upserted);
      } catch (e: any) {
        created.push({ error: e.message, item: row });
      }
    }

    return NextResponse.json({ ok: true, count: created.length, results: created });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Unknown error" }, { status: 500 });
  }
}