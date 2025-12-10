"use client";
import React, { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import { Table, TableContainer, THead, TBody, TR, TH, TD } from "@/components/ui/Table";
import { useToast } from "@/components/ui/Toast";

type DeliverySectionProps = {
    orderId: string;
    orderBarcode: string;
    orderItems: { id: string; name: string; quantity: number | string }[];
    onUpdate?: () => void; // Trigger reload of parent order status
};

export default function DeliverySection({ orderId, orderBarcode, orderItems, onUpdate }: DeliverySectionProps) {
    const { show } = useToast();
    const [deliveries, setDeliveries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form
    const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
    const [formCode, setFormCode] = useState(`IRS-${orderBarcode}`);
    // input quantities: key = orderItemId, value = quantity to deliver
    const [inputs, setInputs] = useState<Record<string, string>>({});

    // Stats
    const [deliveredTotals, setDeliveredTotals] = useState<Record<string, number>>({});

    // Share
    const [token, setToken] = useState<string | null>(null);
    const [showShareModal, setShowShareModal] = useState(false);

    const [shareEmail, setShareEmail] = useState("");
    const [sendingEmail, setSendingEmail] = useState(false);

    const generateToken = async () => {
        try {
            const res = await fetch("/api/teslimat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "create-token", orderId })
            });
            if (res.ok) {
                const data = await res.json();
                setToken(data.token);
                setShowShareModal(true);
            } else {
                show({ title: "Hata", description: "Link oluşturulamadı.", variant: "error" });
            }
        } catch (e) {
            show({ title: "Hata", description: "Link oluşturulamadı.", variant: "error" });
        }
    };

    const sendShareLink = async () => {
        if (!shareEmail) return show({ title: "Hata", description: "E-posta adresi giriniz.", variant: "error" });
        setSendingEmail(true);
        try {
            const res = await fetch("/api/teslimat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "send-email", token, email: shareEmail })
            });

            if (res.ok) {
                show({ title: "Başarılı", description: "E-posta gönderildi.", variant: "success" });
                setShareEmail("");
            } else {
                throw new Error("Gönderilemedi");
            }
        } catch (e) {
            show({ title: "Hata", description: "E-posta gönderilemedi.", variant: "error" });
        } finally {
            setSendingEmail(false);
        }
    };

    const copyLink = () => {
        if (!token) return;
        const url = `${window.location.origin}/teslimat/${token}`;
        navigator.clipboard.writeText(url);
        show({ title: "Kopyalandı", description: "Link panoya kopyalandı.", variant: "success" });
    };

    const loadDeliveries = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/teslimat?orderId=${orderId}`);
            if (res.ok) {
                const data = await res.json();
                setDeliveries(data);

                // Calculate totals
                const totals: Record<string, number> = {};
                for (const d of data) {
                    for (const item of d.items) {
                        totals[item.orderItemId] = (totals[item.orderItemId] || 0) + Number(item.quantity);
                    }
                }
                setDeliveredTotals(totals);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDeliveries();
    }, [orderId]);

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            // Prepare items
            const itemsPayload = Object.entries(inputs)
                .map(([oId, qty]) => ({ orderItemId: oId, quantity: Number(qty) }))
                .filter(x => x.quantity > 0);

            if (itemsPayload.length === 0) {
                show({ title: "Uyarı", description: "En az bir miktar girmelisiniz.", variant: "warning" });
                setSubmitting(false);
                return;
            }

            const res = await fetch("/api/teslimat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    orderId,
                    code: formCode,
                    date: formDate,
                    items: itemsPayload
                })
            });

            if (res.ok) {
                show({ title: "Başarılı", description: "Teslimat fişi oluşturuldu.", variant: "success" });
                setModalOpen(false);
                setInputs({});
                setFormCode("");
                loadDeliveries();
                if (onUpdate) onUpdate();
            } else {
                const err = await res.json();
                show({ title: "Hata", description: err.message || "Kaydedilemedi", variant: "error" });
            }
        } catch (e) {
            show({ title: "Hata", description: "Sunucu hatası", variant: "error" });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Bu teslimat kaydını silmek istediğinize emin misiniz?")) return;
        try {
            const res = await fetch(`/api/teslimat/${id}`, { method: "DELETE" });
            if (res.ok) {
                show({ title: "Silindi", description: "Teslimat kaydı silindi.", variant: "success" });
                loadDeliveries();
                if (onUpdate) onUpdate();
            } else {
                show({ title: "Hata", description: "Silinemedi.", variant: "error" });
            }
        } catch {
            show({ title: "Hata", description: "Sunucu hatası", variant: "error" });
        }
    };

    // Remaining calc helper
    const getRemaining = (itemId: string, totalQty: number) => {
        const delivered = deliveredTotals[itemId] || 0;
        return Math.max(0, totalQty - delivered);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-slate-800">Teslimat Geçmişi</h3>
                <div className="flex gap-2">
                    <Button size="sm" variant="outline" tone="info" onClick={generateToken}>
                        Link Paylaş
                    </Button>
                    <Button onClick={() => setModalOpen(true)} variant="primary">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        Yeni Teslimat Girişi
                    </Button>
                </div>
            </div>

            {deliveries.length === 0 ? (
                <Card className="p-8 text-center text-slate-500">
                    Henüz teslimat girişi yapılmamış.
                </Card>
            ) : (
                <div className="space-y-4">
                    {deliveries.map((d) => (
                        <Card key={d.id} className="p-0 overflow-hidden">
                            <div className="bg-slate-50 border-b border-slate-100 p-3 px-4 flex justify-between items-center">
                                <div className="flex gap-4 text-sm">
                                    <span className="font-bold text-slate-700">{d.code || "İrsaliye No Yok"}</span>
                                    <span className="text-slate-500">{new Date(d.date).toLocaleDateString("tr-TR")}</span>
                                    <span className="text-slate-500">
                                        Teslim Alan: {d.receiverName || d.receiver?.username || d.receiver?.email || "Bilinmiyor"}
                                        {d.receiverUnit && ` (${d.receiverUnit.label})`}
                                    </span>
                                </div>
                                <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(d.id)}>Sil</Button>
                            </div>
                            <TableContainer>
                                <Table>
                                    <THead>
                                        <TR>
                                            <TH className="py-2">Ürün</TH>
                                            <TH className="py-2 text-right">Miktar</TH>
                                        </TR>
                                    </THead>
                                    <TBody>
                                        {d.items.map((item: any) => (
                                            <TR key={item.id}>
                                                <TD className="py-2 text-sm">{item.orderItem?.name}</TD>
                                                <TD className="py-2 text-right font-medium">{Number(item.quantity).toLocaleString("tr-TR")}</TD>
                                            </TR>
                                        ))}
                                    </TBody>
                                </Table>
                            </TableContainer>
                        </Card>
                    ))}
                </div>
            )}


            {/* Share Modal */}
            {
                showShareModal && token && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <Card className="w-full max-w-md p-6 relative bg-white">
                            <button
                                onClick={() => setShowShareModal(false)}
                                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>

                            <h3 className="text-lg font-bold mb-4">Dijital Teslimat Linki</h3>
                            <p className="text-sm text-slate-600 mb-4">
                                Bu linki depo görevlisine veya teslim alacak kişiye gönderin. Giriş yapmasına gerek kalmadan teslimat kaydı oluşturabilir.
                            </p>

                            <div className="flex gap-2 mb-4">
                                <input
                                    readOnly
                                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/teslimat/${token}`}
                                    className="flex-1 px-3 py-2 bg-slate-50 border rounded text-xs text-slate-600 font-mono"
                                />
                                <Button size="sm" onClick={copyLink}>Kopyala</Button>
                            </div>

                            <div className="bg-yellow-50 text-yellow-800 text-xs p-3 rounded mb-4">
                                Bu link 7 gün boyunca geçerlidir.
                            </div>

                            <div className="border-t pt-4">
                                <h4 className="text-sm font-semibold mb-2 text-slate-700">E-posta ile Gönder (Sistem)</h4>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="alici@sirket.com"
                                        className="flex-1 text-sm h-9"
                                        value={shareEmail}
                                        onChange={(e) => setShareEmail(e.target.value)}
                                    />
                                    <Button size="sm" onClick={sendShareLink} disabled={sendingEmail}>
                                        {sendingEmail ? "Gönderiliyor..." : "Gönder"}
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </div>
                )
            }

            {/* New Delivery Modal */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title="Yeni Teslimat / İrsaliye Girişi"
                size="lg"
            >
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="İrsaliye No / Belge Kodu" value={formCode} onChange={(e) => setFormCode(e.target.value)} placeholder="Örn: IRS-2024-001" />
                        <Input type="date" label="İrsaliye Tarihi" value={formDate} onChange={(e) => setFormDate(e.target.value)} />
                    </div>

                    <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-semibold border-b">
                                <tr>
                                    <th className="p-3">Ürün</th>
                                    <th className="p-3 text-right">Sipariş</th>
                                    <th className="p-3 text-right">Önceki T.</th>
                                    <th className="p-3 text-right">Kalan</th>
                                    <th className="p-3 w-32 text-right">Gelen Miktar</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {orderItems.map((item) => {
                                    const total = Number(item.quantity);
                                    const rem = getRemaining(item.id, total);
                                    return (
                                        <tr key={item.id} className="bg-white">
                                            <td className="p-3 font-medium text-slate-700">{item.name}</td>
                                            <td className="p-3 text-right text-slate-500">{total}</td>
                                            <td className="p-3 text-right text-slate-500">{deliveredTotals[item.id] || 0}</td>
                                            <td className="p-3 text-right font-bold text-blue-600">{rem}</td>
                                            <td className="p-3">
                                                <Input
                                                    type="number"
                                                    className="text-right h-9"
                                                    min={0}
                                                    placeholder="0"
                                                    value={inputs[item.id] || ""}
                                                    onChange={(e) => setInputs(p => ({ ...p, [item.id]: e.target.value }))}
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button variant="outline" onClick={() => setModalOpen(false)}>İptal</Button>
                        <Button variant="primary" onClick={handleSubmit} loading={submitting}>Kaydet ve Onayla</Button>
                    </div>
                </div>
            </Modal>
        </div >
    );
}
