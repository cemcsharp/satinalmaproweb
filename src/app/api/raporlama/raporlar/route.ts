import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const source = url.searchParams.get("source") || "all"; // talep|siparis|sozlesme|tedarikci|dataset|all
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const groupBy = url.searchParams.get("groupBy") || "day"; // day|week|month
  const agg = url.searchParams.get("agg"); // method | regulation | unitRequests | unitSpend

  // Aggregations by domain categories
  if (agg) {
    const start = from ? new Date(from) : undefined;
    const end = to ? new Date(to) : undefined;
    const dateFilter = (field: string): Record<string, { gte?: Date; lte?: Date }> => {
      if (!start && !end) return {};
      return { [field]: { gte: start, lte: end } } as any;
    };
    try {
      if (agg === "method") {
        const groups = await prisma.order.groupBy({ by: ["methodId"], _count: { _all: true }, _sum: { realizedTotal: true }, where: dateFilter("createdAt") as any });
        const ids = groups.map((g) => g.methodId);
        const items = await prisma.optionItem.findMany({ where: { id: { in: ids } } });
        const labelById: Record<string, string> = {};
        for (const it of items) labelById[it.id] = it.label;
        const payload = groups.map((g) => ({ label: labelById[g.methodId] || g.methodId, count: g._count._all, spend: Number(g._sum.realizedTotal || 0) }));
        return NextResponse.json({ items: payload.sort((a, b) => b.count - a.count) });
      }
      if (agg === "regulation") {
        const groups = await prisma.order.groupBy({ by: ["regulationId"], _count: { _all: true }, _sum: { realizedTotal: true }, where: dateFilter("createdAt") as any });
        const ids = groups.map((g) => g.regulationId);
        const items = await prisma.optionItem.findMany({ where: { id: { in: ids } } });
        const labelById: Record<string, string> = {};
        for (const it of items) labelById[it.id] = it.label;
        const payload = groups.map((g) => ({ label: labelById[g.regulationId] || g.regulationId, count: g._count._all, spend: Number(g._sum.realizedTotal || 0) }));
        return NextResponse.json({ items: payload.sort((a, b) => b.count - a.count) });
      }
      if (agg === "unitRequests") {
        const groups = await prisma.request.groupBy({ by: ["unitId"], _count: { _all: true }, where: dateFilter("createdAt") as any });
        const ids = groups.map((g) => g.unitId);
        const items = await prisma.optionItem.findMany({ where: { id: { in: ids } } });
        const labelById: Record<string, string> = {};
        for (const it of items) labelById[it.id] = it.label;
        const payload = groups.map((g) => ({ label: labelById[g.unitId] || g.unitId, count: g._count._all, spend: 0 }));
        return NextResponse.json({ items: payload.sort((a, b) => b.count - a.count) });
      }
      if (agg === "unitSpend") {
        const orders = await prisma.order.findMany({ where: dateFilter("createdAt") as any, select: { realizedTotal: true, request: { select: { unitId: true } } } });
        const bucket = new Map<string, number>();
        for (const o of orders) {
          const unitId = o.request?.unitId || "-";
          const inc = Number((o as any).realizedTotal || 0);
          bucket.set(unitId, (bucket.get(unitId) || 0) + inc);
        }
        const unitIds = Array.from(bucket.keys()).filter((id) => id !== "-");
        const items = await prisma.optionItem.findMany({ where: { id: { in: unitIds } } });
        const labelById: Record<string, string> = { "-": "Bağlı değil" };
        for (const it of items) labelById[it.id] = it.label;
        const payload = Array.from(bucket.entries()).map(([unitId, spend]) => ({ label: labelById[unitId] || unitId, count: 0, spend: Number(spend || 0) }));
        return NextResponse.json({ items: payload.sort((a, b) => b.spend - a.spend) });
      }
      if (agg === "summary") {
        const [reqCount, ordGroup, contCount, invCount, invSum] = await Promise.all([
          prisma.request.count({ where: dateFilter("createdAt") as any }).catch(() => 0),
          prisma.order.groupBy({ by: ["id"], where: dateFilter("createdAt") as any, _sum: { realizedTotal: true } }).catch(() => []),
          prisma.contract.count({ where: dateFilter("createdAt") as any }).catch(() => 0),
          prisma.invoice.count({ where: dateFilter("createdAt") as any }).catch(() => 0),
          prisma.invoice.groupBy({ by: ["status"], where: dateFilter("createdAt") as any, _sum: { amount: true } }).catch(() => []),
        ]);
        const totalSpend = ordGroup.reduce((s, g) => s + Number(g._sum.realizedTotal || 0), 0);
        const invoiceAmounts: Record<string, number> = {};
        for (const g of invSum) invoiceAmounts[g.status] = Number(g._sum.amount || 0);
        return NextResponse.json({
          summary: {
            requests: reqCount,
            orders: ordGroup.length,
            contracts: contCount,
            invoices: invCount,
            spend: totalSpend,
            invoiceAmounts,
            range: { from, to },
          },
        });
      }
      return NextResponse.json({ items: [] });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      return NextResponse.json({ error: "agg_failed", message }, { status: 500 });
    }
  }

  // If dataset is selected, try to read time_series entries from dataset.jsonl
  if (source === "dataset") {
    try {
      const dataPath = path.join(process.cwd(), "data", "dataset.jsonl");
      const raw = fs.readFileSync(dataPath, "utf-8");
      const lines = raw.split(/\r?\n/).filter(Boolean);
      // find first time_series payload
      let series: { date: string; requests: number; orders: number; spend: number }[] | null = null;
      for (const line of lines) {
        try {
          const obj = JSON.parse(line);
          if (obj?.type === "time_series" && Array.isArray(obj?.payload)) {
            series = obj.payload as { date: string; requests: number; orders: number; spend: number }[];
            break;
          }
        } catch { }
      }
      const items = (series || []).map((p) => ({
        label: String(p.date),
        source: "dataset",
        count: Number(p.orders || 0),
        spend: Number(p.spend || 0),
      }));
      const filtered = items.filter((it) => {
        const d = new Date(it.label);
        const okFrom = from ? d >= new Date(from) : true;
        const okTo = to ? d <= new Date(to) : true;
        return okFrom && okTo;
      });
      const summary = {
        totalCount: filtered.reduce((acc, it) => acc + (Number(it.count) || 0), 0),
        totalSpend: filtered.reduce((acc, it) => acc + (Number(it.spend) || 0), 0),
        groupBy,
        source,
        range: { from, to },
      };
      return NextResponse.json({ items: filtered, summary }, { status: 200 });
    } catch (e: any) {
      return NextResponse.json({ error: "dataset_read_failed", message: e?.message || "unknown" }, { status: 500 });
    }
  }

  // Consolidate from DB when source=all
  if (source === "all") {
    try {
      const start = from ? new Date(from) : undefined;
      const end = to ? new Date(to) : undefined;
      // Helper to format label by groupBy
      const labelOf = (d: Date) => {
        const iso = d.toISOString();
        if (groupBy === "month") return iso.slice(0, 7);
        if (groupBy === "week") {
          const date = new Date(d);
          const day = date.getUTCDay();
          const diff = (day + 6) % 7; // Monday=0
          date.setUTCDate(date.getUTCDate() - diff);
          return date.toISOString().slice(0, 10);
        }
        return iso.slice(0, 10);
      };

      // Fetch minimal fields within optional date range
      const dateFilter = (field: string): Record<string, { gte?: Date; lte?: Date }> => {
        if (!start && !end) return {};
        return { [field]: { gte: start, lte: end } };
      };

      const [reqs, ords, conts, sups] = await Promise.all([
        prisma.request.findMany({ where: dateFilter("createdAt"), select: { createdAt: true } }).catch(() => []),
        prisma.order
          .findMany({ where: dateFilter("createdAt"), select: { createdAt: true, realizedTotal: true } })
          .catch(() => []),
        prisma.contract.findMany({ where: dateFilter("createdAt"), select: { createdAt: true } }).catch(() => []),
        prisma.supplier.findMany({ where: dateFilter("createdAt"), select: { createdAt: true } }).catch(() => []),
      ]);

      const bucket = new Map<string, { count: number; spend: number }>();
      const bump = (label: string, countInc: number, spendInc: number) => {
        const cur = bucket.get(label) || { count: 0, spend: 0 };
        cur.count += countInc;
        cur.spend += spendInc;
        bucket.set(label, cur);
      };

      for (const r of reqs) bump(labelOf(new Date(r.createdAt)), 1, 0);
      for (const c of conts) bump(labelOf(new Date(c.createdAt)), 1, 0);
      for (const s of sups) bump(labelOf(new Date(s.createdAt)), 1, 0);
      for (const o of ords) {
        const label = labelOf(new Date(o.createdAt));
        const realized: unknown = o.realizedTotal as unknown;
        const num = typeof (realized as { toNumber?: () => number }).toNumber === "function"
          ? (realized as { toNumber: () => number }).toNumber()
          : Number((realized as number | string | null | undefined) ?? 0);
        bump(label, 1, num);
      }

      // Convert to sorted items and apply range filter if provided
      const items = Array.from(bucket.entries())
        .map(([label, v]) => ({ label, source: "all", count: v.count, spend: Math.round(v.spend) }))
        .sort((a, b) => a.label.localeCompare(b.label));

      const summary = {
        totalCount: items.reduce((acc, it) => acc + (Number(it.count) || 0), 0),
        totalSpend: items.reduce((acc, it) => acc + (Number(it.spend) || 0), 0),
        groupBy,
        source,
        range: { from, to },
      };
      return NextResponse.json({ items, summary }, { status: 200 });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      return NextResponse.json({ error: "db_consolidation_failed", message }, { status: 500 });
    }
  }

  // Default: generate stub dataset respecting groupBy
  const points = 12;
  const items = Array.from({ length: points }).map((_, i) => {
    const date = new Date();
    if (groupBy === "month") date.setMonth(date.getMonth() - (points - 1 - i));
    else if (groupBy === "week") date.setDate(date.getDate() - (points - 1 - i) * 7);
    else date.setDate(date.getDate() - (points - 1 - i));
    const label = groupBy === "month" ? date.toISOString().slice(0, 7) : date.toISOString().slice(0, 10);
    return {
      label,
      source: source,
      count: 10 + Math.round(Math.random() * 15),
      spend: 8000 + Math.round(Math.random() * 10000),
    };
  });

  const summary = {
    totalCount: items.reduce((acc, it) => acc + it.count, 0),
    totalSpend: items.reduce((acc, it) => acc + it.spend, 0),
    groupBy,
    source,
    range: { from, to },
  };

  return NextResponse.json({ items, summary }, { status: 200 });
}