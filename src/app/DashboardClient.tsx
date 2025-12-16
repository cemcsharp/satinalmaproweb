"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";

interface HomepageData {
  user: {
    id: string;
    username: string;
    role: string;
    roleName: string;
    unit?: string;
  };
  pendingApprovals: any[];
  myRequests: any[];
  myOrders: any[];
  recentActivity: any[];
  stats: Record<string, number>;
  criticalAlerts?: any[];
  upcomingDeliveries?: any[];
  importantDates?: any[];
  overdueApprovals?: any[];
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<HomepageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currencyRates, setCurrencyRates] = useState<any>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetch("/api/homepage")
      .then(r => r.ok ? r.json() : null)
      .then(d => setData(d))
      .catch(() => { })
      .finally(() => setLoading(false));

    // Currency rates
    fetch("/api/currency")
      .then(r => r.ok ? r.json() : null)
      .then(d => setCurrencyRates(d))
      .catch(() => { });
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 6) return "İyi Geceler";
    if (hour < 11) return "Günaydın";
    if (hour < 18) return "İyi Günler";
    return "İyi Akşamlar";
  };

  const getRoleActions = () => {
    if (!data) return [];
    const role = data.user.role;

    if (role === "admin") {
      return [
        { label: "Yeni Talep", href: "/talep/olustur", icon: "📝", color: "bg-blue-50 text-blue-700" },
        { label: "Siparişler", href: "/siparis/liste", icon: "📦", color: "bg-green-50 text-green-700" },
        { label: "Tedarikçiler", href: "/tedarikci/liste", icon: "🤝", color: "bg-purple-50 text-purple-700" },
        { label: "Raporlar", href: "/raporlama/raporlar", icon: "📊", color: "bg-amber-50 text-amber-700" },
      ];
    } else if (["satinalma_muduru", "satinalma_personeli"].includes(role)) {
      return [
        { label: "Talep Havuzu", href: "/talep/liste", icon: "📋", color: "bg-blue-50 text-blue-700" },
        { label: "Sipariş Oluştur", href: "/siparis/olustur", icon: "🛒", color: "bg-green-50 text-green-700" },
        { label: "Tedarikçiler", href: "/tedarikci/liste", icon: "🤝", color: "bg-purple-50 text-purple-700" },
        { label: "Teklif Topla", href: "/rfq/liste", icon: "📨", color: "bg-cyan-50 text-cyan-700" },
      ];
    } else if (role === "birim_muduru") {
      return [
        { label: "Bekleyen Onaylar", href: "/talep/liste", icon: "⏳", color: "bg-amber-50 text-amber-700" },
        { label: "Birim Talepleri", href: "/talep/liste", icon: "📋", color: "bg-blue-50 text-blue-700" },
        { label: "Yeni Talep", href: "/talep/olustur", icon: "📝", color: "bg-green-50 text-green-700" },
      ];
    } else if (role === "genel_mudur") {
      return [
        { label: "Bekleyen Onaylar", href: "/talep/liste", icon: "⏳", color: "bg-amber-50 text-amber-700" },
        { label: "Raporlar", href: "/raporlama/raporlar", icon: "📊", color: "bg-purple-50 text-purple-700" },
      ];
    } else {
      return [
        { label: "Yeni Talep", href: "/talep/olustur", icon: "📝", color: "bg-blue-50 text-blue-700" },
        { label: "Taleplerim", href: "/talep/liste", icon: "📋", color: "bg-green-50 text-green-700" },
      ];
    }
  };

  const getStatLabel = (key: string) => {
    const labels: Record<string, string> = {
      totalRequests: "Toplam Talep",
      totalOrders: "Toplam Sipariş",
      pendingApprovals: "Bekleyen Onay",
      activeSuppliers: "Aktif Tedarikçi",
      poolRequests: "Havuzdaki Talep",
      myOrders: "Siparişlerim",
      pendingDeliveries: "Bekleyen Teslimat",
      unitRequests: "Birim Talepleri",
      myRequests: "Taleplerim",
      approvedRequests: "Onaylanan",
      totalBudget: "Toplam Bütçe"
    };
    return labels[key] || key;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton height={120} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} height={80} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton height={300} />
          <Skeleton height={300} />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <Card className="p-8 text-center">
        <p className="text-slate-500">Veriler yüklenemedi</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center text-2xl">
              👋
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                <span className="text-amber-400">{getGreeting()}</span>, {data.user.username}
              </h1>
              <p className="text-slate-300 text-sm mt-1">
                {data.user.roleName} {data.user.unit && `• ${data.user.unit}`}
              </p>
            </div>
          </div>
        </div>

        {/* Currency Ticker */}
        {currencyRates && (
          <div className="mt-4 flex flex-wrap gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-slate-300 backdrop-blur-sm">
              <span className="text-emerald-400 font-bold">USD</span>
              <span>{Number(currencyRates.USD).toFixed(4)}</span>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-slate-300 backdrop-blur-sm">
              <span className="text-purple-400 font-bold">EUR</span>
              <span>{Number(currencyRates.EUR).toFixed(4)}</span>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-slate-300 backdrop-blur-sm">
              <span className="text-amber-400 font-bold">GBP</span>
              <span>{Number(currencyRates.GBP).toFixed(4)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      {Object.keys(data.stats).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(data.stats).map(([key, value], index) => {
            const colors = [
              "bg-blue-50 border-blue-200",
              "bg-green-50 border-green-200",
              "bg-purple-50 border-purple-200",
              "bg-amber-50 border-amber-200"
            ];
            const textColors = ["text-blue-700", "text-green-700", "text-purple-700", "text-amber-700"];
            return (
              <div key={key} className={`p-4 rounded-xl border ${colors[index % 4]}`}>
                <div className={`text-2xl font-bold ${textColors[index % 4]}`}>{value}</div>
                <div className="text-xs text-slate-600 mt-1">{getStatLabel(key)}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        {getRoleActions().map((action) => (
          <Link key={action.href + action.label} href={action.href}>
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl ${action.color} font-medium text-sm hover:shadow-md transition-shadow cursor-pointer`}>
              <span>{action.icon}</span>
              {action.label}
            </div>
          </Link>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Approvals */}
        {data.pendingApprovals.length > 0 && (
          <Card className="p-0">
            <div className="p-5 border-b border-slate-100 flex items-center gap-2">
              <h3 className="text-base font-semibold text-slate-800">⏳ Bekleyen Onaylarım</h3>
              <Badge variant="warning">{data.pendingApprovals.length}</Badge>
            </div>
            <ul className="divide-y">
              {data.pendingApprovals.map((item) => (
                <li
                  key={item.id}
                  className="px-5 py-3 hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => router.push(`/talep/detay/${item.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-slate-800">{item.barcode}</span>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{item.subject}</p>
                    </div>
                    <Badge variant="info" className="text-xs">{item.status}</Badge>
                  </div>
                </li>
              ))}
            </ul>
            <div className="px-5 py-3 border-t bg-slate-50">
              <Button variant="outline" size="sm" className="w-full" onClick={() => router.push("/talep/liste")}>
                Tümünü Gör
              </Button>
            </div>
          </Card>
        )}

        {/* My Requests */}
        <Card className="p-0">
          <div className="p-5 border-b border-slate-100 flex items-center gap-2">
            <h3 className="text-base font-semibold text-slate-800">📋 Taleplerim</h3>
            <Badge variant="default">{data.myRequests.length}</Badge>
          </div>
          {data.myRequests.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-sm">
              Henüz talebiniz yok
            </div>
          ) : (
            <>
              <ul className="divide-y">
                {data.myRequests.map((item) => (
                  <li
                    key={item.id}
                    className="px-5 py-3 hover:bg-slate-50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/talep/detay/${item.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-slate-800">{item.barcode}</span>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{item.subject}</p>
                      </div>
                      <Badge variant={item.status?.includes("Onay") ? "success" : "default"} className="text-xs">
                        {item.status}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="px-5 py-3 border-t bg-slate-50">
                <Button variant="outline" size="sm" className="w-full" onClick={() => router.push("/talep/liste")}>
                  Tümünü Gör
                </Button>
              </div>
            </>
          )}
        </Card>

        {/* My Orders (for satinalma) */}
        {data.myOrders.length > 0 && (
          <Card className="p-0">
            <div className="p-5 border-b border-slate-100 flex items-center gap-2">
              <h3 className="text-base font-semibold text-slate-800">📦 Siparişlerim</h3>
              <Badge variant="success">{data.myOrders.length}</Badge>
            </div>
            <ul className="divide-y">
              {data.myOrders.map((item) => (
                <li
                  key={item.id}
                  className="px-5 py-3 hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => router.push(`/siparis/detay/${item.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-slate-800">{item.orderNumber}</span>
                      <p className="text-xs text-slate-500 mt-0.5">{item.supplier}</p>
                    </div>
                    <Badge variant="info" className="text-xs">{item.status}</Badge>
                  </div>
                </li>
              ))}
            </ul>
            <div className="px-5 py-3 border-t bg-slate-50">
              <Button variant="outline" size="sm" className="w-full" onClick={() => router.push("/siparis/liste")}>
                Tümünü Gör
              </Button>
            </div>
          </Card>
        )}

        {/* Recent Activity */}
        <Card title="🕐 Son Aktiviteler" className="p-0">
          {data.recentActivity.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-sm">
              Henüz aktivite yok
            </div>
          ) : (
            <ul className="divide-y max-h-80 overflow-y-auto">
              {data.recentActivity.map((item) => (
                <li key={item.id} className="px-5 py-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700 line-clamp-2">{item.text}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                        <span>{item.request}</span>
                        <span>•</span>
                        <span>{new Date(item.date).toLocaleDateString("tr-TR")}</span>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* SLA Widget: Overdue Approvals */}
      {data.overdueApprovals && data.overdueApprovals.length > 0 && (
        <Card className="border-red-200 bg-red-50 p-0">
          <div className="p-5 border-b border-red-100 flex items-center gap-2">
            <span className="text-xl">🚨</span>
            <h3 className="font-bold text-red-800">Geciken Onaylar (SLA Aşımı)</h3>
            <Badge variant="error">{data.overdueApprovals?.length}</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-red-700 bg-red-100 uppercase">
                <tr>
                  <th className="px-6 py-3">Barkod</th>
                  <th className="px-6 py-3">Konu</th>
                  <th className="px-6 py-3">Talep Eden</th>
                  <th className="px-6 py-3">Son İşlem</th>
                  <th className="px-6 py-3">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-200">
                {data.overdueApprovals.map((item) => (
                  <tr key={item.id} className="bg-red-50 hover:bg-red-100 cursor-pointer transition-colors" onClick={() => router.push(`/talep/detay/${item.id}`)}>
                    <td className="px-6 py-4 font-medium text-red-900">{item.barcode}</td>
                    <td className="px-6 py-4 text-red-800">{item.subject}</td>
                    <td className="px-6 py-4 text-red-800">{item.owner}</td>
                    <td className="px-6 py-4 text-red-800">{new Date(item.deadline).toLocaleDateString("tr-TR")}</td>
                    <td className="px-6 py-4">
                      <Badge variant="error">{item.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Critical Alerts */}
      {data.criticalAlerts && data.criticalAlerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-red-800 mb-3 flex items-center gap-2">
            ⚠️ Kritik Uyarılar
          </h3>
          <div className="space-y-2">
            {data.criticalAlerts.map((alert, i) => (
              <div
                key={i}
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${alert.type === "danger" ? "bg-red-100 hover:bg-red-200" : "bg-amber-100 hover:bg-amber-200"
                  }`}
                onClick={() => router.push(alert.link)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{alert.icon}</span>
                  <div>
                    <div className={`text-sm font-medium ${alert.type === "danger" ? "text-red-800" : "text-amber-800"}`}>
                      {alert.title}
                    </div>
                    <div className="text-xs text-slate-600">{alert.message}</div>
                  </div>
                </div>
                <div className="text-xs text-slate-500">
                  {alert.date && new Date(alert.date).toLocaleDateString("tr-TR")}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Grid: Deliveries & Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Deliveries */}
        {data.upcomingDeliveries && data.upcomingDeliveries.length > 0 && (
          <Card title="📦 Yaklaşan Teslimatlar" className="p-0">
            <ul className="divide-y">
              {data.upcomingDeliveries.map((d) => (
                <li
                  key={d.id}
                  className="px-5 py-3 hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => router.push(`/siparis/detay/${d.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-slate-800">{d.orderNumber}</span>
                      <p className="text-xs text-slate-500 mt-0.5">{d.supplier}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-blue-600">
                        {new Date(d.date).toLocaleDateString("tr-TR")}
                      </div>
                      <Badge variant="info" className="text-xs">{d.status}</Badge>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* Important Dates Calendar */}
        {data.importantDates && data.importantDates.length > 0 && (
          <Card title="📅 Önemli Tarihler" className="p-0">
            <ul className="divide-y">
              {data.importantDates.slice(0, 8).map((d, i) => (
                <li
                  key={i}
                  className="px-5 py-3 hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => d.link && router.push(d.link)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${d.type === "contract" ? "bg-purple-100" : "bg-blue-100"
                      }`}>
                      {d.icon}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-800">{d.title}</div>
                      <div className="text-xs text-slate-500">{d.description}</div>
                    </div>
                    <div className="text-sm font-medium text-slate-600">
                      {d.date && new Date(d.date).toLocaleDateString("tr-TR")}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </div>
  );
}
