"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";

type OrderItem = {
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
    unit: string;
};

type Order = {
    id: string;
    barcode: string;
    refNumber: string | null;
    status: string;
    company: string;
    currency: string;
    total: number;
    estimatedDelivery: string | null;
    createdAt: string;
    itemCount: number;
    items: OrderItem[];
    lastDelivery: { code: string; status: string; date: string } | null;
};

const statusColors: Record<string, string> = {
    "Açık": "bg-blue-100 text-blue-700",
    "Onaylandı": "bg-sky-100 text-blue-700",
    "Sevk Edildi": "bg-sky-100 text-amber-700",
    "Tamamlandı": "bg-green-100 text-green-700",
    "İptal": "bg-red-100 text-red-700",
};

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

    useEffect(() => {
        async function loadOrders() {
            try {
                const res = await fetch("/api/portal/orders");
                if (res.ok) {
                    const data = await res.json();
                    setOrders(data.orders || []);
                }
            } catch (err) {
                console.error("Failed to load orders", err);
            } finally {
                setLoading(false);
            }
        }
        loadOrders();
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

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Siparişlerim</h1>
                    <p className="text-slate-500 text-sm mt-1">Kurumunuza ait tüm siparişlerinizi görüntüleyin ve takip edin.</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Toplam: {orders.length} Sipariş
                    </span>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                {loading ? (
                    <div className="p-12 flex flex-col items-center justify-center">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
                        <p className="text-slate-400 text-sm">Siparişler yükleniyor...</p>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="p-12 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-700 mb-2">Henüz Sipariş Yok</h3>
                        <p className="text-sm text-slate-400 max-w-sm">
                            Kurumunuz henüz size sipariş vermemiş. Açık taleplere teklif vererek sipariş alabilirsiniz.
                        </p>
                        <Link href="/portal/rfq" className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30">
                            <span className="text-white text-sm font-bold">Açık Talepleri İncele</span>
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Sipariş No</th>
                                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Kurum</th>
                                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Durum</th>
                                    <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Tutar</th>
                                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Teslimat</th>
                                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Tarih</th>
                                    <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Detay</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {orders.map((order) => (
                                    <React.Fragment key={order.id}>
                                        <tr className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-mono text-sm font-semibold text-slate-800">{order.barcode}</span>
                                                    {order.refNumber && (
                                                        <span className="text-xs text-slate-400">Ref: {order.refNumber}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-slate-700">{order.company}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${statusColors[order.status] || "bg-slate-100 text-slate-700"}`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="font-semibold text-slate-800">{formatCurrency(order.total, order.currency)}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {order.estimatedDelivery ? (
                                                    <span className="text-sm text-slate-600">{formatDate(order.estimatedDelivery)}</span>
                                                ) : (
                                                    <span className="text-xs text-slate-400 italic">Belirtilmemiş</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-slate-500">{formatDate(order.createdAt)}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                                                    className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                                                >
                                                    <svg className={`w-5 h-5 text-slate-400 transition-transform ${expandedOrder === order.id ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                        {/* Expanded Items Row */}
                                        {expandedOrder === order.id && (
                                            <tr>
                                                <td colSpan={7} className="px-6 py-4 bg-slate-50/70">
                                                    <div className="space-y-3">
                                                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kalemler ({order.itemCount})</h4>
                                                        <div className="grid gap-2">
                                                            {order.items.map((item) => (
                                                                <div key={item.id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-100">
                                                                    <div className="flex-1">
                                                                        <span className="text-sm font-medium text-slate-700">{item.name}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-6 text-sm">
                                                                        <span className="text-slate-500">{item.quantity} {item.unit}</span>
                                                                        <span className="font-semibold text-slate-700">{formatCurrency(item.unitPrice, order.currency)}</span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        {order.lastDelivery && (
                                                            <div className="mt-4 p-3 bg-sky-50 rounded-xl border border-sky-100">
                                                                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">Son Teslimat</p>
                                                                <p className="text-sm text-sky-800">
                                                                    {order.lastDelivery.code} - {formatDate(order.lastDelivery.date)} ({order.lastDelivery.status})
                                                                </p>
                                                            </div>
                                                        )}
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
