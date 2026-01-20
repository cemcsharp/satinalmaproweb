"use client";
import { useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { formatNumberTR } from "@/lib/format";

interface NegotiationPanelProps {
    rfqId: string;
    negotiationStatus: string;
    negotiationRound: number;
    negotiationDeadline: string | null;
    onRefresh: () => void;
    stats?: {
        totalParticipants: number;
        offeredParticipants: number;
        averagePrice: number;
        bestPrice: number;
    };
}

export default function NegotiationPanel({
    rfqId,
    negotiationStatus,
    negotiationRound,
    negotiationDeadline,
    onRefresh,
    stats
}: NegotiationPanelProps) {
    const { show } = useToast();
    const [loading, setLoading] = useState(false);
    const [showStartModal, setShowStartModal] = useState(false);
    const [deadline, setDeadline] = useState("");

    const handleStartNegotiation = async () => {
        if (!deadline) return show({ title: "Hata", description: "Lütfen bir bitiş tarihi seçin.", variant: "error" });

        setLoading(true);
        try {
            const res = await fetch(`/api/rfq/${rfqId}/negotiation`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ deadline })
            });
            if (res.ok) {
                show({ title: "Pazarlık Başlatıldı", description: `${negotiationRound + 1}. tur başladı.`, variant: "success" });
                setShowStartModal(false);
                onRefresh();
            } else {
                throw new Error("Pazarlık başlatılamadı.");
            }
        } catch (e: any) {
            show({ title: "Hata", description: e.message, variant: "error" });
        } finally {
            setLoading(false);
        }
    };

    const handleFinishNegotiation = async () => {
        if (!confirm("Pazarlık sürecini bitirmek istediğinize emin misiniz?")) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/rfq/${rfqId}/negotiation`, {
                method: "DELETE"
            });
            if (res.ok) {
                show({ title: "Pazarlık Bitirildi", variant: "success" });
                onRefresh();
            } else {
                throw new Error("Pazarlık bitirilemedi.");
            }
        } catch (e: any) {
            show({ title: "Hata", description: e.message, variant: "error" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card title="E-Pazarlık Yönetimi" className="border-blue-100 shadow-blue-50/50">
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <div>
                        <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Mevcut Durum</div>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant={negotiationStatus === "ACTIVE" ? "success" : negotiationStatus === "FINISHED" ? "default" : "default"}>
                                {negotiationStatus === "ACTIVE" ? "Pazarlık Devam Ediyor" :
                                    negotiationStatus === "FINISHED" ? "Pazarlık Tamamlandı" : "Henüz Başlamadı"}
                            </Badge>
                            {negotiationRound > 0 && <span className="text-sm font-bold text-slate-700">{negotiationRound}. Tur</span>}
                        </div>
                    </div>
                    {negotiationStatus === "ACTIVE" && negotiationDeadline && (
                        <div className="text-right">
                            <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Kalan Süre</div>
                            <div className="text-sm font-mono font-bold text-red-600 mt-1">
                                {new Date(negotiationDeadline).toLocaleString("tr-TR")}
                            </div>
                        </div>
                    )}
                </div>

                {stats && (
                    <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-50">
                        <div className="bg-slate-50 p-2 rounded">
                            <div className="text-[10px] text-slate-500 uppercase font-bold">Katılım</div>
                            <div className="text-sm font-bold text-slate-800">{stats.offeredParticipants} / {stats.totalParticipants}</div>
                        </div>
                        <div className="bg-slate-50 p-2 rounded">
                            <div className="text-[10px] text-slate-500 uppercase font-bold">Pazar Ortalaması</div>
                            <div className="text-sm font-bold text-blue-700">{formatNumberTR(stats.averagePrice)} ₺</div>
                        </div>
                    </div>
                )}

                <div className="flex gap-2">
                    {negotiationStatus !== "ACTIVE" ? (
                        <Button
                            className="flex-1"
                            variant="primary"
                            onClick={() => setShowStartModal(true)}
                            disabled={loading}
                        >
                            {negotiationRound === 0 ? "Pazarlığı Başlat" : "Yeni Tur Başlat"}
                        </Button>
                    ) : (
                        <>
                            <Button
                                className="flex-1"
                                variant="outline"
                                size="sm"
                                onClick={() => setShowStartModal(true)}
                                disabled={loading}
                            >
                                Süreyi Uzat / Güncelle
                            </Button>
                            <Button
                                className="flex-1"
                                variant="danger"
                                size="sm"
                                onClick={handleFinishNegotiation}
                                disabled={loading}
                            >
                                Pazarlığı Bitir
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {showStartModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200">
                        <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800">
                                {negotiationStatus === "ACTIVE" ? "Pazarlık Süresini Güncelle" : "Pazarlık Turunu Başlat"}
                            </h3>
                            <button onClick={() => setShowStartModal(false)} className="text-slate-400 hover:text-red-500 transition-colors">✕</button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">Bitiş Tarihi ve Saati</label>
                                <input
                                    type="datetime-local"
                                    className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50"
                                    value={deadline}
                                    onChange={(e) => setDeadline(e.target.value)}
                                />
                                <p className="text-[10px] text-slate-400">Tedarikçiler bu tarihe kadar tekliflerini revize edebilecekler.</p>
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 border-t flex gap-2">
                            <Button className="flex-1" variant="secondary" onClick={() => setShowStartModal(false)}>Vazgeç</Button>
                            <Button className="flex-1" variant="primary" onClick={handleStartNegotiation} loading={loading}>
                                {negotiationStatus === "ACTIVE" ? "Güncelle" : "Başlat"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </Card>
    );
}
