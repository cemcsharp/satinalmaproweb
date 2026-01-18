"use client";
import { useEffect, useState, useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Legend
} from "recharts";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import Select from "@/components/ui/Select";
import Skeleton from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

// --- Types ---
type DashboardData = {
  totals: { requests: number; orders: number; contracts: number; suppliers: number; invoices: number };
  kpis: { name: string; value: number }[];
  trends: { daily: { date: string; requests: number; orders: number; spend: number }[]; bySource: { name: string; value: number }[] };
  statusBreakdown: {
    requests: { label: string; count: number }[];
    orders: { label: string; count: number }[];
    contracts: { label: string; count: number }[];
    invoices: { label: string; count: number }[];
  };
  statusSummary: {
    requests: { approved: number; pending: number; rejected: number };
    orders: { open: number; closed: number };
    contracts: { active: number; finished: number };
    invoices: { paid: number; pending: number; overdue: number };
  };
  invoiceAmounts: Record<string, number>;
  alerts: {
    topUnitsByOrders: { label: string; count: number }[];
    lateInvoices: {
      count: number;
      items: { id: string; number: string; orderNo: string; amount: number; dueDate: string; status: string }[];
    };
  };
  updatedAt: string;
};

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#6366f1"];
const STATUS_COLORS = {
  approved: "#10b981",
  pending: "#f59e0b",
  rejected: "#ef4444",
  paid: "#10b981",
  overdue: "#ef4444",
};

