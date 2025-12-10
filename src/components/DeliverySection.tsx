"use client";
import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
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
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
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

    // Auto-open modal if action=new-delivery
    useEffect(() => {
        if (searchParams.get("action") === "new-delivery") {
            setModalOpen(true);
            // Optional: Clean up URL
            const params = new URLSearchParams(searchParams.toString());
            params.delete("action");
            router.replace(`${pathname}?${params.toString()}`, { scroll: false });
        }
    }, [searchParams]);

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
                    <Button variant="outline" onClick={() => router.push(`/teslimat/olustur?orderId=${orderId}`)}>
                        Manuel Giriş
                    </Button>
                    <Button variant="primary" onClick={generateToken}>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        Teslim Alana Gönder
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
            {showShareModal && token && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <Card className="w-full max-w-md p-6 relative bg-white">
                        <button
                            onClick={() => setShowShareModal(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>

                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Teslimat Linki Hazır</h3>
                                <p className="text-xs text-slate-500">Link 7 gün geçerlidir</p>
                            </div>
                        </div>

                        {/* Link Preview */}
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4">
                            <p className="text-xs text-slate-500 mb-1">Paylaşım Linki:</p>
                            <p className="text-sm font-mono text-blue-600 break-all">{typeof window !== 'undefined' ? `${window.location.origin}/teslimat/${token}` : `/teslimat/${token}`}</p>
                        </div>

                        {/* Copy Button */}
                        <Button variant="outline" className="w-full mb-4" onClick={copyLink}>
                            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                            Linki Kopyala
                        </Button>

                        <div className="relative mb-4">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
                            <div className="relative flex justify-center text-xs"><span className="px-2 bg-white text-slate-400">veya e-posta ile gönder</span></div>
                        </div>

                        <div className="space-y-3">
                            <Input
                                placeholder="ornek@sirket.com"
                                className="w-full text-sm"
                                value={shareEmail}
                                onChange={(e) => setShareEmail(e.target.value)}
                                type="email"
                            />
                            <div className="flex gap-2">
                                <Button variant="outline" className="flex-1" onClick={() => setShowShareModal(false)}>İptal</Button>
                                <Button variant="primary" className="flex-1" onClick={sendShareLink} disabled={sendingEmail || !shareEmail} loading={sendingEmail}>
                                    E-posta Gönder
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* New Delivery Modal */}

        </div >
    );
}
