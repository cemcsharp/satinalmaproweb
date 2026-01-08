"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import StatCard from "@/components/ui/StatCard";

export default function PortalDashboard() {
    const { data: session } = useSession();
    const [currentTime, setCurrentTime] = useState<Date>(new Date());
    const [dashboardRates, setDashboardRates] = useState<any>(null);

    const [dashboardData, setDashboardData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Fetch Dashboard Data
    useEffect(() => {
        async function loadDashboard() {
            try {
                const res = await fetch("/api/portal/dashboard");
                if (res.ok) {
                    const data = await res.json();
                    setDashboardData(data);
                }
            } catch (err) {
                console.error("Dashboard load failed", err);
            } finally {
                setLoading(false);
            }
        }
        loadDashboard();
    }, []);

    // Update time every minute
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    // Fetch Currency Rates
    useEffect(() => {
        fetch("/api/currency")
            .then(res => res.json())
            .then(data => setDashboardRates(data))
            .catch(err => console.error(err));
    }, []);

    // Time-based greeting logic (Identical to DashboardClient)
    const getGreeting = () => {
        const hour = currentTime.getHours();
        if (hour < 6) return "İyi Geceler";
        if (hour < 11) return "Günaydın";
        if (hour < 18) return "İyi Günler";
        return "İyi Akşamlar";
    };

    const userName = session?.user?.name || "Değerli Tedarikçimiz";

    const getLogColor = (stage: string) => {
        switch (stage) {
            case "OFFERED": return "bg-green-500";
            case "SENT": return "bg-blue-500";
            case "VIEWED": return "bg-amber-500";
            case "DECLINED": return "bg-rose-500";
            default: return "bg-slate-400";
        }
    };

    const getLogAction = (stage: string) => {
        switch (stage) {
            case "OFFERED": return "Teklif Gönderildi";
            case "SENT": return "Yeni RFQ Atandı";
            case "VIEWED": return "RFQ İncelendi";
            case "DECLINED": return "Teklif Reddedildi";
            default: return "İşlem Kaydedildi";
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Modern Dark Header (Identical Styling to Main Dashboard) */}
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
                                Tedarikçi portalına hoş geldiniz. Kurumumuz ile olan tüm süreçlerinizi, tekliflerinizi ve siparişlerinizi buradan kolayca yönetebilirsiniz.
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
                </div>
            </div>

            {/* Stats Grid (Identical to Main App Dashboard) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <Link href="/portal/rfq" className="group">
                    <StatCard
                        title="Açık Talepler"
                        value={loading ? "-" : dashboardData?.totals?.rfqs || 0}
                        trend="up"
                        variant="primary"
                        icon={
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        }
                    />
                </Link>

                <Link href="/portal/orders" className="group">
                    <StatCard
                        title="Aktif Siparişler"
                        value={loading ? "-" : dashboardData?.totals?.orders || 0}
                        trend="up"
                        variant="success"
                        icon={
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                        }
                    />
                </Link>

                <Link href="/portal/contracts" className="group">
                    <StatCard
                        title="Sözleşmeler"
                        value={loading ? "-" : dashboardData?.totals?.contracts || 0}
                        trend="up"
                        variant="info"
                        icon={
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        }
                    />
                </Link>

                <Link href="/portal/rfq/history" className="group">
                    <StatCard
                        title="Teklif Geçmişi"
                        value={loading ? "-" : dashboardData?.totals?.offers || 0}
                        trend="up"
                        variant="warning"
                        icon={
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        }
                    />
                </Link>
            </div>

            {/* Quick Actions Grid (Identical Styling to Main App Dashboard) */}
            <div>
                <h2 className="text-xl font-bold text-slate-800 mb-6">Hızlı İşlemler</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {[
                        { href: "/portal/rfq", icon: "📝", label: "Teklif Ver", bg: "bg-blue-50 hover:bg-blue-100" },
                        { href: "/portal/rfq", icon: "📊", label: "Süreç Takibi", bg: "bg-green-50 hover:bg-green-100" },
                        { href: "/portal/rfq", icon: "📄", label: "Gelen RFQ'lar", bg: "bg-purple-50 hover:bg-purple-100" },
                        { href: "/portal/orders", icon: "🛒", label: "Siparişlerim", bg: "bg-amber-50 hover:bg-amber-100" },
                        { href: "/portal/profile", icon: "👤", label: "Hesap Bilgileri", bg: "bg-cyan-50 hover:bg-cyan-100" },
                        { href: "/portal/support", icon: "🎧", label: "Destek", bg: "bg-rose-50 hover:bg-rose-100" },
                    ].map((action) => (
                        <Link key={action.label} href={action.href} className="group">
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
            </div>

            {/* Bottom Grid (Identical Styling to Main Dashboard) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Activity Card */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-slate-800">Son İşlemler</h2>
                        <Link href="/portal/rfq" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                            Tümü →
                        </Link>
                    </div>
                    <div className="space-y-4">
                        {loading ? (
                            <div className="flex flex-col gap-3">
                                {[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-100 animate-pulse rounded-xl" />)}
                            </div>
                        ) : !dashboardData?.items?.length ? (
                            <div className="text-center py-8 text-slate-400 italic">Son işlem bulunamadı.</div>
                        ) : (
                            dashboardData.items.map((item: any) => (
                                <div key={item.participationId} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors group">
                                    <div className={`w-2 h-2 rounded-full ring-4 ring-white shrink-0 ${getLogColor(item.stage)}`} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-slate-700 truncate">
                                            {getLogAction(item.stage)} - {item.rfxCode}
                                        </p>
                                        <p className="text-xs text-slate-500 truncate">
                                            {item.title}
                                        </p>
                                    </div>
                                    <span className="text-xs text-slate-400 whitespace-nowrap">
                                        {item.offerDetails ? "Fiyat verildi" : "İşlem bekliyor"}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* System Status Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                    <h2 className="text-lg font-bold text-slate-800 mb-6">Portal Durumu</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                                    <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-700">Bağlantı</p>
                                    <p className="text-xs text-slate-400">Güvenli SSL aktif</p>
                                </div>
                            </div>
                            <span className="text-xs font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full">Güvenli</span>
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
                                    <p className="text-xs text-slate-400">Bildirimler açık</p>
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
                                    <p className="text-sm font-medium text-slate-700">Sertifika</p>
                                    <p className="text-xs text-slate-400">Tedarikçi yetkisi aktif</p>
                                </div>
                            </div>
                            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">Güncel</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
