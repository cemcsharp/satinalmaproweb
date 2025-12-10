"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Skeleton from "@/components/ui/Skeleton";
import { TableContainer, Table, THead, TBody, TR, TH, TD } from "@/components/ui/Table";

type OrderItem = {
    id: string;
    barcode: string;
    date: string;
    status: string;
    supplierName: string;
    total: number;
    hasEvaluation: boolean;
};

export default function BirimDegerlendirmelerPage() {
    const { data: session } = useSession();
    const [orders, setOrders] = useState<OrderItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"pending" | "completed">("pending");

    useEffect(() => {
        async function fetchOrders() {
            try {
                // Fetch orders that need evaluation (Faturalandı status)
                const res = await fetch("/api/siparis?reviewPending=1&pageSize=50");
                if (!res.ok) throw new Error("Siparişler alınamadı");
                const data = await res.json();
                setOrders(data.items || []);
            } catch (e: any) {
                setError(e.message || "Hata oluştu");
            } finally {
                setLoading(false);
            }
        }
        fetchOrders();
    }, []);

    const pendingOrders = orders.filter(o => !o.hasEvaluation);
    const completedOrders = orders.filter(o => o.hasEvaluation);
    const pendingCount = pendingOrders.length;
    const completedCount = completedOrders.length;
    const displayedOrders = activeTab === "pending" ? pendingOrders : completedOrders;

    return (
        <section className="space-y-6">
            <PageHeader
                title="Değerlendirmelerim"
                description="Tedarikçi değerlendirmelerinizi buradan yönetebilirsiniz."
                variant="default"
            />

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                            <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-slate-800">{loading ? "-" : pendingCount}</div>
                            <div className="text-sm text-slate-500">Bekleyen</div>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                            <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-slate-800">{loading ? "-" : completedCount}</div>
                            <div className="text-sm text-slate-500">Tamamlanan</div>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-slate-800">{loading ? "-" : orders.length}</div>
                            <div className="text-sm text-slate-500">Toplam</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            {/* Tab Buttons */}
            <div className="flex gap-2 p-1 bg-slate-100 rounded-lg w-fit">
                <button
                    onClick={() => setActiveTab("pending")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "pending"
                        ? "bg-white text-amber-700 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                        }`}
                >
                    Bekleyenler ({loading ? "-" : pendingCount})
                </button>
                <button
                    onClick={() => setActiveTab("completed")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "completed"
                        ? "bg-white text-emerald-700 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                        }`}
                >
                    Tamamlananlar ({loading ? "-" : completedCount})
                </button>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200">
                    <h3 className="font-semibold text-slate-800">
                        {activeTab === "pending" ? "Değerlendirme Bekleyen Siparişler" : "Tamamlanan Değerlendirmeler"}
                    </h3>
                </div>
                <TableContainer>
                    <Table>
                        <caption className="sr-only">Değerlendirme bekleyen siparişler</caption>
                        <THead>
                            <TR>
                                <TH>Sipariş No</TH>
                                <TH>Tarih</TH>
                                <TH>Tedarikçi</TH>
                                <TH>Tutar</TH>
                                <TH>Durum</TH>
                                <TH>İşlem</TH>
                            </TR>
                        </THead>
                        <TBody>
                            {loading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <TR key={`skeleton-${i}`}>
                                        <TD><Skeleton height={16} /></TD>
                                        <TD><Skeleton height={16} /></TD>
                                        <TD><Skeleton height={16} /></TD>
                                        <TD><Skeleton height={16} /></TD>
                                        <TD><Skeleton height={16} /></TD>
                                        <TD><Skeleton height={16} /></TD>
                                    </TR>
                                ))
                            ) : displayedOrders.length === 0 ? (
                                <TR>
                                    <TD colSpan={6} className="text-center py-8 text-slate-500">
                                        {activeTab === "pending" ? "Değerlendirme bekleyen sipariş bulunmamaktadır." : "Tamamlanan değerlendirme bulunmamaktadır."}
                                    </TD>
                                </TR>
                            ) : (
                                displayedOrders.map((order) => (
                                    <TR key={order.id} className="hover:bg-slate-50">
                                        <TD>
                                            <span className="font-semibold text-slate-700">{order.barcode}</span>
                                        </TD>
                                        <TD>
                                            <span className="text-sm text-slate-600">
                                                {new Date(order.date).toLocaleDateString("tr-TR")}
                                            </span>
                                        </TD>
                                        <TD>
                                            <span className="text-sm text-slate-600">{order.supplierName || "-"}</span>
                                        </TD>
                                        <TD>
                                            <span className="font-medium text-emerald-700">
                                                {order.total?.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL
                                            </span>
                                        </TD>
                                        <TD>
                                            <Badge variant={order.hasEvaluation ? "success" : "warning"}>
                                                {order.hasEvaluation ? "Tamamlandı" : "Bekliyor"}
                                            </Badge>
                                        </TD>
                                        <TD>
                                            {!order.hasEvaluation ? (
                                                <Link href={`/tedarikci/degerlendirme?orderId=${order.id}`}>
                                                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                                        Değerlendir
                                                    </Button>
                                                </Link>
                                            ) : (
                                                <Link href={`/tedarikci/degerlendirme?orderId=${order.id}`}>
                                                    <Button size="sm" variant="outline">
                                                        Görüntüle
                                                    </Button>
                                                </Link>
                                            )}
                                        </TD>
                                    </TR>
                                ))
                            )}
                        </TBody>
                    </Table>
                </TableContainer>
            </div>
        </section>
    );
}
