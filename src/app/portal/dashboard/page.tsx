"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";

type RfqItem = {
    participationId: string;
    rfqId: string;
    rfxCode: string;
    title: string;
    status: string;
    deadline: string;
    stage: string;
    hasSubmittedOffer: boolean;
    offerDetails: {
        id: string;
        submittedAt: string;
        totalAmount: number;
        currency: string;
    } | null;
};

export default function SupplierDashboard() {
    const [items, setItems] = useState<RfqItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch("/api/portal/dashboard");
                const data = await res.json();
                if (res.ok) {
                    setItems(data.items || []);
                } else {
                    setError(data.message || "Talepler yüklenirken bir hata oluştu.");
                }
            } catch (err) {
                setError("Sunucu ile bağlantı kurulamadı.");
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const getStageBadge = (stage: string, hasOffer: boolean) => {
        if (hasOffer) return <Badge variant="success" className="animate-in fade-in zoom-in">Teklif Verildi</Badge>;
        if (stage === "VIEWED") return <Badge variant="info">Görüntülendi</Badge>;
        if (stage === "DECLINED") return <Badge variant="error">Reddedildi</Badge>;
        return <Badge variant="warning">Bekliyor</Badge>;
    };

    const getStatusLabel = (status: string) => {
        if (status === "ACTIVE") return <span className="text-emerald-600 font-bold">Açık</span>;
        if (status === "COMPLETED") return <span className="text-slate-500 font-bold">Kapandı</span>;
        return status;
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Teklif Talepleriniz</h1>
                    <p className="mt-2 text-slate-500 font-medium">Size atanmış olan aktif ve geçmiş teklif isteme (RFQ) süreçlerini buradan yönetebilirsiniz.</p>
                </div>
            </div>

            {loading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200">
                            <Skeleton className="h-4 w-3/4 mb-4" />
                            <Skeleton className="h-10 w-full mb-6" />
                            <div className="flex justify-between">
                                <Skeleton className="h-4 w-1/3" />
                                <Skeleton className="h-4 w-1/4" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : error ? (
                <div className="bg-red-50 border border-red-200 p-8 rounded-2xl text-center">
                    <p className="text-red-700 font-semibold">{error}</p>
                </div>
            ) : items.length === 0 ? (
                <div className="bg-white border border-slate-200 p-12 rounded-3xl text-center shadow-sm">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">Henüz bir talep yok</h3>
                    <p className="text-slate-500 mt-2">Şu anda size atanmış aktif bir teklif isteme süreci bulunmuyor.</p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {items.map((item) => (
                        <Card
                            key={item.participationId}
                            className="group overflow-hidden flex flex-col hover:shadow-xl transition-all duration-300 border-slate-200 hover:border-indigo-300 relative"
                        >
                            {/* Status Indicator Strip */}
                            <div className={`absolute top-0 left-0 right-0 h-1.5 ${item.hasSubmittedOffer ? 'bg-emerald-500' : 'bg-amber-400'}`} />

                            <div className="p-6 flex-1 flex flex-col">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-2.5 bg-slate-100 group-hover:bg-indigo-50 rounded-xl transition-colors">
                                        <svg className="w-6 h-6 text-slate-600 group-hover:text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    {getStageBadge(item.stage, item.hasSubmittedOffer)}
                                </div>

                                <div className="space-y-1 mb-6">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-wider">{item.rfxCode}</span>
                                        <span className="text-xs text-slate-400">•</span>
                                        <span className="text-xs font-semibold text-slate-500">{getStatusLabel(item.status)}</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 line-clamp-2 group-hover:text-indigo-700 transition-colors capitalize">
                                        {item.title.toLowerCase()}
                                    </h3>
                                </div>

                                <div className="mt-auto space-y-4">
                                    <div className="flex items-center justify-between py-3 border-t border-slate-100">
                                        <div className="flex items-center gap-2 text-slate-500">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <span className="text-xs font-medium">Bitiş Tarihi</span>
                                        </div>
                                        <span className={`text-xs font-bold ${new Date(item.deadline) < new Date() ? 'text-red-500' : 'text-slate-700'}`}>
                                            {item.deadline ? new Date(item.deadline).toLocaleDateString("tr-TR", { day: 'numeric', month: 'long', year: 'numeric' }) : "-"}
                                        </span>
                                    </div>

                                    {item.hasSubmittedOffer ? (
                                        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between">
                                            <div>
                                                <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-tight">Teklif Tutarı</p>
                                                <p className="text-lg font-black text-emerald-700">
                                                    {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: item.offerDetails?.currency || 'TRY' }).format(item.offerDetails?.totalAmount || 0)}
                                                </p>
                                            </div>
                                            <Link href={`/portal/rfq/details/${item.rfqId}`}>
                                                <Button variant="ghost" size="sm" className="bg-white hover:bg-emerald-100 text-emerald-700">Güncelle</Button>
                                            </Link>
                                        </div>
                                    ) : (
                                        <Link href={`/portal/rfq/details/${item.rfqId}`} className="block">
                                            <Button variant="primary" className="w-full h-12 rounded-2xl shadow-lg shadow-indigo-100 group-hover:shadow-indigo-200">
                                                Teklif Ver/Görüntüle
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
