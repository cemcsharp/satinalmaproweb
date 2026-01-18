"use client";
import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { Table, TableContainer, THead, TBody, TR, TH, TD } from "@/components/ui/Table";
import Badge from "@/components/ui/Badge";
import PageHeader from "@/components/ui/PageHeader";
import Modal from "@/components/ui/Modal";
import Skeleton from "@/components/ui/Skeleton";
import Input from "@/components/ui/Input";
import FilterInput from "@/components/ui/FilterInput";

type DeliveryReceipt = {
    id: string;
    code: string;
    date: string;
    status: string;
    receiverName?: string;
    receiverUnit?: { label: string };
    order: {
        barcode: string;
        supplier: { name: string };
        company: { name: string };
    };
    items: any[];
};

export default function DeliveryHistoryPage() {
    const [loading, setLoading] = useState(true);
    const [deliveries, setDeliveries] = useState<DeliveryReceipt[]>([]);
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [selectedDelivery, setSelectedDelivery] = useState<DeliveryReceipt | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => { fetchDeliveries(); }, []);

    const fetchDeliveries = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (dateFrom) params.append("dateFrom", dateFrom);
            if (dateTo) params.append("dateTo", dateTo);
            const res = await fetch(`/api/teslimat?${params.toString()}`);
            if (res.ok) setDeliveries(await res.json());
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    const handleOpenDetail = (delivery: DeliveryReceipt) => {
        setSelectedDelivery(delivery);
        setIsModalOpen(true);
    };

    const statusVariant = (s: string): "success" | "error" | "warning" => {
        if (s === "approved") return "success";
        if (s === "rejected") return "error";
        return "warning";
    };

    return (
        <section className="space-y-4">
            <PageHeader title="Teslimat Geçmişi" description="Tüm geçmiş irsaliye ve teslimat kayıtları." />

            <div className="flex flex-wrap items-end gap-3 p-3 bg-white rounded-lg border border-slate-200">
                <FilterInput type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} placeholder="Başlangıç" aria-label="Başlangıç tarihi" />
                <FilterInput type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} placeholder="Bitiş" aria-label="Bitiş tarihi" />
                <Button size="sm" onClick={fetchDeliveries}>Filtrele</Button>
                {(dateFrom || dateTo) && (
                    <button className="text-xs text-slate-500 hover:text-slate-700" onClick={() => { setDateFrom(""); setDateTo(""); }}>Temizle</button>
                )}
            </div>

            <TableContainer>
                <Table>
                    <THead>
                        <TR>
                            <TH>İrsaliye No</TH>
                            <TH>Sipariş</TH>
                            <TH>Tedarikçi</TH>
                            <TH>Teslim Alan</TH>
                            <TH>Tarih</TH>
                            <TH>Durum</TH>
                            <TH className="text-right">İşlem</TH>
                        </TR>
                    </THead>
                    <TBody>
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TR key={i}><TD colSpan={7}><Skeleton className="h-6 w-full" /></TD></TR>
                            ))
                        ) : deliveries.length === 0 ? (
                            <TR><TD colSpan={7} className="text-center py-6 text-slate-500">Kayıt bulunamadı.</TD></TR>
                        ) : deliveries.map((d) => (
                            <TR key={d.id} className="hover:bg-slate-50">
                                <TD className="font-medium text-slate-800">{d.code || "-"}</TD>
                                <TD className="text-slate-600">{d.order?.barcode}</TD>
                                <TD className="text-slate-600">{d.order?.supplier?.name}</TD>
                                <TD>
                                    <div className="flex flex-col">
                                        <span className="text-sm">{d.receiverName || "Bilinmiyor"}</span>
                                        {d.receiverUnit && <span className="text-xs text-slate-400">{d.receiverUnit.label}</span>}
                                    </div>
                                </TD>
                                <TD className="text-slate-500 text-sm">{new Date(d.date).toLocaleDateString("tr-TR")}</TD>
                                <TD>
                                    <Badge variant={statusVariant(d.status)}>
                                        {d.status === "approved" ? "Onaylandı" : d.status === "rejected" ? "Reddedildi" : "Onay Bekliyor"}
                                    </Badge>
                                </TD>
                                <TD className="text-right">
                                    <Button size="sm" variant="ghost" onClick={() => handleOpenDetail(d)}>Detay</Button>
                                </TD>
                            </TR>
                        ))}
                    </TBody>
                </Table>
            </TableContainer>

            {/* Modern Detail Modal */}
            {isModalOpen && selectedDelivery && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className={`px-6 py-5 text-white relative ${selectedDelivery.status === "approved"
                                ? "bg-gradient-to-r from-green-500 to-sky-600"
                                : selectedDelivery.status === "rejected"
                                    ? "bg-gradient-to-r from-red-500 to-rose-600"
                                    : "bg-gradient-to-r from-slate-600 to-slate-700"
                            }`}>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                                    {selectedDelivery.status === "approved" ? (
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    ) : selectedDelivery.status === "rejected" ? (
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    ) : (
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">İrsaliye Detayı</h3>
                                    <p className="text-white/80 text-sm">{selectedDelivery.code}</p>
                                </div>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-5">
                            {/* Status Badge */}
                            <div className={`flex items-center gap-2 rounded-lg px-4 py-3 ${selectedDelivery.status === "approved"
                                    ? "bg-green-50 border border-green-200"
                                    : selectedDelivery.status === "rejected"
                                        ? "bg-red-50 border border-red-200"
                                        : "bg-amber-50 border border-amber-200"
                                }`}>
                                <svg className={`w-5 h-5 flex-shrink-0 ${selectedDelivery.status === "approved" ? "text-green-600"
                                        : selectedDelivery.status === "rejected" ? "text-red-600"
                                            : "text-blue-600"
                                    }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={
                                        selectedDelivery.status === "approved" ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                            : selectedDelivery.status === "rejected" ? "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                                                : "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                    } />
                                </svg>
                                <div>
                                    <p className={`text-sm font-medium ${selectedDelivery.status === "approved" ? "text-green-800"
                                            : selectedDelivery.status === "rejected" ? "text-red-800"
                                                : "text-blue-800"
                                        }`}>
                                        {selectedDelivery.status === "approved" ? "Onaylandı" : selectedDelivery.status === "rejected" ? "Reddedildi" : "Onay Bekliyor"}
                                    </p>
                                </div>
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-slate-50 rounded-lg p-3">
                                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Sipariş</p>
                                    <p className="font-semibold text-slate-800">{selectedDelivery.order.barcode}</p>
                                </div>
                                <div className="bg-slate-50 rounded-lg p-3">
                                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Tedarikçi</p>
                                    <p className="font-semibold text-slate-800 truncate">{selectedDelivery.order.supplier.name}</p>
                                </div>
                                <div className="bg-slate-50 rounded-lg p-3">
                                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Teslim Alan</p>
                                    <p className="font-semibold text-slate-800">{selectedDelivery.receiverName || "Bilinmiyor"}</p>
                                </div>
                                <div className="bg-slate-50 rounded-lg p-3">
                                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Tarih</p>
                                    <p className="font-semibold text-slate-800">{new Date(selectedDelivery.date).toLocaleDateString("tr-TR")}</p>
                                </div>
                            </div>

                            {/* Items Table */}
                            <div>
                                <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                                    Teslim Edilen Ürünler
                                </h4>
                                <div className="border border-slate-200 rounded-xl overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-100">
                                            <tr>
                                                <th className="px-4 py-3 text-left font-semibold text-slate-600">Ürün</th>
                                                <th className="px-4 py-3 text-right font-semibold text-slate-600">Miktar</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {selectedDelivery.items.map((item: any) => (
                                                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-4 py-3 text-slate-700">{item.orderItem?.name || "-"}</td>
                                                    <td className="px-4 py-3 text-right font-bold text-slate-900">{item.quantity}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100">
                            <Button variant="ghost" className="w-full" onClick={() => setIsModalOpen(false)}>
                                Kapat
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
