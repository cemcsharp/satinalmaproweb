import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";

function currentPeriod(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function prevPeriod(period: string): string {
  const [y, m] = period.split("-").map((x) => parseInt(x, 10));
  const date = new Date(y, m - 1, 1);
  date.setMonth(date.getMonth() - 1);
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${yy}-${mm}`;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const period = url.searchParams.get("period") ?? currentPeriod();
  const threshold = Number(url.searchParams.get("threshold") ?? 60);
  const drop = Number(url.searchParams.get("drop") ?? 15);

  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const suppliers = await prisma.tenant.findMany({
      where: { isActive: true, isSupplier: true },
      select: { id: true, name: true }
    });
    const alerts: any[] = [];
    const prev = prevPeriod(period);

    for (const s of suppliers) {
      const curr = await prisma.supplierEvaluationSummary.findUnique({ where: { supplierId_period: { supplierId: s.id, period } } });
      const prevSum = await prisma.supplierEvaluationSummary.findUnique({ where: { supplierId_period: { supplierId: s.id, period: prev } } });
      const hasMetrics = await prisma.supplierPerformanceMetric.count({ where: { supplierId: s.id, period } });

      if (!hasMetrics) {
        const msg = `Dönem ${period} için veri bulunamadı (${s.name}).`;
        alerts.push({ supplierId: s.id, period, type: "MissingData", message: msg, severity: "warning" });
        try {
          await prisma.supplierAlert.create({ data: { supplierId: s.id, period, type: "MissingData", message: msg, severity: "warning" } });
        } catch { }
        continue;
      }

      if (curr && curr.totalScore < threshold) {
        const msg = `Toplam skor düşük: ${curr.totalScore} (<${threshold}) (${s.name}, ${period}).`;
        alerts.push({ supplierId: s.id, period, type: "Threshold", message: msg, severity: "critical" });
        try {
          await prisma.supplierAlert.create({ data: { supplierId: s.id, period, type: "Threshold", message: msg, severity: "critical" } });
        } catch { }
      }

      if (curr && prevSum) {
        const diff = Math.round(prevSum.totalScore - curr.totalScore);
        if (diff >= drop) {
          const msg = `Performans düşüşü: -${diff} puan (${prev}→${period}, ${s.name}).`;
          alerts.push({ supplierId: s.id, period, type: "Drop", message: msg, severity: "warning" });
          try {
            await prisma.supplierAlert.create({ data: { supplierId: s.id, period, type: "Drop", message: msg, severity: "warning" } });
          } catch { }
        }
      }
    }

    return NextResponse.json({ ok: true, period, count: alerts.length, alerts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Unknown error" }, { status: 500 });
  }
}