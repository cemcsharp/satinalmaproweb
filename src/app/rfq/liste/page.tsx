"use client";
import { useEffect, useState } from "react";
import { useApiRequest } from "@/hooks/useApiRequest";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import { formatNumberTR } from "@/lib/format";

type RfqListItem = {
    id: string;
    rfxCode: string;
    title: string;
    status: string;
    deadline: string | null;
    createdAt: string;
    _count: { suppliers: number; items: number };
    suppliers: Array<{ stage: string; offer?: { totalAmount: number; currency: string } }>;
};

export default function RfqListePage() {
    const router = useRouter();
    const [data, setData] = useState<RfqListItem[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const { execute, loading } = useApiRequest<{ items: RfqListItem[], totalPages: number }>();

    useEffect(() => {
        execute({
            url: `/api/rfq?page=${page}`,
            onSuccess: (json) => {
                setData(json.items || []);
                setTotalPages(json.totalPages || 1);
            }
        });
    }, [page, execute]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "ACTIVE": return <Badge variant="success">Aktif</Badge>;
            case "COMPLETED": return <Badge variant="info">Tamamlandı</Badge>;
            case "CANCELLED": return <Badge variant="error">İptal</Badge>;
            default: return <Badge variant="default">{status}</Badge>;
        }
    };

    const getOfferStats = (suppliers: RfqListItem["suppliers"]) => {
        const offered = suppliers.filter(s => s.stage === "OFFERED").length;
        const total = suppliers.length;
        return { offered, total };
    };

    if (loading) return <div className="p-10"><Skeleton height={400} /></div>;

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-10 animate-in fade-in duration-500">
            <PageHeader
                title="Teklif Talepleri (RFQ)"
                description="Tedarikçilerden toplanan fiyat tekliflerini yönetin."
                actions={
                    <Button variant="gradient" onClick={() => router.push("/rfq/olustur")}>
                        Yeni RFQ Oluştur
                    </Button>
                }
            />

            <Card className="p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-100 text-slate-700 uppercase font-semibold text-xs">
                            <tr>
                                <th className="p-4">RFQ Kodu</th>
                                <th className="p-4">Başlık</th>
                                <th className="p-4 text-center">Durum</th>
                                <th className="p-4 text-center">Teklifler</th>
                                <th className="p-4 text-center">Son Tarih</th>
                                <th className="p-4 text-right">İşlem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {data.length === 0 ? (
                                <tr><td colSpan={6} className="p-8 text-center text-slate-500">Henüz teklif talebi bulunmuyor.</td></tr>
                            ) : (
                                data.map(rfq => {
                                    const stats = getOfferStats(rfq.suppliers);
                                    return (
                                        <tr key={rfq.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="p-4 font-mono font-bold text-blue-700">{rfq.rfxCode}</td>
                                            <td className="p-4">
                                                <div className="font-medium text-slate-900">{rfq.title}</div>
                                                <div className="text-xs text-slate-500">{rfq._count.items} Kalem</div>
                                            </td>
                                            <td className="p-4 text-center">{getStatusBadge(rfq.status)}</td>
                                            <td className="p-4 text-center">
                                                <span className="inline-flex items-center gap-1">
                                                    <span className="text-lg font-bold text-green-600">{stats.offered}</span>
                                                    <span className="text-slate-400">/</span>
                                                    <span className="text-slate-600">{stats.total}</span>
                                                </span>
                                            </td>
                                            <td className="p-4 text-center text-slate-600">
                                                {rfq.deadline ? new Date(rfq.deadline).toLocaleDateString("tr-TR") : "-"}
                                            </td>
                                            <td className="p-4 text-right">
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    onClick={() => router.push(`/rfq/detay/${rfq.id}`)}
                                                >
                                                    Detay
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="flex justify-center gap-2 p-4 border-t border-slate-100">
                        <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Önceki</Button>
                        <span className="px-4 py-2 text-sm text-slate-600">Sayfa {page} / {totalPages}</span>
                        <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Sonraki</Button>
                    </div>
                )}
            </Card>
        </div>
    );
}