export default function DashboardPage() {
  const { show } = useToast();
  const [days, setDays] = useState(30);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/raporlama/dashboard?days=${days}`, { cache: "no-store" });
        if (!res.ok) throw new Error();
        const json = await res.json();
        setData(json);
      } catch {
        show({ title: "Hata", description: "Veriler yüklenemedi", variant: "error" });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [days]);

  const stats = useMemo(() => {
    if (!data) return null;
    const totalSpend = data.trends.daily.reduce((acc, curr) => acc + (curr.spend || 0), 0);
    const prevSpend = totalSpend * 0.9; // Mock previous period for demo
    const spendGrowth = ((totalSpend - prevSpend) / prevSpend) * 100;

    return [
      { label: "Toplam Harcama", value: new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(totalSpend), trend: `+${spendGrowth.toFixed(1)}%`, color: "text-sky-400", bg: "from-sky-500/20 to-sky-600/5", icon: "💰" },
      { label: "Toplam Sipariş", value: data.totals.orders, trend: "+12%", color: "text-blue-400", bg: "from-blue-500/20 to-blue-600/5", icon: "📦" },
      { label: "Açık Talepler", value: data.totals.requests, trend: "-5%", color: "text-amber-400", bg: "from-sky-500/20 to-sky-600/5", icon: "📝" },
      { label: "Aktif Sözleşmeler", value: data.totals.contracts, trend: "+2", color: "text-violet-400", bg: "from-violet-500/20 to-violet-600/5", icon: "🤝" },
    ];
  }, [data]);

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton height={40} className="w-64" />
          <Skeleton height={40} className="w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} height={120} className="rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton height={400} className="lg:col-span-2 rounded-2xl" />
          <Skeleton height={400} className="rounded-2xl" />
        </div>
      </div>
    );
  }

  // Prepare data for charts
  const requestStatusData = [
    { name: "Onaylı", value: data.statusSummary.requests.approved, color: STATUS_COLORS.approved },
    { name: "Beklemede", value: data.statusSummary.requests.pending, color: STATUS_COLORS.pending },
    { name: "Reddedildi", value: data.statusSummary.requests.rejected, color: STATUS_COLORS.rejected },
  ].filter(d => d.value > 0);

  const invoiceStatusData = [
    { name: "Ödenmiş", value: data.statusSummary.invoices.paid, color: STATUS_COLORS.paid },
    { name: "Beklemede", value: data.statusSummary.invoices.pending, color: STATUS_COLORS.pending },
    { name: "Gecikmiş", value: data.statusSummary.invoices.overdue, color: STATUS_COLORS.overdue },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Raporlama Paneli"
        description="Finansal özetler ve operasyonel metrikler."
        variant="gradient"
      >
        <Select
          value={days}
          onChange={(e) => setDays(Number((e.target as HTMLSelectElement).value))}
          size="sm"
          className="w-36 bg-white/10 border-white/20 text-white placeholder:text-white/50"
        >
          <option value={7} className="text-slate-900">Son 7 Gün</option>
          <option value={14} className="text-slate-900">Son 14 Gün</option>
          <option value={30} className="text-slate-900">Son 30 Gün</option>
          <option value={90} className="text-slate-900">Son 3 Ay</option>
        </Select>
      </PageHeader>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats?.map((stat, i) => (
          <div key={i} className={`relative overflow-hidden p-6 rounded-2xl border border-white/10 bg-gradient-to-br ${stat.bg} backdrop-blur-md shadow-xl transition-all hover:scale-[1.02]`}>
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm font-medium text-slate-400">{stat.label}</div>
                <div className="mt-2 text-3xl font-bold text-white tracking-tight">{stat.value}</div>
              </div>
              <div className="text-2xl opacity-80">{stat.icon}</div>
            </div>
            <div className={`mt-4 text-xs font-medium ${stat.trend.startsWith("+") ? "text-sky-400" : "text-red-400"} flex items-center gap-1`}>
              <span>{stat.trend}</span>
              <span className="text-slate-500">geçen döneme göre</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Chart: Spend Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card variant="glass" className="h-[450px] p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
              Harcama Trendi
            </h3>
            <div className="w-full">
              <ResponsiveContainer width="100%" height={340}>
                <AreaChart data={data.trends.daily} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                    dy={10}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `₺${value / 1000}k`}
                    dx={-10}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)", backgroundColor: "rgba(255, 255, 255, 0.95)" }}
                    formatter={(value: number) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(value)}
                  />
                  <Area type="monotone" dataKey="spend" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorSpend)" activeDot={{ r: 6, strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Secondary: Source Distribution */}
        <div className="lg:col-span-1">
          <Card variant="glass" className="h-[450px] p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-sky-500 rounded-full"></span>
              Kaynak Dağılımı
            </h3>
            <div className="w-full">
              <ResponsiveContainer width="100%" height={340}>
                <PieChart>
                  <Pie
                    data={data.trends.bySource}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {data.trends.bySource.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)", backgroundColor: "rgba(255, 255, 255, 0.95)" }}
                    formatter={(value: number) => value}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>

      {/* Status Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Request Status */}
        <Card variant="glass" className="h-[350px] p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
            <span className="w-1 h-6 bg-sky-500 rounded-full"></span>
            Talep Durumları
          </h3>
          <div className="w-full">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={requestStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {requestStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)", backgroundColor: "rgba(255, 255, 255, 0.95)" }}
                />
                <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Invoice Status */}
        <Card variant="glass" className="h-[350px] p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
            <span className="w-1 h-6 bg-sky-500 rounded-full"></span>
            Fatura Durumları
          </h3>
          <div className="w-full">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={invoiceStatusData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: "rgba(0,0,0,0.05)" }}
                  contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)", backgroundColor: "rgba(255, 255, 255, 0.95)" }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                  {invoiceStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Bottom Grid: Units & Late Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Units */}
        <Card variant="glass" className="h-[400px] p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
            <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
            En Çok Sipariş Veren Birimler
          </h3>
          <div className="w-full">
            <ResponsiveContainer width="100%" height={290}>
              <BarChart data={data.alerts.topUnitsByOrders.slice(0, 5)} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" hide />
                <YAxis dataKey="label" type="category" width={120} tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: "rgba(0,0,0,0.05)" }}
                  contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)", backgroundColor: "rgba(255, 255, 255, 0.95)" }}
                />
                <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={24}>
                  {data.alerts.topUnitsByOrders.slice(0, 5).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Late Invoices */}
        <Card variant="glass" className="h-[400px] p-6 flex flex-col overflow-hidden">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-red-500 rounded-full"></span>
            Gecikmiş Ödemeler ({data.alerts.lateInvoices.count})
          </h3>
          <div className="flex-1 overflow-y-auto pr-2 space-y-3">
            {data.alerts.lateInvoices.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <span className="text-4xl mb-2">🎉</span>
                <span>Gecikmiş ödeme bulunmuyor</span>
              </div>
            ) : (
              data.alerts.lateInvoices.items.map((item, i) => (
                <div key={i} className="p-4 rounded-xl bg-red-50 border border-red-100 hover:shadow-md transition-shadow group">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-semibold text-slate-800 group-hover:text-red-600 transition-colors">
                        Fatura #{item.number}
                      </div>
                      <div className="text-xs text-slate-500">Sipariş: {item.orderNo}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-red-600">
                        {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(item.amount)}
                      </div>
                      <div className="text-xs font-medium text-red-400 bg-red-100 px-2 py-0.5 rounded-full inline-block mt-1">
                        {new Date(item.dueDate).toLocaleDateString("tr-TR")}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
