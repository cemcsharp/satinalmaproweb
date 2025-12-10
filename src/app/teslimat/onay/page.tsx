
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
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

    // Modal
    const [selectedDelivery, setSelectedDelivery] = useState<DeliveryReceipt | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchDeliveries();
    }, []);

    const fetchDeliveries = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/teslimat?status=pending_verification");
            if (res.ok) {
                const data = await res.json();
                setDeliveries(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
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
                show({
                    title: "Başarılı",
                    description: `Teslimat ${status === "approved" ? "onaylandı" : "reddedildi"}.`,
                    variant: "success"
                });
                setIsModalOpen(false);
                fetchDeliveries(); // Refresh list
            } else {
                throw new Error("İşlem başarısız");
            }
        } catch (e) {
            show({ title: "Hata", description: "Bir hata oluştu.", variant: "error" });
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <PageHeader
                title="Onay Bekleyenler"
                description="Dış kaynaklardan veya mobilden gelen onay bekleyen teslimatlar."
            />

            <Card className="p-0 overflow-hidden">
                <TableContainer>
                    <Table>
                        <THead>
                            <TR>
                                <TH>İrsaliye No</TH>
                                <TH>Sipariş Kodu</TH>
                                <TH>Tedarikçi</TH>
                                <TH>Teslim Alan</TH>
                                <TH>Tarih</TH>
                                <TH className="text-right">İşlem</TH>
                            </TR>
                        </THead>
                        <TBody>
                            {loading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <TR key={i}>
                                        <TD colSpan={6}><Skeleton className="h-8 w-full" /></TD>
                                    </TR>
                                ))
                            ) : deliveries.length === 0 ? (
                                <TR>
                                    <TD colSpan={6} className="text-center py-8 text-slate-500">
                                        Onay bekleyen teslimat bulunmamaktadır.
                                    </TD>
                                </TR>
                            ) : deliveries.map((d) => (
                                <TR key={d.id}>
                                    <TD className="font-medium text-slate-900">{d.code || "-"}</TD>
                                    <TD>{d.order?.barcode}</TD>
                                    <TD>{d.order?.supplier?.name}</TD>
                                    <TD>
                                        <div className="flex flex-col">
                                            <span>{d.receiverName || "Bilinmiyor"}</span>
                                            <span className="text-xs text-slate-500">
                                                {d.receiverUnit?.label} {d.receiverEmail && `(${d.receiverEmail})`}
                                            </span>
                                        </div>
                                    </TD>
                                    <TD className="text-slate-500">{new Date(d.date).toLocaleDateString("tr-TR")}</TD>
                                    <TD className="text-right">
                                        <Button size="sm" onClick={() => handleOpenReview(d)}>
                                            İncele
                                        </Button>
                                    </TD>
                                </TR>
                            ))}
                        </TBody>
                    </Table>
                </TableContainer>
            </Card>

            {/* Review Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={`Teslimat İnceleme: ${selectedDelivery?.code}`}
                size="lg"
            >
                {selectedDelivery && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded">
                            <div>
                                <span className="block text-slate-500">Sipariş</span>
                                <span className="font-medium">{selectedDelivery.order.barcode}</span>
                            </div>
                            <div>
                                <span className="block text-slate-500">Tedarikçi</span>
                                <span className="font-medium">{selectedDelivery.order.supplier.name}</span>
                            </div>
                            <div>
                                <span className="block text-slate-500">Teslim Eden</span>
                                <span className="font-medium">{selectedDelivery.receiverName}</span>
                            </div>
                            <div>
                                <span className="block text-slate-500">Birim/Email</span>
                                <span className="font-medium">{selectedDelivery.receiverUnit?.label} - {selectedDelivery.receiverEmail}</span>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold mb-3">Teslimat Kalemleri</h4>
                            <div className="border rounded-lg overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-100 text-slate-700">
                                        <tr>
                                            <th className="p-3">Ürün</th>
                                            <th className="p-3 text-right">Miktar</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {selectedDelivery.items.map((item: any) => (
                                            <tr key={item.id}>
                                                <td className="p-3">{item.orderItem?.name || "Ürün silinmiş"}</td>
                                                <td className="p-3 text-right font-medium">{item.quantity} {item.orderItem?.unit?.label}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button variant="outline" onClick={() => handleAction("rejected")} disabled={processing} className="text-red-600 hover:text-red-700 border-red-200">
                                Reddet
                            </Button>
                            <Button variant="primary" onClick={() => handleAction("approved")} disabled={processing}>
                                {processing ? "İşleniyor..." : "Onayla ve Stoğa Al"}
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
