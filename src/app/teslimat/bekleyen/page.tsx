
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
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
    const router = useRouter();
    const { show } = useToast();
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState<OrderSummary[]>([]);

    // Modal State
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loadingDetails, setLoadingDetails] = useState(false);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/siparis?mode=pending-delivery");
            if (res.ok) {
                const data = await res.json();
                setOrders(data.items || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDelivery = async (orderId: string) => {
        setLoadingDetails(true);
        setIsModalOpen(true);
        try {
            // Fetch full details including item IDs which might be missing in list view
            // Using the public delivery endpoint logic or the detail endpoint
            // Let's use detail endpoint
            const res = await fetch(`/api/siparis/${orderId}`);
            if (res.ok) {
                const data = await res.json();
                setSelectedOrder(data);
            } else {
                show({ title: "Hata", description: "Sipariş detayları alınamadı.", variant: "error" });
                setIsModalOpen(false);
            }
        } catch (e) {
            show({ title: "Hata", description: "Bir hata oluştu.", variant: "error" });
            setIsModalOpen(false);
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleDeliveryUpdate = () => {
        // Refresh list if status changes (e.g. becomes fully delivered)
        fetchOrders();
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <PageHeader
                title="Bekleyen Teslimatlar"
                description="Depoya ulaşması beklenen veya kısmi teslimat yapılan siparişler."
            />

            <Card className="p-0 overflow-hidden">
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
                                    <TR key={i}>
                                        <TD colSpan={5}><Skeleton className="h-8 w-full" /></TD>
                                    </TR>
                                ))
                            ) : orders.length === 0 ? (
                                <TR>
                                    <TD colSpan={5} className="text-center py-8 text-slate-500">
                                        Bekleyen teslimat bulunmamaktadır.
                                    </TD>
                                </TR>
                            ) : orders.map((order) => (
                                <TR key={order.id}>
                                    <TD className="font-medium">
                                        <div className="flex flex-col">
                                            <span className="text-slate-900">{order.barcode}</span>
                                            <span className="text-xs text-slate-500">{order.companyName}</span>
                                        </div>
                                    </TD>
                                    <TD className="text-slate-700">{order.supplierName || "-"}</TD>
                                    <TD className="text-slate-500">{new Date(order.date).toLocaleDateString("tr-TR")}</TD>
                                    <TD>
                                        <Badge variant={order.status === "Kısmi Teslimat" ? "warning" : "success"}>
                                            {order.status}
                                        </Badge>
                                    </TD>
                                    <TD className="text-right">
                                        <Button size="sm" onClick={() => handleOpenDelivery(order.id)}>
                                            Teslim Al / İncele
                                        </Button>
                                    </TD>
                                </TR>
                            ))}
                        </TBody>
                    </Table>
                </TableContainer>
            </Card>

            {/* Delivery Entry Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={`Teslimat Bilgileri: ${selectedOrder?.barcode || ''}`}
                size="2xl"
            >
                {loadingDetails ? (
                    <div className="p-8 text-center text-slate-500">Yükleniyor...</div>
                ) : selectedOrder ? (
                    <DeliverySection
                        orderId={selectedOrder.id}
                        orderBarcode={selectedOrder.barcode}
                        orderItems={selectedOrder.items}
                        onUpdate={handleDeliveryUpdate}
                    />
                ) : null}
            </Modal>
        </div>
    );
}
