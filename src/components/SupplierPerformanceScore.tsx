"use client";
import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import Skeleton from "@/components/ui/Skeleton";
import Badge from "@/components/ui/Badge";

interface PerformanceMetrics {
    avgLeadTime: number;
    qualityRate: number;
    reliabilityScore: number;
    orderCount: number;
}

export default function SupplierPerformanceScore({ supplierId }: { supplierId: string }) {
    const [data, setData] = useState<{ hasData: boolean; metrics?: PerformanceMetrics } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/tedarikci/${supplierId}/performans`)
            .then(res => res.json())
            .then(d => setData(d))
            .catch(e => console.error(e))
            .finally(() => setLoading(false));
    }, [supplierId]);

    if (loading) return <Skeleton height={150} />;
    if (!data?.hasData) return (
        <Card className="p-6 bg-slate-50 border-dashed border-2 flex flex-col items-center justify-center text-slate-400">
            <Icon name="activity" className="w-8 h-8 mb-2 opacity-20" />
            <p className="text-sm font-medium">Henüz yeterli performans verisi toplanmadı.</p>
        </Card>
    );

    const m = data.metrics!;

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-in fade-in duration-500">
            <Card className="p-4 bg-white shadow-sm border-slate-100">
                <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Teslimat Hızı</span>
                    <Icon name="clock" className="text-blue-500 w-4 h-4" />
                </div>
                <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-800 tracking-tighter">{m.avgLeadTime}</span>
                    <span className="text-xs font-bold text-slate-400">gün (ort)</span>
                </div>
                <div className="mt-3 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                        className="bg-blue-500 h-full rounded-full transition-all duration-1000"
                        style={{ width: `${Math.max(10, 100 - (m.avgLeadTime * 5))}%` }}
                    />
                </div>
            </Card>

            <Card className="p-4 bg-white shadow-sm border-slate-100">
                <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kalite Oranı</span>
                    <Icon name="check-circle" className="text-sky-500 w-4 h-4" />
                </div>
                <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-blue-600 tracking-tighter">%{m.qualityRate}</span>
                </div>
                <div className="mt-3 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                        className="bg-sky-500 h-full rounded-full transition-all duration-1000"
                        style={{ width: `${m.qualityRate}%` }}
                    />
                </div>
            </Card>

            <Card className="p-4 bg-white shadow-sm border-slate-100">
                <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Güvenilirlik</span>
                    <Icon name="shield" className="text-indigo-500 w-4 h-4" />
                </div>
                <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-indigo-600 tracking-tighter">{m.reliabilityScore}</span>
                    <span className="text-xs font-bold text-slate-400">/ 100</span>
                </div>
                <div className="mt-3 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                        className="bg-blue-600 h-full rounded-full transition-all duration-1000"
                        style={{ width: `${m.reliabilityScore}%` }}
                    />
                </div>
            </Card>

            <Card className="p-4 bg-slate-900 border-slate-800 flex flex-col justify-center">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Analiz Edilen</div>
                <div className="text-xl font-black text-white leading-none">{m.orderCount} Sipariş</div>
                <Badge variant="primary" className="mt-2 bg-blue-500/20 text-blue-400 border-blue-500/30 text-[9px]">GÜNCEL VERİ</Badge>
            </Card>
        </div>
    );
}
