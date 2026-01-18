"use client";
import { useEffect, useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import Skeleton from "@/components/ui/Skeleton";
import { formatNumberTR } from "@/lib/format";
import Badge from "@/components/ui/Badge";

interface Budget {
    id: string;
    departmentName: string;
    year: number;
    total: number;
    spent: number;
    reserved: number;
    remaining: number;
    currency: string;
    utilizationRate: number;
}

export default function ButceKonsoluPage() {
    const [data, setData] = useState<Budget[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/finans/butce")
            .then(r => r.json())
            .then(d => {
                if (d.items) setData(d.items);
            })
            .catch(e => console.error(e))
            .finally(() => setLoading(false));
    }, []);

    const stats = {
        total: data.reduce((acc, curr) => acc + curr.total, 0),
        spent: data.reduce((acc, curr) => acc + curr.spent, 0),
        reserved: data.reduce((acc, curr) => acc + curr.reserved, 0),
    };

    if (loading) return <div className="p-10"><Skeleton height={400} /></div>;

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-10">
            <PageHeader
                title="Finansal Kontrol Konsolu"
                description="Departman bazlı bütçe takibi ve harcama analizi."
                actions={
                    <div className="flex gap-3">
                        <Badge variant="outline" className="text-blue-600 bg-sky-50 border-sky-100 px-4 py-1.5 font-bold uppercase tracking-wider">2026 Mali Yılı</Badge>
                    </div>
                }
            />

            {/* Global Stats Table */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-indigo-500 to-blue-600 border-none">
                    <div className="p-2 space-y-1">
                        <div className="text-blue-100 text-xs font-bold uppercase tracking-wider">Toplam Kurumsal Bütçe</div>
                        <div className="text-3xl font-black text-white tracking-tighter">{formatNumberTR(stats.total)} TRY</div>
                        <div className="flex items-center gap-1.5 text-xs text-blue-100 font-medium">
                            <Icon name="info" className="w-3.5 h-3.5" />
                            Tüm departmanların yıllık toplamı
                        </div>
                    </div>
                </Card>

                <Card className="bg-gradient-to-br from-sky-500 to-teal-600 border-none">
                    <div className="p-2 space-y-1">
                        <div className="text-sky-100 text-xs font-bold uppercase tracking-wider">Toplam Gerçekleşen Harcama</div>
                        <div className="text-3xl font-black text-white tracking-tighter">{formatNumberTR(stats.spent)} TRY</div>
                        <div className="flex items-center gap-1.5 text-xs text-sky-100 font-medium">
                            <Icon name="check-circle" className="w-3.5 h-3.5" />
                            Faturalandırılmış ve ödenmiş kalemler
                        </div>
                    </div>
                </Card>

                <Card className="bg-gradient-to-br from-sky-500 to-orange-600 border-none">
                    <div className="p-2 space-y-1">
                        <div className="text-amber-100 text-xs font-bold uppercase tracking-wider">Toplam Rezerve Miktar</div>
                        <div className="text-3xl font-black text-white tracking-tighter">{formatNumberTR(stats.reserved)} TRY</div>
                        <div className="flex items-center gap-1.5 text-xs text-amber-100 font-medium">
                            <Icon name="clock" className="w-3.5 h-3.5" />
                            Onaylanmış taleplerden ayrılan pay
                        </div>
                    </div>
                </Card>
            </div>

            {/* Budget Details Table */}
            <Card title="Departman Bazlı Bütçe Detayları" className="overflow-hidden p-0 border-slate-100">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-100">
                                <th className="p-4 text-left text-slate-500 font-bold uppercase tracking-widest text-[10px]">Departman</th>
                                <th className="p-4 text-right text-slate-500 font-bold uppercase tracking-widest text-[10px]">Toplam Bütçe</th>
                                <th className="p-4 text-center text-slate-500 font-bold uppercase tracking-widest text-[10px]">Kullanım Durumu</th>
                                <th className="p-4 text-right text-slate-500 font-bold uppercase tracking-widest text-[10px]">Gerçekleşen</th>
                                <th className="p-4 text-right text-slate-500 font-bold uppercase tracking-widest text-[10px]">Rezerve</th>
                                <th className="p-4 text-right text-slate-500 font-bold uppercase tracking-widest text-[10px]">Kalan</th>
                                <th className="p-4 text-center w-[60px]"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {data.map(b => (
                                <tr key={b.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="p-4">
                                        <div className="font-bold text-slate-900 leading-tight">{b.departmentName}</div>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{b.year} Mali Dönemi</div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="font-black text-slate-800">{formatNumberTR(b.total)}</div>
                                        <div className="text-[9px] text-slate-400 font-bold">{b.currency}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="space-y-1.5 max-w-[150px] mx-auto">
                                            <div className="flex justify-between text-[10px] font-bold">
                                                <span className={b.utilizationRate > 90 ? "text-rose-600" : "text-indigo-600"}>%{b.utilizationRate.toFixed(1)}</span>
                                                <span className="text-slate-400">%{(100 - b.utilizationRate).toFixed(1)} Kalan</span>
                                            </div>
                                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                                                <div
                                                    className={`h-full transition-all duration-500 ${b.utilizationRate > 90 ? "bg-rose-500" : "bg-blue-600 shadow-sm shadow-indigo-200"}`}
                                                    style={{ width: `${Math.min(b.utilizationRate, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="font-bold text-blue-600">{formatNumberTR(b.spent)}</div>
                                    </td>
                                    <td className="p-4 text-right font-medium text-blue-600">
                                        {formatNumberTR(b.reserved)}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className={`font-black ${b.remaining < 0 ? "text-rose-600" : "text-slate-700"}`}>
                                            {formatNumberTR(b.remaining)}
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <button className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                                            <Icon name="chevron-right" className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card title="Bütçe Politikası" className="border-l-4 border-l-indigo-500 bg-indigo-50/30">
                    <p className="text-sm text-slate-600 leading-relaxed italic font-medium">
                        "Satınalma talepleri onaylandığında, ilgili departman bütçesinden kalem bazlı tutarlar otomatik olarak <span className="text-indigo-600 font-bold">Rezerve</span> edilir. Sipariş (Order) onaylandığında bu tutar gerçekleşen harcama kalemine aktarılır."
                    </p>
                </Card>
                <Card title="Hızlı Aksiyonlar" className="flex items-center gap-4">
                    <button
                        onClick={() => alert("Bütçe Tanımı modülü hazırlanıyor. Admin panelinden departman bütçelerini tanımlayabilirsiniz.")}
                        className="flex-1 px-4 py-4 rounded-xl border border-slate-100 bg-white hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/10 transition-all text-center group"
                    >
                        <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center mx-auto mb-2 text-indigo-600 group-hover:bg-blue-700 group-hover:text-white transition-colors">
                            <Icon name="plus" className="w-5 h-5" />
                        </div>
                        <div className="text-[10px] font-black uppercase text-slate-500 group-hover:text-indigo-600 transition-colors">Bütçe Tanımı</div>
                    </button>
                    <button
                        onClick={() => window.location.href = "/analitik"}
                        className="flex-1 px-4 py-4 rounded-xl border border-slate-100 bg-white hover:border-sky-500 hover:shadow-lg hover:shadow-sky-500/10 transition-all text-center group"
                    >
                        <div className="w-10 h-10 bg-sky-50 rounded-lg flex items-center justify-center mx-auto mb-2 text-blue-600 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                            <Icon name="clipboard" className="w-5 h-5" />
                        </div>
                        <div className="text-[10px] font-black uppercase text-slate-500 group-hover:text-blue-600 transition-colors">Finans Raporu</div>
                    </button>
                </Card>

            </div>
        </div>
    );
}
