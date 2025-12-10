"use client";
import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { Table, TableContainer, THead, TBody, TR, TH, TD } from "@/components/ui/Table";
import Badge from "@/components/ui/Badge";
import PageHeader from "@/components/ui/PageHeader";
import Modal from "@/components/ui/Modal";
import DeliverySection from "@/components/DeliverySection";
import Skeleton from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

type OrderSummary = {
    id: string;
    barcode: string;
    date: string;
    status: string;
    supplierName?: string;
    companyName?: string;
    items?: any[];
};

export default function PendingDeliveriesPage() {
    const { show } = useToast();
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState<OrderSummary[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loadingDetails, setLoadingDetails] = useState(false);

    useEffect(() => { fetchOrders(); }, []);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/siparis?mode=pending-delivery");
            if (res.ok) setOrders((await res.json()).items || []);
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    const handleOpenDelivery = async (orderId: string) => {
        setLoadingDetails(true);
        setIsModalOpen(true);
        try {
            const res = await fetch(`/api/siparis/${orderId}`);
            if (res.ok) setSelectedOrder(await res.json());
            else { show({ title: "Hata", description: "Sipariş detayları alınamadı.", variant: "error" }); setIsModalOpen(false); }
        } catch (e) { show({ title: "Hata", description: "Bir hata oluştu.", variant: "error" }); setIsModalOpen(false); }
        finally { setLoadingDetails(false); }
    };

    return (
        <section className="space-y-4">
            <PageHeader
                title="Bekleyen Teslimatlar"
                description="Depoya ulaşması beklenen veya kısmi teslimat yapılan siparişler."
            />

            <TableContainer>
                <Table>
                    <THead>
                        <TR>
                            <TH>Sipariş Kodu</TH>
                            <TH>Tedarikçi</TH>
                            <TH>Tarih</TH>
                            <TH>Durum</TH>
                            <TH className="text-right">İşlem</TH>
                        </TR>
                    </THead>
                    <TBody>
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TR key={i}><TD colSpan={5}><Skeleton className="h-6 w-full" /></TD></TR>
                            ))
                        ) : orders.length === 0 ? (
                            <TR><TD colSpan={5} className="text-center py-6 text-slate-500">Bekleyen teslimat yok.</TD></TR>
                        ) : orders.map((order) => (
                            <TR key={order.id} className="hover:bg-slate-50">
                                <TD>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-slate-800">{order.barcode}</span>
                                        <span className="text-xs text-slate-400">{order.companyName}</span>
                                    </div>
                                </TD>
                                <TD className="text-slate-600">{order.supplierName || "-"}</TD>
                                <TD className="text-slate-500 text-sm">{new Date(order.date).toLocaleDateString("tr-TR")}</TD>
                                <TD><Badge variant={order.status === "Kısmi Teslimat" ? "warning" : "info"}>{order.status}</Badge></TD>
                                <TD className="text-right">
                                    <Button size="sm" variant="outline" onClick={() => handleOpenDelivery(order.id)}>Teslim Al</Button>
                                </TD>
                            </TR>
                        ))}
                    </TBody>
                </Table>
            </TableContainer>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Teslimat: ${selectedOrder?.barcode || ''}`} size="2xl">
                {loadingDetails ? (
                    <div className="p-6 text-center text-slate-500">Yükleniyor...</div>
                ) : selectedOrder ? (
                    <DeliverySection orderId={selectedOrder.id} orderBarcode={selectedOrder.barcode} orderItems={selectedOrder.items} onUpdate={fetchOrders} />
                ) : null}
            </Modal>
        </section>
    );
}
