"use client";
import React, { useEffect, useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Skeleton from "@/components/ui/Skeleton";

interface Evaluation {
    id: string;
    supplierName: string;
    orderNo: string;
    deliveryScore: number;
    qualityScore: number;
    communicationScore: number;
    overallScore: number;
    comment: string;
    createdAt: string;
}

export default function DegerlendirmelerimPage() {
    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadEvaluations();
    }, []);

    const loadEvaluations = async () => {
        try {
            const res = await fetch("/api/degerlendirme/benim");
            if (res.ok) {
                const data = await res.json();
                setEvaluations(data.items || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 4) return "text-blue-600 bg-sky-50";
        if (score >= 3) return "text-blue-600 bg-amber-50";
        return "text-rose-600 bg-rose-50";
    };

    const getScoreLabel = (score: number) => {
        if (score >= 4.5) return "Mükemmel";
        if (score >= 4) return "Çok İyi";
        if (score >= 3) return "İyi";
        if (score >= 2) return "Orta";
        return "Zayıf";
    };

    return (
        <section className="space-y-6 max-w-5xl mx-auto">
            <PageHeader
                title="Değerlendirmelerim"
                description="Biriminiz adına yapılan tedarikçi değerlendirmelerini görüntüleyin."
            />

            {loading ? (
                <div className="space-y-4">
                    <Skeleton height={120} />
                    <Skeleton height={120} />
                    <Skeleton height={120} />
                </div>
            ) : evaluations.length === 0 ? (
                <Card className="p-10 text-center">
                    <div className="text-4xl mb-4">📋</div>
                    <h3 className="text-lg font-bold text-slate-700 mb-2">Henüz Değerlendirme Yok</h3>
                    <p className="text-sm text-slate-500">
                        Biriminiz adına yapılan siparişler tamamlandığında, tedarikçi değerlendirmeleri burada görünecektir.
                    </p>
                </Card>
            ) : (
                <div className="space-y-4">
                    {evaluations.map(ev => (
                        <Card key={ev.id} className="p-6 hover:shadow-lg transition-shadow">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <span className="text-lg font-bold text-slate-800">{ev.supplierName}</span>
                                        <Badge variant="info" className="text-[10px]">{ev.orderNo}</Badge>
                                    </div>
                                    <p className="text-sm text-slate-500">{ev.comment || "Yorum eklenmemiş."}</p>
                                    <p className="text-xs text-slate-400">
                                        {new Date(ev.createdAt).toLocaleDateString("tr-TR", {
                                            day: "numeric",
                                            month: "long",
                                            year: "numeric"
                                        })}
                                    </p>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="text-center">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase">Teslimat</div>
                                        <div className={`text-lg font-black rounded-lg px-2 py-1 ${getScoreColor(ev.deliveryScore)}`}>
                                            {ev.deliveryScore.toFixed(1)}
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase">Kalite</div>
                                        <div className={`text-lg font-black rounded-lg px-2 py-1 ${getScoreColor(ev.qualityScore)}`}>
                                            {ev.qualityScore.toFixed(1)}
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase">İletişim</div>
                                        <div className={`text-lg font-black rounded-lg px-2 py-1 ${getScoreColor(ev.communicationScore)}`}>
                                            {ev.communicationScore.toFixed(1)}
                                        </div>
                                    </div>
                                    <div className="text-center border-l pl-4 ml-2">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase">Genel</div>
                                        <div className={`text-xl font-black rounded-lg px-3 py-1 ${getScoreColor(ev.overallScore)}`}>
                                            {ev.overallScore.toFixed(1)}
                                        </div>
                                        <div className="text-[9px] font-bold text-slate-500 mt-0.5">
                                            {getScoreLabel(ev.overallScore)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </section>
    );
}
