
"use client";
import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import { Table, TableContainer, THead, TBody, TR, TH, TD } from "@/components/ui/Table";
import Badge from "@/components/ui/Badge";
import PageHeader from "@/components/ui/PageHeader";
import Modal from "@/components/ui/Modal";
import Skeleton from "@/components/ui/Skeleton";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

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

    // Filters
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    // Modal
    const [selectedDelivery, setSelectedDelivery] = useState<DeliveryReceipt | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchDeliveries();
    }, []);

    const fetchDeliveries = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (dateFrom) params.append("dateFrom", dateFrom);
            if (dateTo) params.append("dateTo", dateTo);

            const res = await fetch(`/api/teslimat?${params.toString()}`);
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

    const handleOpenDetail = (delivery: DeliveryReceipt) => {
        setSelectedDelivery(delivery);
        setIsModalOpen(true);
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <PageHeader
                title="Teslimat Geçmişi"
                description="Tüm geçmiş irsaliye ve teslimat kayıtları."
            />

            <Card className="p-4">
                <div className="flex gap-4 items-end mb-4">
                    <Input type="date" label="Başlangıç Tarihi" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                    <Input type="date" label="Bitiş Tarihi" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                    <Button onClick={fetchDeliveries}>Filtrele</Button>
                </div>

                <TableContainer>
                    <Table>
                        <THead>
                            <TR>
                                <TH>İrsaliye No</TH>
                                <TH>Sipariş Kodu</TH>
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
                                    <TR key={i}>
                                        <TD colSpan={7}><Skeleton className="h-8 w-full" /></TD>
                                    </TR>
                                ))
                            ) : deliveries.length === 0 ? (
                                <TR>
                                    <TD colSpan={7} className="text-center py-8 text-slate-500">
                                        Kayıt bulunamadı.
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
                                            {d.receiverUnit && <span className="text-xs text-slate-500">{d.receiverUnit.label}</span>}
                                        </div>
                                    </TD>
                                    <TD className="text-slate-500">{new Date(d.date).toLocaleDateString("tr-TR")}</TD>
                                    <TD>
                                        <Badge variant={d.status === "approved" ? "success" : d.status === "rejected" ? "error" : "warning"}>
                                            {d.status === "approved" ? "Onaylandı" : d.status === "rejected" ? "Reddedildi" : "Onay Bekliyor"}
                                        </Badge>
                                    </TD>
                                    <TD className="text-right">
                                        <Button size="sm" variant="ghost" onClick={() => handleOpenDetail(d)}>
                                            Detay
                                        </Button>
                                    </TD>
                                </TR>
                            ))}
                        </TBody>
                    </Table>
                </TableContainer>
            </Card>

            {/* Detail Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={`İrsaliye Detayı: ${selectedDelivery?.code}`}
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
                                <span className="block text-slate-500">Tarih</span>
                                <span className="font-medium">{new Date(selectedDelivery.date).toLocaleDateString("tr-TR")}</span>
                            </div>
                            <div>
                                <span className="block text-slate-500">Durum</span>
                                <Badge variant={selectedDelivery.status === "approved" ? "success" : "warning"}>
                                    {selectedDelivery.status}
                                </Badge>
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
                                                <td className="p-3 text-right font-medium">{item.quantity}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
