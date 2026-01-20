"use client";
import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { formatNumberTR } from "@/lib/format";

interface PortalNegotiationPanelProps {
    token: string;
}

export default function PortalNegotiationPanel({ token }: PortalNegotiationPanelProps) {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = () => {
        fetch(`/api/portal/rfq/${token}/negotiation`)
            .then(r => r.json())
            .then(data => {
                if (data.ok) setStats(data);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchStats();
        // Polling every 30 seconds for live updates during negotiation
        const interval = setInterval(fetchStats, 30000);
        return () => clearInterval(interval);
    }, [token]);

    if (loading) return null;
    if (!stats || stats.negotiationStatus !== "ACTIVE") return null;

    return (
        <Card className="border-none shadow-2xl bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 text-white overflow-hidden rounded-[2.5rem] relative group">
            {/* Animated Background Element */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-blue-500/20 transition-all duration-1000"></div>

            <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row items-center gap-8 md:gap-12">
                <div className="flex-1 space-y-4 text-center md:text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 rounded-full border border-blue-400/30">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-200">Canlı Pazarlık Turu {stats.negotiationRound}</span>
                    </div>
                    <h2 className="text-3xl font-black tracking-tighter leading-tight">
                        Pazar Pozisyonunuz <br />
                        <span className="text-blue-400 font-medium italic">ve Analitik Veriler</span>
                    </h2>
                    {stats.negotiationDeadline && (
                        <div className="flex items-center justify-center md:justify-start gap-4 pt-2">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kalan Süre</span>
                                <span className="text-xl font-black font-mono text-red-400">
                                    {new Date(stats.negotiationDeadline).toLocaleString("tr-TR")}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full md:w-auto">
                    {/* Rank Card */}
                    <div className="bg-white/10 backdrop-blur-md border border-white/10 p-6 rounded-[2rem] text-center min-w-[180px] hover:bg-white/15 transition-all">
                        <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest mb-2">Mevcut Sıralama</p>
                        <div className="flex flex-col items-center">
                            <span className="text-6xl font-black tracking-tighter text-white">
                                {stats.stats.myRank || "-"}
                            </span>
                            <span className="text-sm font-black text-blue-400/60 uppercase">/ {stats.stats.totalParticipants} Firma</span>
                        </div>
                    </div>

                    {/* Market Average Card */}
                    <div className="bg-white/10 backdrop-blur-md border border-white/10 p-6 rounded-[2rem] text-center min-w-[180px] hover:bg-white/15 transition-all">
                        <p className="text-[10px] font-black text-green-300 uppercase tracking-widest mb-2">Pazar Ortalaması</p>
                        <div className="flex flex-col items-center">
                            <span className="text-3xl font-black tracking-tighter text-white mt-4">
                                {formatNumberTR(stats.stats.marketAverage)} <span className="text-sm font-black text-green-400/60">₺</span>
                            </span>
                            <div className="mt-4 px-3 py-1 bg-green-500/20 rounded-full text-[10px] font-black text-green-300 uppercase tracking-widest">
                                Referans Değeri
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Alert Message */}
            {!stats.stats.isMyOfferLatest && (
                <div className="bg-red-500/20 backdrop-blur-md p-4 text-center border-t border-red-500/30">
                    <p className="text-xs font-black text-red-200 uppercase tracking-[0.1em] flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Dikkat: Bu tur için henüz revize teklif vermediniz!
                    </p>
                </div>
            )}
        </Card>
    );
}
