"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface OpenRfq {
    id: string;
    rfxCode: string;
    title: string;
    deadline: string | null;
    status: string;
    itemCount: number;
    categoryName: string | null;
    hasExistingOffer: boolean;
    token: string | null;
}

export default function OpenRfqListPage() {
    const { data: session } = useSession();
    const [rfqs, setRfqs] = useState<OpenRfq[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchOpenRfqs = async () => {
            try {
                const res = await fetch("/api/portal/open-rfqs");
                if (!res.ok) throw new Error("RFQ listesi alınamadı");
                const data = await res.json();
                setRfqs(data.rfqs || []);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchOpenRfqs();
    }, []);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "OPEN": return "success";
            case "CLOSED": return "default";
            case "CANCELLED": return "danger";
            default: return "default";
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case "OPEN": return "Açık";
            case "CLOSED": return "Kapalı";
            case "CANCELLED": return "İptal";
            default: return status;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Açık Talepler"
                description="Kategorinize uygun teklif verebileceğiniz açık satınalma talepleri"
            />

            {error && (
                <Card className="p-4 bg-red-50 border-red-200">
                    <p className="text-red-600">{error}</p>
                </Card>
            )}

            <Card className="p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    RFQ Kodu
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Başlık
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Kategori
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Kalem Sayısı
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Son Tarih
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Durum
                                </th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    İşlem
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {rfqs.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            <p className="font-medium">Kategorinize uygun açık talep bulunmuyor</p>
                                            <p className="text-sm">Yeni talepler oluşturulduğunda burada görünecektir</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                rfqs.map((rfq) => (
                                    <tr key={rfq.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="font-mono font-semibold text-blue-600">
                                                {rfq.rfxCode}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-medium text-slate-900">
                                                {rfq.title}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {rfq.categoryName ? (
                                                <Badge variant="default">{rfq.categoryName}</Badge>
                                            ) : (
                                                <span className="text-slate-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-medium">{rfq.itemCount}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {rfq.deadline ? (
                                                <span className={`font-medium ${new Date(rfq.deadline) < new Date() ? 'text-red-500' : 'text-slate-700'}`}>
                                                    {format(new Date(rfq.deadline), "dd MMM yyyy", { locale: tr })}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant={getStatusBadge(rfq.status) as any}>
                                                {getStatusLabel(rfq.status)}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {rfq.token ? (
                                                <Link
                                                    href={`/portal/rfq/${rfq.token}`}
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                                >
                                                    {rfq.hasExistingOffer ? "Teklifimi Gör" : "Teklif Ver"}
                                                </Link>
                                            ) : (
                                                <button
                                                    onClick={async () => {
                                                        // Create participation and get token
                                                        const res = await fetch("/api/portal/join-rfq", {
                                                            method: "POST",
                                                            headers: { "Content-Type": "application/json" },
                                                            body: JSON.stringify({ rfqId: rfq.id })
                                                        });
                                                        if (res.ok) {
                                                            const data = await res.json();
                                                            window.location.href = `/portal/rfq/${data.token}`;
                                                        }
                                                    }}
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors text-sm font-medium"
                                                >
                                                    Teklif'e Katıl
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
