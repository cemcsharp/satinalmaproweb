"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import StatCard from "@/components/ui/StatCard";
import Button from "@/components/ui/Button";
import { useSession } from "next-auth/react";

type DashboardStats = {
  requests: number;
  orders: number;
  contracts: number;
  invoices: number;
  suppliers: number;
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string>("Kullanıcı");
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Fetch fresh username and permissions from API
  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const data = await res.json();
          setUserName(data.username || "Kullanıcı");
          setUserPermissions(data.permissions || []);
          setIsAdmin(data.role === "admin" || data.roleRef?.key === "admin");
        }
      } catch {
        setUserName(session?.user?.name || "Kullanıcı");
      }
    }
    loadProfile();
  }, [session]);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/raporlama/dashboard?days=30");
        if (res.ok) {
          const data = await res.json();
          setStats({
            requests: data.totals?.requests || 0,
            orders: data.totals?.orders || 0,
            contracts: data.totals?.contracts || 0,
            invoices: data.totals?.invoices || 0,
            suppliers: data.totals?.suppliers || 0,
          });
        }
      } catch (error) {
        console.error("Failed to load dashboard stats", error);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  // Fetch Recent Activities
  useEffect(() => {
    async function loadActivities() {
      try {
        const res = await fetch("/api/audit?limit=5");
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
  }, [userPermissions]); // Reload when permissions (and thus potential access level) change

  // Fetch Currency Rates
  const [dashboardRates, setDashboardRates] = useState<any>(null);
  useEffect(() => {
    fetch("/api/currency")
      .then(res => res.json())
      .then(data => setDashboardRates(data))
      .catch(err => console.error(err));
  }, []);

  // Quick actions with required permissions
  const allQuickActions = [
    { href: "/talep/olustur", icon: "📝", label: "Talep Oluştur", color: "from-blue-500 to-blue-600", bg: "bg-blue-50 hover:bg-blue-100", requiredPermission: "talep:create" },
    { href: "/siparis/olustur", icon: "🛒", label: "Sipariş Ver", color: "from-green-500 to-green-600", bg: "bg-green-50 hover:bg-green-100", requiredPermission: "siparis:create" },
    { href: "/sozlesme/olustur", icon: "📄", label: "Sözleşme Ekle", color: "from-purple-500 to-purple-600", bg: "bg-purple-50 hover:bg-purple-100", requiredPermission: "sozlesme:create" }, // Meeting action removed
    { href: "/fatura/olustur", icon: "💰", label: "Fatura Kaydet", color: "from-amber-500 to-amber-600", bg: "bg-amber-50 hover:bg-amber-100", requiredPermission: "fatura:create" },
    { href: "/tedarikci/olustur", icon: "🤝", label: "Tedarikçi Ekle", color: "from-cyan-500 to-cyan-600", bg: "bg-cyan-50 hover:bg-cyan-100", requiredPermission: "tedarikci:create" },
    { href: "/raporlama", icon: "📊", label: "Raporlar", color: "from-rose-500 to-rose-600", bg: "bg-rose-50 hover:bg-rose-100", requiredPermission: "rapor:read" },
  ];

  // Filter quick actions based on permissions
  const quickActions = allQuickActions.filter(action => {
    if (isAdmin) return true;
    if (!action.requiredPermission) return true;
    return userPermissions.includes(action.requiredPermission);
  });

  // Check if user can create talep (for header button)
  const canCreateTalep = isAdmin || userPermissions.includes("talep:create");

  // Time-based greeting logic
  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 6) return "İyi Geceler";
    if (hour < 11) return "Günaydın";
    if (hour < 18) return "İyi Günler";
    return "İyi Akşamlar";
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Az önce";
    if (diffMins < 60) return `${diffMins} dk önce`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} sa önce`;
    return date.toLocaleDateString("tr-TR");
  };

  const getLogColor = (action: string) => {
    switch (action) {
      case "CREATE": return "bg-green-500";
      case "UPDATE": return "bg-blue-500";
      case "DELETE": return "bg-rose-500";
      case "APPROVE": return "bg-emerald-500";
      case "REJECT": return "bg-amber-500";
      default: return "bg-slate-400";
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Modern Dark Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-xl p-8">
        {/* Background Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl translate-y-1/4 -translate-x-1/4" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-start gap-5">
            <div className="hidden md:flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 text-white shadow-lg">
              <span className="text-3xl">👋</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                <span className="text-amber-400">{getGreeting()}</span>, <span className="text-white">{userName}</span>
              </h1>
              <p className="mt-2 text-slate-300 text-lg max-w-xl leading-relaxed font-medium">
                İşlerinizi kolayca yönetmek için size özel paneli hazırladık. Bugün neler yapmak istersiniz?
              </p>

              {/* Currency Ticker */}
              <div className="mt-4 flex flex-wrap gap-2">
                {dashboardRates && (
                  <>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-slate-300 backdrop-blur-sm">
                      <span className="text-emerald-400 font-bold">USD</span>
                      <span>{Number(dashboardRates.USD).toFixed(4)}</span>
                    </div>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-slate-300 backdrop-blur-sm">
                      <span className="text-purple-400 font-bold">EUR</span>
                      <span>{Number(dashboardRates.EUR).toFixed(4)}</span>
                    </div>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-slate-300 backdrop-blur-sm">
                      <span className="text-amber-400 font-bold">GBP</span>
                      <span>{Number(dashboardRates.GBP).toFixed(4)}</span>
                    </div>
                  </>
                )}
                {!dashboardRates && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-400 animate-pulse">
                    Kurlar yükleniyor...
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Removed System Active and New Request button per user request */}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Link href="/talep/liste" className="group">
          <StatCard
            title="Toplam Talep"
            value={loading ? "-" : stats?.requests || 0}
            change={null}
            trend="up"
            variant="primary"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
          />
        </Link>

        <Link href="/siparis/liste" className="group">
          <StatCard
            title="Aktif Siparişler"
            value={loading ? "-" : stats?.orders || 0}
            change={null}
            trend="up"
            variant="success"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            }
          />
        </Link>

        <Link href="/sozlesme/liste" className="group">
          <StatCard
            title="Sözleşmeler"
            value={loading ? "-" : stats?.contracts || 0}
            change={null}
            trend="up"
            variant="info"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          />
        </Link>

        <Link href="/tedarikci/liste" className="group">
          <StatCard
            title="Tedarikçiler"
            value={loading ? "-" : stats?.suppliers || 0}
            change={null}
            trend="up"
            variant="warning"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
          />
        </Link>
      </div >

      {/* Quick Actions Grid */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 mb-6">Hızlı İşlemler</h2>
        {quickActions.length === 0 ? (
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-8 text-center">
            <p className="text-slate-500">Size atanmış izinler bulunmamaktadır. Yöneticinize başvurun.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {quickActions.map((action) => (
              <Link key={action.href} href={action.label === "Raporlar" ? "/raporlama/raporlar" : action.href} className="group">
                <div className={`
                  relative overflow-hidden
                  flex flex-col items-center justify-center
                  p-6 rounded-2xl
                  ${action.bg}
                  border border-slate-100
                  transition-all duration-300
                  hover:shadow-lg hover:shadow-slate-200/50
                  hover:-translate-y-1
                  group-active:scale-95
                `}>
                  <span className="text-3xl mb-3 group-hover:scale-110 transition-transform">{action.icon}</span>
                  <span className="text-sm font-semibold text-slate-700 text-center">{action.label}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div >

      {/* Bottom Grid */}
      < div className="grid grid-cols-1 lg:grid-cols-3 gap-6" >
        {/* Recent Activity */}
        < div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6" >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-800">Son Aktiviteler</h2>
            <Link href="/raporlama" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              Tümü →
            </Link>
          </div>
          <div className="space-y-4">
            {activitiesLoading ? (
              <div className="flex flex-col gap-3">
                {[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-100 animate-pulse rounded-xl" />)}
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-8 text-slate-400">Son aktivite bulunamadı.</div>
            ) : (
              activities.map((log) => (
                <div key={log.id} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors group">
                  <div className={`w-2 h-2 rounded-full ring-4 ring-white shrink-0 ${getLogColor(log.action)}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700 truncate">
                      {log.actionLabel} - {log.entityTypeLabel}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {log.username} tarafından gerçekleştirildi
                    </p>
                  </div>
                  <span className="text-xs text-slate-400 whitespace-nowrap">{formatTimeAgo(log.createdAt)}</span>
                </div>
              ))
            )}
          </div>
        </div >

        {/* System Status */}
        < div className="bg-white rounded-2xl border border-slate-200 p-6" >
          <h2 className="text-lg font-bold text-slate-800 mb-6">Sistem Durumu</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">Veritabanı</p>
                  <p className="text-xs text-slate-400">Bağlantı aktif</p>
                </div>
              </div>
              <span className="text-xs font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full">Çalışıyor</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">E-posta</p>
                  <p className="text-xs text-slate-400">SMTP yapılandırıldı</p>
                </div>
              </div>
              <span className="text-xs font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full">Hazır</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">Yedekleme</p>
                  <p className="text-xs text-slate-400">Son: Bugün 03:00</p>
                </div>
              </div>
              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">Güncel</span>
            </div>
          </div>
        </div >
      </div >
    </div >
  );
}
