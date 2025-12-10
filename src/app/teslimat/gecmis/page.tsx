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

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`İrsaliye: ${selectedDelivery?.code}`} size="lg">
                {selectedDelivery && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm bg-slate-50 p-3 rounded-lg">
                            <div><span className="block text-slate-400 text-xs">Sipariş</span><span className="font-medium">{selectedDelivery.order.barcode}</span></div>
                            <div><span className="block text-slate-400 text-xs">Tedarikçi</span><span className="font-medium">{selectedDelivery.order.supplier.name}</span></div>
                            <div><span className="block text-slate-400 text-xs">Tarih</span><span className="font-medium">{new Date(selectedDelivery.date).toLocaleDateString("tr-TR")}</span></div>
                            <div><span className="block text-slate-400 text-xs">Durum</span><Badge variant={statusVariant(selectedDelivery.status)}>{selectedDelivery.status}</Badge></div>
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
                    </div>
                )}
            </Modal>
        </section>
    );
}
