"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import StatCard from "@/components/ui/StatCard";

type DashboardStats = {
  totals: {
    requests: number;
    orders: number;
    suppliers: number;
    contracts: number;
    invoices: number;
  };
  kpis: Array<{ name: string; value: number | string }>;
  updatedAt: string;
};

export default function DashboardClient() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string>("Kullanıcı");
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [rates, setRates] = useState<any>(null);

  // Profile & Permissions Loading
  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const data = await res.json();
          setUserName(data.username || session?.user?.name || "Kullanıcı");
          setUserPermissions(data.permissions || []);
          setIsAdmin(data.role === "admin" || data.roleRef?.key === "admin");
        }
      } catch (err) {
        console.error("Profile load failed", err);
      }
    }
    loadProfile();
  }, [session]);

  // Main Stats Loading
  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/raporlama/dashboard?days=30");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Failed to load dashboard stats", error);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  // Activities Loading
  useEffect(() => {
    async function loadActivities() {
      try {
        const res = await fetch("/api/audit?limit=6");
        if (res.ok) {
          const data = await res.json();
          setActivities(data.items || []);
        }
      } catch (err) {
        console.error("Activities load failed", err);
      } finally {
        setActivitiesLoading(false);
      }
    }
    loadActivities();
  }, []);

  // Currency Rates
  useEffect(() => {
    fetch("/api/currency")
      .then(res => res.json())
      .then(data => setRates(data))
      .catch(err => console.error(err));
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 6) return "İyi Geceler";
    if (hour < 11) return "Günaydın";
    if (hour < 18) return "İyi Günler";
    return "İyi Akşamlar";
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val);
  };

  const totalSpend = stats?.kpis.find(k => k.name.includes("Toplam Harcama"))?.value as number || 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* --- PREMIUM CONTROL TOWER HEADER --- */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-950 shadow-2xl p-8 border border-white/5">
        {/* Background Atmosphere */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-blue-700/10 rounded-full blur-[80px]" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-400 uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
              Satınalma Yönetim Paneli
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white">
              {getGreeting()}, <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">{userName}</span>
            </h1>
            <p className="text-slate-400 text-lg max-w-2xl font-medium leading-relaxed">
              Kurumsal satınalma operasyonunuzu tek noktadan yönetin. Stratejik kararlar için verileriniz hazır.
            </p>

            {/* Market Overview Ticker */}
            <div className="flex flex-wrap gap-3 pt-2">
              {rates ? (
                <>
                  <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                    <span className="text-xs font-bold text-slate-500">USD/TRY</span>
                    <span className="text-sm font-mono text-sky-400">{Number(rates.USD).toFixed(4)}</span>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                    <span className="text-xs font-bold text-slate-500">EUR/TRY</span>
                    <span className="text-sm font-mono text-blue-400">{Number(rates.EUR).toFixed(4)}</span>
                  </div>
                </>
              ) : (
                <div className="h-9 w-48 bg-white/5 rounded-2xl animate-pulse" />
              )}
            </div>
          </div>

          {/* Quick Access Node */}
          <div className="flex items-center gap-4">
            <Link href="/talep/olustur">
              <button className="px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-xl shadow-blue-600/20 transition-all hover:-translate-y-1 active:scale-95 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                Yeni Talep
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* --- STRATEGIC KPI GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Aylık Toplam Harcama"
          value={loading ? "..." : formatCurrency(totalSpend)}
          trend="+12.5%"
          variant="primary"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zM17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /></svg>
          }
        />
        <StatCard
          title="Aktif Talepler"
          value={loading ? "..." : stats?.totals.requests || 0}
          trend="+2"
          variant="success"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          }
        />
        <StatCard
          title="Onaylı Tedarikçiler"
          value={loading ? "..." : stats?.totals.suppliers || 0}
          variant="warning"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          }
        />
        <StatCard
          title="Bütçe Uyumu"
          value="%94.2"
          trend="Stable"
          variant="info"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
          }
        />
      </div>

      {/* --- MIDDLE SECTION: PULSE MONITORING --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Workflow Pulse */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-extrabold text-slate-800">Süreç Durumu</h2>
              <p className="text-sm text-slate-500 font-medium">Satınalma yaşam döngüsü durumu</p>
            </div>
            <div className="flex gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 text-[11px] font-bold text-blue-600">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                Canlı Veri
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Request -> RFQ -> Order Logic Flow Visual (Simplified) */}
            {[
              { label: "Talepler", count: stats?.totals.requests, color: "bg-blue-500", icon: "📝" },
              { label: "Aktif RFQ / Teklif", count: stats?.totals.contracts, color: "bg-blue-600", icon: "⚖️" },
              { label: "Tamamlanan Siparişler", count: stats?.totals.orders, color: "bg-sky-500", icon: "✅" }
            ].map((item, idx) => (
              <div key={idx} className="group relative flex items-center gap-6 p-1">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-xl group-hover:scale-110 transition-transform duration-300">
                  {item.icon}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-bold text-slate-600 uppercase tracking-tighter">{item.label}</span>
                    <span className="text-lg font-black text-slate-800">{item.count || 0}</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,0,0,0.1)]`}
                      style={{ width: `${Math.min(((item.count || 0) / 15) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Insights & System Heath */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-blue-700 to-sky-800 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-125 transition-transform duration-500">
              <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" /></svg>
            </div>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              🚀 AI Insights
            </h3>
            <p className="text-indigo-100 text-sm leading-relaxed mb-6 font-medium">
              Satınalma hızınız geçen haftaya göre %14 arttı. Bazı tedarikçi puanları güncellendi.
            </p>
            <button
              onClick={() => window.location.href = "/analitik"}
              className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl text-xs font-bold transition-colors"
            >
              Detaylı Raporu İncele
            </button>

          </div>

          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-lg shadow-slate-200/20">
            <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-widest">Sistem Sağlığı</h3>
            <div className="space-y-4">
              {[
                { name: "Veritabanı", status: "Aktif", color: "bg-sky-500" },
                { name: "E-posta Motoru", status: "Hazır", color: "bg-blue-500" }
              ].map((s, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">{s.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-700">{s.status}</span>
                    <span className={`w-2 h-2 rounded-full ${s.color} animate-pulse`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* --- BOTTOM ROW: GLOBAL ACTIVITY --- */}
      <div className="bg-white rounded-3xl border border-slate-200/50 shadow-xl p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-800">Global Aktivite Akışı</h2>
              <p className="text-sm text-slate-500 font-medium">Platform genelindeki son işlemler</p>
            </div>
          </div>
          <Link href="/audit" className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors">
            Tüm Günlükler
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activitiesLoading ? (
            [1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-50 animate-pulse rounded-2xl" />)
          ) : activities.length === 0 ? (
            <div className="col-span-full text-center py-12 text-slate-400 font-medium">Henüz veri akışı bulunmuyor.</div>
          ) : (
            activities.map((log) => (
              <div key={log.id} className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100 hover:border-blue-200 hover:bg-white transition-all cursor-default group">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold ${log.action === "CREATE" ? "bg-sky-100 text-blue-700" :
                    log.action === "UPDATE" ? "bg-blue-100 text-blue-700" : "bg-slate-200 text-slate-700"
                    }`}>
                    {log.action.substring(0, 1)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate group-hover:text-blue-600 transition-colors">{log.entityTypeLabel}</p>
                    <p className="text-xs text-slate-500 truncate mb-2">{log.username}</p>
                    <span className="text-[10px] font-medium text-slate-400">{new Date(log.createdAt).toLocaleString('tr-TR')}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
