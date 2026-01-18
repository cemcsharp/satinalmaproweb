"use client";
import React, { useEffect, useState } from "react";

type OfferItem = {
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
};

type HistoryEntry = {
    participationId: string;
    rfqId: string;
    rfxCode: string;
    title: string;
    rfqStatus: string;
    deadline: string | null;
    offer: {
        id: string;
        totalAmount: number;
        currency: string;
        submittedAt: string;
        isWinner: boolean;
        validUntil: string | null;
        itemCount: number;
        items: OfferItem[];
    } | null;
};

export default function RfqHistoryPage() {
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedEntry, setExpandedEntry] = useState<string | null>(null);

    useEffect(() => {
        async function loadHistory() {
            try {
                const res = await fetch("/api/portal/rfq/history");
                if (res.ok) {
                    const data = await res.json();
                    setHistory(data.history || []);
                }
            } catch (err) {
                console.error("Failed to load history", err);
            } finally {
                setLoading(false);
            }
        }
        loadHistory();
    }, []);

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat("tr-TR", {
            style: "currency",
            currency: currency === "TRY" ? "TRY" : currency === "USD" ? "USD" : "EUR",
            minimumFractionDigits: 2
        }).format(amount);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("tr-TR", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    };

    const getResultBadge = (entry: HistoryEntry) => {
        if (!entry.offer) return null;
        if (entry.offer.isWinner) {
            return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-100 text-blue-700">🏆 Kazandınız</span>;
        }
        if (entry.rfqStatus === "COMPLETED" || entry.rfqStatus === "CLOSED") {
            return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">Kaybettiniz</span>;
        }
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-sky-100 text-amber-700">Değerlendiriliyor</span>;
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Teklif Geçmişi</h1>
                    <p className="text-slate-500 text-sm mt-1">Daha önce katıldığınız tüm ihalelerin sonuçlarını inceleyin.</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Toplam: {history.length} Teklif
                    </span>
                </div>
            </div>

            {/* History Table */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                {loading ? (
                    <div className="p-12 flex flex-col items-center justify-center">
                        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4" />
                        <p className="text-slate-400 text-sm">Teklif geçmişi yükleniyor...</p>
                    </div>
                ) : history.length === 0 ? (
                    <div className="p-12 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-700 mb-2">Henüz Teklif Geçmişiniz Yok</h3>
                        <p className="text-sm text-slate-400 max-w-sm">
                            Açık taleplere teklif vererek ihale süreçlerine katılabilirsiniz.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">RFQ Kodu</th>
                                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Başlık</th>
                                    <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Teklifiniz</th>
                                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Sonuç</th>
                                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Tarih</th>
                                    <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Detay</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {history.map((entry) => (
                                    <React.Fragment key={entry.participationId}>
                                        <tr className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <span className="font-mono text-sm font-semibold text-blue-600">{entry.rfxCode}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-slate-700 line-clamp-1">{entry.title}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {entry.offer ? (
                                                    <span className="font-semibold text-slate-800">
                                                        {formatCurrency(entry.offer.totalAmount, entry.offer.currency)}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 italic">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {getResultBadge(entry)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-slate-500">
                                                    {entry.offer ? formatDate(entry.offer.submittedAt) : "-"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => setExpandedEntry(expandedEntry === entry.participationId ? null : entry.participationId)}
                                                    className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                                                >
                                                    <svg className={`w-5 h-5 text-slate-400 transition-transform ${expandedEntry === entry.participationId ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                        {/* Expanded Items Row */}
                                        {expandedEntry === entry.participationId && entry.offer && (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-4 bg-slate-50/70">
                                                    <div className="space-y-3">
                                                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Teklif Kalemleri ({entry.offer.itemCount})</h4>
                                                        <div className="grid gap-2">
                                                            {entry.offer.items.map((item, idx) => (
                                                                <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-100">
                                                                    <div className="flex-1">
                                                                        <span className="text-sm font-medium text-slate-700">{item.name}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-6 text-sm">
                                                                        <span className="text-slate-500">{item.quantity} Adet</span>
                                                                        <span className="text-slate-500">@ {formatCurrency(item.unitPrice, entry.offer!.currency)}</span>
                                                                        <span className="font-semibold text-slate-700">{formatCurrency(item.totalPrice, entry.offer!.currency)}</span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
