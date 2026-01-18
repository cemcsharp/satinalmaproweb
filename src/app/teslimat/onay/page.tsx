"use client";
import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { Table, TableContainer, THead, TBody, TR, TH, TD } from "@/components/ui/Table";
import Badge from "@/components/ui/Badge";
import PageHeader from "@/components/ui/PageHeader";
import Modal from "@/components/ui/Modal";
import Skeleton from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

type DeliveryReceipt = {
    id: string;
    code: string;
    date: string;
    status: string;
    receiverName?: string;
    receiverUnit?: { label: string };
    receiverEmail?: string;
    order: {
        barcode: string;
        supplier: { name: string };
        company: { name: string };
    };
    items: any[];
};

export default function DeliveryApprovalPage() {
    const { show } = useToast();
    const [loading, setLoading] = useState(true);
    const [deliveries, setDeliveries] = useState<DeliveryReceipt[]>([]);
    const [selectedDelivery, setSelectedDelivery] = useState<DeliveryReceipt | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [processing, setProcessing] = useState(false);

    useEffect(() => { fetchDeliveries(); }, []);

    const fetchDeliveries = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/teslimat?status=pending,pending_verification");
            if (res.ok) setDeliveries(await res.json());
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    const handleOpenReview = (delivery: DeliveryReceipt) => {
        // Initialize approvedQuantity with quantity for easier editing (default: full accept)
        const d = {
            ...delivery,
            items: delivery.items.map(i => ({
                ...i,
                approvedQuantity: i.approvedQuantity ? i.approvedQuantity : i.quantity
            }))
        };
        setSelectedDelivery(d);
        setIsModalOpen(true);
    };

    const handleQuantityChange = (itemId: string, val: string) => {
        if (!selectedDelivery) return;
        const newItems = selectedDelivery.items.map(i =>
            i.id === itemId ? { ...i, approvedQuantity: val } : i
        );
        setSelectedDelivery({ ...selectedDelivery, items: newItems });
    };

    const handleAction = async (status: "approved" | "rejected") => {
        if (!selectedDelivery) return;
        setProcessing(true);
        try {
            const res = await fetch(`/api/teslimat/${selectedDelivery.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    status,
                    updatedItems: status === "approved" ? selectedDelivery.items.map(i => ({
                        id: i.id,
                        approvedQuantity: i.approvedQuantity !== undefined ? i.approvedQuantity : i.quantity
                    })) : undefined
                })
            });
            if (res.ok) {
                show({ title: "Başarılı", description: `Teslimat ${status === "approved" ? "onaylandı" : "reddedildi"}.`, variant: "success" });
                setIsModalOpen(false);
                fetchDeliveries();
            } else { throw new Error("İşlem başarısız"); }
        } catch (e) {
            show({ title: "Hata", description: "Bir hata oluştu.", variant: "error" });
        } finally { setProcessing(false); }
    };

    return (
        <section className="space-y-4">
            <PageHeader
                title="Onay Bekleyenler"
                description="Birim onayı bekleyen teslimatlar."
            />

            <TableContainer>
                <Table>
                    <THead>
                        <TR>
                            <TH>İrsaliye No</TH>
                            <TH>Sipariş</TH>
                            <TH>Tedarikçi</TH>
                            <TH>Teslim Alan / Bildiren</TH>
                            <TH>Tarih</TH>
                            <TH className="text-right">İşlem</TH>
                        </TR>
                    </THead>
                    <TBody>
                        {loading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <TR key={i}><TD colSpan={6}><Skeleton className="h-6 w-full" /></TD></TR>
                            ))
                        ) : deliveries.length === 0 ? (
                            <TR><TD colSpan={6} className="text-center py-6 text-slate-500">Onay bekleyen teslimat yok.</TD></TR>
                        ) : deliveries.map((d) => (
                            <TR key={d.id} className="hover:bg-slate-50">
                                <TD className="font-medium text-slate-800">{d.code || "-"}</TD>
                                <TD className="text-slate-600">{d.order?.barcode}</TD>
                                <TD className="text-slate-600">{d.order?.supplier?.name}</TD>
                                <TD>
                                    <div className="flex flex-col">
                                        <span className="text-sm">{d.receiverName || "Bilinmiyor"}</span>
                                        <span className="text-xs text-slate-400">{d.receiverUnit?.label}</span>
                                    </div>
                                </TD>
                                <TD className="text-slate-500 text-sm">{new Date(d.date).toLocaleDateString("tr-TR")}</TD>
                                <TD className="text-right">
                                    <Button size="sm" variant="outline" onClick={() => handleOpenReview(d)}>İncele</Button>
                                </TD>
                            </TR>
                        ))}
                    </TBody>
                </Table>
            </TableContainer>

            {/* Modern Review Modal */}
            {isModalOpen && selectedDelivery && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-sky-500 to-orange-500 px-6 py-5 text-white relative">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">Teslimat Onayı</h3>
                                    <p className="text-amber-100 text-sm">İrsaliye: {selectedDelivery.code}</p>
                                </div>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-5">
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
                                    <p className="font-semibold text-slate-800">{selectedDelivery.receiverName}</p>
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
                                                    <td className="px-4 py-3 text-right font-bold text-slate-900">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <span className="text-xs text-slate-400 mr-1">Bildirilen: {item.quantity}</span>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                step="0.01"
                                                                className="w-24 text-right border border-slate-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                                value={item.approvedQuantity}
                                                                onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                                            />
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-slate-50 border-t border-slate-200">
                                            <tr>
                                                <td className="px-4 py-3 font-semibold text-slate-600">Toplam Kalem</td>
                                                <td className="px-4 py-3 text-right font-bold text-blue-600">{selectedDelivery.items.length} ürün</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>

                            {/* Warning */}
                            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                <div>
                                    <p className="text-sm font-medium text-blue-800">Onay Gerekiyor</p>
                                    <p className="text-xs text-amber-700 mt-0.5">Bu teslimat dış kaynak tarafından gönderilmiştir. Onayladığınızda stok güncellenir.</p>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-between items-center">
                            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
                                İptal
                            </Button>
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => handleAction("rejected")}
                                    disabled={processing}
                                    className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                                >
                                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    Reddet
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={() => handleAction("approved")}
                                    disabled={processing}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    {processing ? "İşleniyor..." : "Onayla ve Stoğa Al"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
