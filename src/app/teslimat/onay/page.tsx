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
            const res = await fetch("/api/teslimat?status=pending_verification");
            if (res.ok) setDeliveries(await res.json());
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    const handleOpenReview = (delivery: DeliveryReceipt) => {
        setSelectedDelivery(delivery);
        setIsModalOpen(true);
    };

    const handleAction = async (status: "approved" | "rejected") => {
        if (!selectedDelivery) return;
        setProcessing(true);
        try {
            const res = await fetch(`/api/teslimat/${selectedDelivery.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status })
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
                description="Dış kaynaklardan gelen onay bekleyen teslimatlar."
            />

            <TableContainer>
                <Table>
                    <THead>
                        <TR>
                            <TH>İrsaliye No</TH>
                            <TH>Sipariş</TH>
                            <TH>Tedarikçi</TH>
                            <TH>Teslim Alan</TH>
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

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Teslimat: ${selectedDelivery?.code}`} size="lg">
                {selectedDelivery && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm bg-slate-50 p-3 rounded-lg">
                            <div><span className="block text-slate-400 text-xs">Sipariş</span><span className="font-medium">{selectedDelivery.order.barcode}</span></div>
                            <div><span className="block text-slate-400 text-xs">Tedarikçi</span><span className="font-medium">{selectedDelivery.order.supplier.name}</span></div>
                            <div><span className="block text-slate-400 text-xs">Teslim Eden</span><span className="font-medium">{selectedDelivery.receiverName}</span></div>
                            <div><span className="block text-slate-400 text-xs">Birim</span><span className="font-medium">{selectedDelivery.receiverUnit?.label || "-"}</span></div>
                        </div>

                        <div>
                            <h4 className="text-sm font-semibold mb-2">Kalemler</h4>
                            <div className="border rounded-lg overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-100 text-slate-600">
                                        <tr><th className="p-2 text-left">Ürün</th><th className="p-2 text-right">Miktar</th></tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {selectedDelivery.items.map((item: any) => (
                                            <tr key={item.id}><td className="p-2">{item.orderItem?.name || "-"}</td><td className="p-2 text-right font-medium">{item.quantity}</td></tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-3 border-t">
                            <Button variant="outline" onClick={() => handleAction("rejected")} disabled={processing} className="text-red-600 border-red-200 hover:bg-red-50">Reddet</Button>
                            <Button variant="primary" onClick={() => handleAction("approved")} disabled={processing}>{processing ? "İşleniyor..." : "Onayla"}</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </section>
    );
}
