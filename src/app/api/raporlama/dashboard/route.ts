import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const daysParam = Number(url.searchParams.get("days") || 14);
  const days = Math.min(Math.max(daysParam, 1), 90);
  const now = new Date();
  const start = new Date();
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);

  // Fetch totals
  const [requestsTotal, ordersTotal, suppliersTotal, contractsTotal, invoicesTotal] = await Promise.all([
    prisma.request.count(),
    prisma.order.count(),
    prisma.supplier.count(),
    prisma.contract.count(),
    prisma.invoice.count(),
  ]);

  // Fetch last 14 days data in bulk
  const [recentRequests, recentOrders] = await Promise.all([
    prisma.request.findMany({ where: { createdAt: { gte: start } }, select: { createdAt: true } }),
    prisma.order.findMany({ where: { createdAt: { gte: start } }, select: { createdAt: true, realizedTotal: true } }),
  ]);

  // Aggregate per day
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const keyOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const range: string[] = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return keyOf(d);
  });
  const dayReq: Record<string, number> = {};
  const dayOrd: Record<string, number> = {};
  const daySpend: Record<string, number> = {};
  for (const r of recentRequests) {
    const k = keyOf(new Date(r.createdAt));
    dayReq[k] = (dayReq[k] || 0) + 1;
  }
  for (const o of recentOrders) {
    const k = keyOf(new Date(o.createdAt));
    dayOrd[k] = (dayOrd[k] || 0) + 1;
    daySpend[k] = (daySpend[k] || 0) + Number(o.realizedTotal || 0);
  }

  const daily = range.map((date) => ({
    date,
    requests: dayReq[date] || 0,
    orders: dayOrd[date] || 0,
    spend: daySpend[date] || 0,
  }));

  // Status breakdown via groupBy and label resolution
  const [reqGroups, ordGroups, contractGroups, invoiceGroups, invoiceSumGroups] = await Promise.all([
    prisma.request.groupBy({ by: ["statusId"], _count: { _all: true } }),
    prisma.order.groupBy({ by: ["statusId"], _count: { _all: true } }),
    prisma.contract.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.invoice.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.invoice.groupBy({ by: ["status"], _sum: { amount: true } }),
  ]);
  const statusIds = Array.from(new Set([...reqGroups.map((g) => g.statusId), ...ordGroups.map((g) => g.statusId)]));
  const statusItems = await prisma.optionItem.findMany({ where: { id: { in: statusIds } } });
  const labelById: Record<string, string> = {};
  for (const it of statusItems) labelById[it.id] = it.label;
  const reqStatusBreakdown = reqGroups.map((g) => ({ label: labelById[g.statusId] || g.statusId, count: g._count._all }));
  const ordStatusBreakdown = ordGroups.map((g) => ({ label: labelById[g.statusId] || g.statusId, count: g._count._all }));
  const contractStatusBreakdown = contractGroups.map((g) => ({ label: g.status, count: g._count._all }));
  const invoiceStatusBreakdown = invoiceGroups.map((g) => ({ label: g.status, count: g._count._all }));
  const invoiceAmountSummary: Record<string, number> = {};
  for (const g of invoiceSumGroups) invoiceAmountSummary[g.status] = Number(g._sum.amount || 0);

  // Top units by orders in selected range
  const ordersWithUnits = await prisma.order.findMany({
    where: { createdAt: { gte: start } },
    select: { request: { select: { unitId: true } } },
  });
  const unitOrderBucket = new Map<string, number>();
  for (const o of ordersWithUnits) {
    const unitId = (o as any).request?.unitId || "-";
    unitOrderBucket.set(unitId, (unitOrderBucket.get(unitId) || 0) + 1);
  }
  const unitIds = Array.from(unitOrderBucket.keys()).filter((id) => id !== "-");
  const unitItems = await prisma.optionItem.findMany({ where: { id: { in: unitIds } } });
  const unitLabelById: Record<string, string> = { "-": "Bağlı değil" };
  for (const it of unitItems) unitLabelById[it.id] = it.label;
  const topUnitsByOrders = Array.from(unitOrderBucket.entries())
    .map(([unitId, count]) => ({ label: unitLabelById[unitId] || unitId, count }))
    .sort((a, b) => b.count - a.count);

  // Late payment alerts (overdue invoices)
  const overdueInvoicesRaw = await prisma.invoice.findMany({
    where: { dueDate: { lt: now }, status: { not: "Ödenmiş" } },
    select: { id: true, number: true, orderNo: true, amount: true, dueDate: true, status: true },
  });
  const overdueInvoices = overdueInvoicesRaw
    .filter((x: any) => x?.dueDate)
    .sort((a: any, b: any) => new Date(a.dueDate as any).getTime() - new Date(b.dueDate as any).getTime());

  // Deterministic business rules by explicit mapping
  const STATUS_RULES = {
    requests: {
      approved: ["Onaylı", "Onaylanmış"],
      pending: ["Beklemede", "Bekleyen"],
      rejected: ["Reddedildi", "Reddedilen"],
    },
    orders: {
      open: ["Açık"],
      closed: ["Kapalı", "Tamamlandı"],
    },
    contracts: {
      active: ["Aktif"],
      finished: ["Sonlanmış", "Bitmiş"],
    },
    invoices: {
      paid: ["Ödenmiş"],
      pending: ["Beklemede"],
      overdue: ["Gecikmiş"],
    },
  } as const;
  const sumByLabels = (items: { label: string; count: number }[], labels: readonly string[]) => {
    const set = new Set(labels.map((l) => l.toLowerCase()));
    return items.filter((x) => set.has(x.label.toLowerCase())).reduce((s, x) => s + x.count, 0);
  };
  const reqSummary = {
    approved: sumByLabels(reqStatusBreakdown, STATUS_RULES.requests.approved),
    pending: sumByLabels(reqStatusBreakdown, STATUS_RULES.requests.pending),
    rejected: sumByLabels(reqStatusBreakdown, STATUS_RULES.requests.rejected),
  };
  const ordSummary = {
    open: sumByLabels(ordStatusBreakdown, STATUS_RULES.orders.open),
    closed: sumByLabels(ordStatusBreakdown, STATUS_RULES.orders.closed),
  };
  const contractSummary = {
    active: sumByLabels(contractStatusBreakdown, STATUS_RULES.contracts.active),
    finished: sumByLabels(contractStatusBreakdown, STATUS_RULES.contracts.finished),
  };
  const invoiceSummary = {
    paid: sumByLabels(invoiceStatusBreakdown, STATUS_RULES.invoices.paid),
    pending: sumByLabels(invoiceStatusBreakdown, STATUS_RULES.invoices.pending),
    overdue: sumByLabels(invoiceStatusBreakdown, STATUS_RULES.invoices.overdue),
  };

  const metrics = {
    totals: {
      requests: requestsTotal,
      orders: ordersTotal,
      suppliers: suppliersTotal,
      contracts: contractsTotal,
      invoices: invoicesTotal,
    },
    kpis: [
      { name: "Onaylı Talepler", value: reqSummary.approved },
      { name: "Beklemede Talepler", value: reqSummary.pending },
      { name: "Reddedilen Talepler", value: reqSummary.rejected },
      { name: "Açık Siparişler", value: ordSummary.open },
      { name: "Kapalı Siparişler", value: ordSummary.closed },
      { name: `Toplam Harcama (${days}g)`, value: Math.round(daily.reduce((sum, d) => sum + d.spend, 0)) },
      { name: "Tedarikçi Sayısı", value: suppliersTotal },
    ],
    trends: {
      daily,
      bySource: [
        { name: "Talep", value: requestsTotal },
        { name: "Sipariş", value: ordersTotal },
        { name: "Sözleşme", value: contractsTotal },
        { name: "Tedarikçi", value: suppliersTotal },
      ],
    },
    statusBreakdown: {
      requests: reqStatusBreakdown,
      orders: ordStatusBreakdown,
      contracts: contractStatusBreakdown,
      invoices: invoiceStatusBreakdown,
    },
    statusSummary: {
      requests: reqSummary,
      orders: ordSummary,
      contracts: contractSummary,
      invoices: invoiceSummary,
    },
    invoiceAmounts: invoiceAmountSummary,
    alerts: {
      topUnitsByOrders,
      lateInvoices: {
        count: overdueInvoices.length,
        items: overdueInvoices.slice(0, 10).map((it: any) => ({
          id: String(it.id),
          number: String(it.number || ""),
          orderNo: String(it.orderNo || ""),
          amount: Number((it as any).amount || 0),
          dueDate: (it as any).dueDate ? new Date((it as any).dueDate).toISOString() : null,
          status: String((it as any).status || ""),
        })),
      },
    },
    updatedAt: now.toISOString(),
  };

  return NextResponse.json(metrics, { status: 200 });
}
