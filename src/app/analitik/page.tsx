"use client";
import React, { useEffect, useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import Skeleton from "@/components/ui/Skeleton";
import {
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, PieChart, Pie, Cell, Legend
} from "recharts";

const MONTHS = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function AnalitikPage() {
    const [data, setData] = useState<any>(null);
    const [segmentStats, setSegmentStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [forecastQuery, setForecastQuery] = useState("");
    const [forecastResult, setForecastResult] = useState<any>(null);
    const [searchingForecast, setSearchingForecast] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [pivotRes, segmentRes] = await Promise.all([
                    fetch("/api/raporlama/pivot"),
                    fetch("/api/tedarikci/segmentasyon")
                ]);

                const pivotData = pivotRes.ok ? await pivotRes.json() : null;
                const segmentData = segmentRes.ok ? await segmentRes.json() : null;

                // Set data with defaults to prevent crashes
                setData(pivotData || {
                    monthlyTrend: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                    departmentSpend: [],
                    savings: { totalValue: 0, count: 0 },
                    categorySpend: []
                });
                setSegmentStats(segmentData?.stats || { GOLD: 0, SILVER: 0, BRONZE: 0 });
            } catch (e) {
                console.error("Dashboard loading error:", e);
                // Set defaults on error to prevent crash
                setData({
                    monthlyTrend: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                    departmentSpend: [],
                    savings: { totalValue: 0, count: 0 },
                    categorySpend: []
                });
                setSegmentStats({ GOLD: 0, SILVER: 0, BRONZE: 0 });
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const handleForecastSearch = () => {
        if (!forecastQuery) return;
        setSearchingForecast(true);
        fetch(`/api/ai/forecast?name=${encodeURIComponent(forecastQuery)}`)
            .then(res => res.json())
            .then(d => setForecastResult(d))
            .catch(e => console.error(e))
            .finally(() => setSearchingForecast(false));
    };

    if (loading || !data) return <div className="p-10"><Skeleton height={600} /></div>;

    const trendData = (data.monthlyTrend || []).map((val: number, i: number) => ({ name: MONTHS[i], value: val || 0 }));
    const deptData = (data.departmentSpend || []).map((d: any, i: number) => ({
        name: d.departmentId || `Birim ${i + 1}`,
        value: Number(d._sum?.realizedTotal || 0)
    }));

    const segmentData = segmentStats ? [
        { name: "Gold", value: segmentStats.GOLD || 0, color: "#fbbf24" },
        { name: "Silver", value: segmentStats.SILVER || 0, color: "#94a3b8" },
        { name: "Bronze", value: segmentStats.BRONZE || 0, color: "#b45309" }
    ] : [];


    return (
        <section className="space-y-6 max-w-7xl mx-auto pb-10">
            <PageHeader
                title="Analitik Kontrol Kulesi"
                description="Harcama trendleri, tasarruf oranları ve operasyonel verimlilik analizleri."
            />

            {/* Key Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4 bg-blue-700 text-white border-none shadow-indigo-200 shadow-xl">
                    <div className="text-[10px] font-bold opacity-70 uppercase tracking-widest mb-1">Yıllık Toplam Harcama</div>
                    <div className="text-2xl font-black tracking-tighter">
                        {data.monthlyTrend.reduce((a: number, b: number) => a + b, 0).toLocaleString("tr-TR")} TL
                    </div>
                </Card>
                <Card className="p-4 bg-sky-600 text-white border-none shadow-sky-200 shadow-xl">
                    <div className="text-[10px] font-bold opacity-70 uppercase tracking-widest mb-1">Toplam Tasarruf (RFQ)</div>
                    <div className="text-2xl font-black tracking-tighter">
                        {data.savings.totalValue.toLocaleString("tr-TR")} TL
                    </div>
                </Card>
                <Card className="p-4 bg-white border-slate-100 flex items-center gap-4">
                    <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center text-blue-600">
                        <Icon name="activity" className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-xl font-bold text-slate-800">8.4 Gün</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Ort. Teslim Süresi</div>
                    </div>
                </Card>
                <Card className="p-4 bg-white border-slate-100 flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                        <Icon name="shield-check" className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-xl font-bold text-slate-800">%94.2</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Kalite Uyumu</div>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Spending Trend */}
                <Card title="Harcama Trendi (Aylık)" className="lg:col-span-2 p-4 h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trendData}>
                            <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                formatter={(value: number) => [`${value.toLocaleString("tr-TR")} TL`, "Harcama"]}
                            />
                            <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </Card>

                {/* Supplier Segments */}
                <Card title="Tedarikçi Segmentasyonu" className="p-4 h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={segmentData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {segmentData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                    </ResponsiveContainer>
                </Card>

                {/* AI Price Forecast Tool */}
                <Card title="AI Fiyat Tahmini" className="p-6 overflow-hidden">
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={forecastQuery}
                                onChange={e => setForecastQuery(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleForecastSearch()}
                                placeholder="Ürün adı veya SKU..."
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                            />
                            <button
                                onClick={handleForecastSearch}
                                disabled={searchingForecast}
                                className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 transition-all disabled:opacity-50"
                            >
                                {searchingForecast ? "Analiz..." : "Tahmin Et"}
                            </button>
                        </div>

                        {forecastResult && forecastResult.hasData ? (
                            <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100 animate-in slide-in-from-top-2">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="text-xs font-bold text-blue-600 uppercase tracking-wider truncate mr-2">{forecastResult.name}</div>
                                    <div className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-bold ${forecastResult.trend === "UP" ? 'bg-red-100 text-red-600' : 'bg-sky-100 text-blue-600'}`}>
                                        {forecastResult.trend === "UP" ? '▲ ARTIŞ' : '▼ DÜŞÜŞ'}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase">Güncel</div>
                                        <div className="text-lg font-black text-slate-700">{forecastResult.currentPrice} TL</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase">3 Ay Sonra</div>
                                        <div className="text-lg font-black text-blue-600">{forecastResult.predictedPrice} TL</div>
                                    </div>
                                </div>
                                <div className="mt-3 text-[11px] text-blue-800 italic leading-relaxed font-medium">
                                    💡 {forecastResult.recommendation}
                                </div>
                            </div>
                        ) : forecastResult && (
                            <div className="text-center py-4 text-xs text-slate-400 italic font-medium">Analiz için yetersiz geçmiş veri bulunamadı.</div>
                        )}
                    </div>
                </Card>

                {/* Analysis Matrix */}
                <Card title="Stratejik Verimlilik Matrisi" className="lg:col-span-2 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="space-y-2">
                            <div className="flex justify-between items-baseline">
                                <span className="text-sm font-medium text-slate-500">RFQ Başarı Oranı</span>
                                <span className="text-lg font-bold text-indigo-600">%82</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div className="bg-blue-600 h-full w-[82%] rounded-full" />
                            </div>
                            <p className="text-[11px] text-slate-400 italic">Tekliflerin siparişe dönüşme oranı.</p>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-baseline">
                                <span className="text-sm font-medium text-slate-500">Bütçe Verimliliği</span>
                                <span className="text-lg font-bold text-blue-600">%12.4 Tasarruf</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div className="bg-sky-500 h-full w-[65%] rounded-full" />
                            </div>
                            <p className="text-[11px] text-slate-400 italic">Planlanan vs. Gerçekleşen farkı.</p>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-baseline">
                                <span className="text-sm font-medium text-slate-500">Operasyonel Hız</span>
                                <span className="text-lg font-bold text-blue-600">4.2 Saat</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div className="bg-sky-500 h-full w-[90%] rounded-full" />
                            </div>
                            <p className="text-[11px] text-slate-400 italic">Ortalama onay süresi.</p>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 flex gap-6 items-center shadow-lg shadow-blue-500/5">
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-500/30">
                    <Icon name="sparkles" className="w-8 h-8" />
                </div>
                <div>
                    <h4 className="text-blue-900 font-bold text-lg mb-1">AI Strateji Önerisi</h4>
                    <p className="text-blue-800 text-sm opacity-80 leading-relaxed font-medium">
                        Analizlerimiz, BT ekipmanları kategorisinde son 3 ayda %15 fiyat artışı trendi göstermektedir.
                        Toplu alım yaparak yıllık bütçenizde <strong>~85.000 TL</strong> ek tasarruf sağlayabilirsiniz.
                    </p>
                </div>
                <button className="ml-auto px-6 py-2.5 bg-white text-blue-600 font-bold rounded-xl shadow-sm hover:shadow-md transition-all whitespace-nowrap border border-blue-100">
                    Detayları Gör
                </button>
            </div>
        </section>
    );
}
