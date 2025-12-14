"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { Table, TableContainer, THead, TBody, TR, TH, TD } from "@/components/ui/Table";
import { useToast } from "@/components/ui/Toast";

function TeslimatOlusturContent() {
    const { show } = useToast();
    const searchParams = useSearchParams();
    const router = useRouter();
    const orderId = searchParams.get("orderId");
    const initialOrderNo = searchParams.get("orderNo");

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [order, setOrder] = useState<any>(null);
    const [deliveredTotals, setDeliveredTotals] = useState<Record<string, number>>({});
    const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
    const [formCode, setFormCode] = useState("");
    const [inputs, setInputs] = useState<Record<string, string>>({});

    useEffect(() => {
        if (orderId) loadOrderAndDeliveries(orderId);
        else if (initialOrderNo) findOrderByBarcode(initialOrderNo);
    }, [orderId, initialOrderNo]);

    const findOrderByBarcode = async (barcode: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/siparis?q=${encodeURIComponent(barcode)}&pageSize=1`);
            if (res.ok) {
                const data = await res.json();
                const found = data.items?.find((i: any) => i.barcode === barcode);
                if (found) loadOrderAndDeliveries(found.id);
                else show({ title: "Hata", description: "Sipariş bulunamadı.", variant: "error" });
            }
        } catch { show({ title: "Hata", description: "Sipariş aranırken hata oluştu.", variant: "error" }); }
        finally { setLoading(false); }
    };

    const loadOrderAndDeliveries = async (id: string) => {
        setLoading(true);
        try {
            const resOrder = await fetch(`/api/siparis/${id}`);
            if (!resOrder.ok) throw new Error("Sipariş verisi alınamadı");
            const orderData = await resOrder.json();
            setOrder(orderData);

            const resDel = await fetch(`/api/teslimat?orderId=${id}`);
            if (resDel.ok) {
                const delData = await resDel.json();
                const totals: Record<string, number> = {}; // Declare outside to use later
                if (delData) {
                    for (const d of delData) {
                        for (const item of d.items) {
                            totals[item.orderItemId] = (totals[item.orderItemId] || 0) + Number(item.quantity);
                        }
                    }
                    setDeliveredTotals(totals);
                    const count = delData.length;
                    setFormCode(`IRS-${orderData.barcode}${count > 0 ? `-${count + 1}` : ""}`);
                } else {
                    setFormCode(`IRS-${orderData.barcode}`);
                }

                // Auto-fill inputs with remaining quantities
                const defaultInputs: Record<string, string> = {};
                const currentTotals = totals || {}; // Use the calculated totals
                if (orderData.items) {
                    for (const item of orderData.items) {
                        const total = Number(item.quantity);
                        const delivered = currentTotals[item.id] || 0;
                        const rem = Math.max(0, total - delivered);
                        if (rem > 0) defaultInputs[item.id] = rem.toString();
                    }
                }
                setInputs(defaultInputs);
            }

        } catch (e: any) { show({ title: "Hata", description: e.message, variant: "error" }); }
        finally { setLoading(false); }
    };

    const getRemaining = (itemId: string, totalQty: number) => {
        const delivered = deliveredTotals[itemId] || 0;
        return Math.max(0, totalQty - delivered);
    };

    const handleSubmit = async () => {
        if (!order) return;
        setSubmitting(true);
        try {
            const itemsPayload = Object.entries(inputs)
                .map(([oId, qty]) => ({ orderItemId: oId, quantity: Number(qty) }))
                .filter(x => x.quantity > 0);

            if (itemsPayload.length === 0) {
                show({ title: "Uyarı", description: "En az bir ürün için miktar girmelisiniz.", variant: "warning" });
                setSubmitting(false);
                return;
            }

            const res = await fetch("/api/teslimat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId: order.id, code: formCode, date: formDate, items: itemsPayload })
            });

            if (res.ok) {
                show({ title: "Başarılı", description: "Teslimat kaydı oluşturuldu.", variant: "success" });
                router.push(`/siparis/detay/${order.id}?tab=teslimat`);
            } else {
                const err = await res.json();
                show({ title: "Hata", description: err.message || "Kaydedilemedi", variant: "error" });
            }
        } catch (e) { show({ title: "Hata", description: "Sunucu hatası", variant: "error" }); }
        finally { setSubmitting(false); }
    };

    if (loading && !order) return <div className="p-8 text-center text-slate-500">Yükleniyor...</div>;

    return (
        <section className="space-y-4 max-w-5xl mx-auto">
            <PageHeader
                title="Yeni Teslimat Girişi"
                description={order ? `${order.barcode} nolu siparişe istinaden` : "Sipariş bilgileri yükleniyor..."}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Form Info */}
                    <Card className="p-4">
                        <h3 className="text-sm font-semibold text-slate-700 mb-3">Teslimat Bilgileri</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <Input label="İrsaliye No" value={formCode} onChange={(e) => setFormCode(e.target.value)} placeholder="IRS-2024-001" />
                            <Input type="date" label="Tarih" value={formDate} onChange={(e) => setFormDate(e.target.value)} />
                        </div>
                    </Card>

                    {/* Items Table */}
                    {order && (
                        <Card className="p-0 overflow-hidden">
                            <div className="px-4 py-2 bg-slate-50 border-b border-slate-100">
                                <h3 className="text-sm font-semibold text-slate-700">Teslim Edilecek Ürünler</h3>
                            </div>
                            <TableContainer>
                                <Table>
                                    <THead>
                                        <TR>
                                            <TH>Ürün</TH>
                                            <TH className="text-right">Sipariş</TH>
                                            <TH className="text-right">Teslim</TH>
                                            <TH className="text-right">Kalan</TH>
                                            <TH className="text-right w-28">Miktar</TH>
                                        </TR>
                                    </THead>
                                    <TBody>
                                        {order.items.map((item: any) => {
                                            const total = Number(item.quantity);
                                            const rem = getRemaining(item.id, total);
                                            return (
                                                <TR key={item.id}>
                                                    <TD className="font-medium text-slate-700">{item.name}</TD>
                                                    <TD className="text-right text-slate-500">{total.toLocaleString("tr-TR")}</TD>
                                                    <TD className="text-right text-slate-500">{deliveredTotals[item.id] || 0}</TD>
                                                    <TD className="text-right font-bold text-blue-600">{rem.toLocaleString("tr-TR")}</TD>
                                                    <TD>
                                                        <Input
                                                            type="number"
                                                            className="text-right h-8"
                                                            min={0}
                                                            placeholder="0"
                                                            value={inputs[item.id] || ""}
                                                            onChange={(e) => setInputs(p => ({ ...p, [item.id]: e.target.value }))}
                                                        />
                                                    </TD>
                                                </TR>
                                            );
                                        })}
                                    </TBody>
                                </Table>
                            </TableContainer>
                        </Card>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                    <Card className="p-4">
                        <h3 className="text-sm font-semibold text-slate-700 mb-3">İşlemler</h3>
                        <Button variant="primary" className="w-full mb-2" onClick={handleSubmit} loading={submitting} disabled={!order || submitting}>
                            Teslimatı Kaydet
                        </Button>
                        <Button variant="outline" className="w-full" onClick={() => router.back()}>İptal</Button>
                    </Card>

                    {order && (
                        <Card className="p-4 bg-slate-50">
                            <h3 className="text-sm font-semibold text-slate-700 mb-2">Sipariş Özeti</h3>
                            <div className="text-sm space-y-1.5">
                                <div className="flex justify-between"><span className="text-slate-500">Tedarikçi:</span><span className="font-medium">{order.supplierName}</span></div>
                                <div className="flex justify-between"><span className="text-slate-500">Şirket:</span><span className="font-medium">{order.companyName}</span></div>
                                <div className="flex justify-between"><span className="text-slate-500">Tarih:</span><span className="font-medium">{new Date(order.date).toLocaleDateString("tr-TR")}</span></div>
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </section>
    );
}

// Wrapper with Suspense for useSearchParams
export default function TeslimatOlusturPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-slate-500">Yükleniyor...</div>}>
            <TeslimatOlusturContent />
        </Suspense>
    );
}
