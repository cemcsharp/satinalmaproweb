"use client";
import React, { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import Link from "next/link";

interface DashboardStats {
    users: { total: number; active: number };
    suppliers: { total: number; pending: number; approved: number };
    rfqs: { total: number; open: number };
    offers: number;
    orders: number;
}

interface RecentSupplier {
    id: string;
    name: string;
    email: string | null;
    createdAt: string;
}

interface RecentRfq {
    id: string;
    rfxCode: string;
    title: string;
    status: string;
    createdAt: string;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [recent, setRecent] = useState<{ pendingSuppliers: RecentSupplier[]; rfqs: RecentRfq[] }>({ pendingSuppliers: [], rfqs: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/admin/stats")
            .then(res => res.json())
            .then(data => {
                if (data.ok) {
                    setStats(data.stats);
                    setRecent(data.recent);
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const statCards = [
        { label: "Toplam Kullanıcı", value: stats?.users.total, subLabel: `${stats?.users.active || 0} aktif`, icon: "users", color: "blue" },
        { label: "Tedarikçi", value: stats?.suppliers.total, subLabel: `${stats?.suppliers.pending || 0} bekliyor`, icon: "truck", color: "sky" },
        { label: "Aktif RFQ", value: stats?.rfqs.open, subLabel: `${stats?.rfqs.total || 0} toplam`, icon: "file", color: "orange" },
        { label: "Toplam Teklif", value: stats?.offers, subLabel: "tüm zamanlar", icon: "chart", color: "purple" },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Admin Dashboard"
                description="Platform yönetim merkezi"
            />

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((card, i) => (
                    <Card key={i} className="p-6">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 bg-${card.color}-100 rounded-xl flex items-center justify-center`}>
                                <svg className={`w-6 h-6 text-${card.color}-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900">
                                    {loading ? <span className="animate-pulse">...</span> : (card.value ?? 0)}
                                </p>
                                <p className="text-sm text-slate-500">{card.label}</p>
                                <p className="text-xs text-slate-400">{card.subLabel}</p>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Quick Access & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Quick Access */}
                <Card title="Hızlı Erişim" className="p-6">
                    <div className="grid grid-cols-2 gap-4">
                        <Link href="/admin/tedarikciler" className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors group">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-slate-900">Tedarikçi Onayları</p>
                                    <p className="text-sm text-slate-500">Bekleyen başvurular</p>
                                </div>
                                {stats?.suppliers.pending ? (
                                    <Badge variant="warning">{stats.suppliers.pending}</Badge>
                                ) : null}
                            </div>
                        </Link>
                        <Link href="/admin/kullanicilar" className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                            <p className="font-medium text-slate-900">Kullanıcı Yönetimi</p>
                            <p className="text-sm text-slate-500">Kullanıcıları düzenle</p>
                        </Link>
                        <Link href="/admin/roller" className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                            <p className="font-medium text-slate-900">Roller & Yetkiler</p>
                            <p className="text-sm text-slate-500">İzinleri yapılandır</p>
                        </Link>
                        <Link href="/admin/e-posta" className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                            <p className="font-medium text-slate-900">E-posta Ayarları</p>
                            <p className="text-sm text-slate-500">SMTP yapılandır</p>
                        </Link>
                    </div>
                </Card>

                {/* Pending Suppliers */}
                <Card title="Bekleyen Tedarikçi Başvuruları" className="p-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
                        </div>
                    ) : recent.pendingSuppliers.length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-8">
                            Bekleyen başvuru yok
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {recent.pendingSuppliers.map((supplier) => (
                                <div key={supplier.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                                    <div>
                                        <p className="font-medium text-slate-900">{supplier.name}</p>
                                        <p className="text-xs text-slate-500">{supplier.email}</p>
                                    </div>
                                    <Link
                                        href="/admin/tedarikciler"
                                        className="px-3 py-1 bg-sky-500 text-white text-xs font-medium rounded-lg hover:bg-sky-600"
                                    >
                                        İncele
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>

            {/* Recent RFQs */}
            <Card title="Son RFQ'lar" className="p-6">
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
                    </div>
                ) : recent.rfqs.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-8">
                        Henüz RFQ oluşturulmamış
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left border-b border-slate-100">
                                    <th className="pb-3 text-xs font-semibold text-slate-500 uppercase">Kod</th>
                                    <th className="pb-3 text-xs font-semibold text-slate-500 uppercase">Başlık</th>
                                    <th className="pb-3 text-xs font-semibold text-slate-500 uppercase">Durum</th>
                                    <th className="pb-3 text-xs font-semibold text-slate-500 uppercase">Tarih</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {recent.rfqs.map((rfq) => (
                                    <tr key={rfq.id}>
                                        <td className="py-3 font-mono text-sm text-blue-600">{rfq.rfxCode}</td>
                                        <td className="py-3 text-sm text-slate-900">{rfq.title}</td>
                                        <td className="py-3">
                                            <Badge variant={rfq.status === "OPEN" ? "success" : "default"}>
                                                {rfq.status}
                                            </Badge>
                                        </td>
                                        <td className="py-3 text-sm text-slate-500">
                                            {new Date(rfq.createdAt).toLocaleDateString("tr-TR")}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    );
}
