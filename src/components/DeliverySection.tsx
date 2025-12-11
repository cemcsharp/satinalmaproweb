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


            {/* Share Modal - Modern & Comprehensive */}
            {showShareModal && token && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 text-white relative">
                            <button
                                onClick={() => setShowShareModal(false)}
                                className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">Teslimat Linki Paylaş</h3>
                                    <p className="text-blue-100 text-sm">Sipariş: {orderBarcode}</p>
                                </div>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-5">
                            {/* Success Badge */}
                            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                                <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <div>
                                    <p className="text-sm font-medium text-green-800">Link Oluşturuldu</p>
                                    <p className="text-xs text-green-600">7 gün boyunca geçerli</p>
                                </div>
                            </div>

                            {/* Link Box */}
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Paylaşım Linki</label>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 font-mono text-sm text-blue-600 truncate">
                                        {typeof window !== 'undefined' ? `${window.location.origin}/teslimat/${token}` : `/teslimat/${token}`}
                                    </div>
                                    <Button variant="outline" size="sm" onClick={copyLink} className="flex-shrink-0">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                    </Button>
                                </div>
                            </div>

                            {/* Quick Share Buttons */}
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Hızlı Paylaşım</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => {
                                            const url = `${window.location.origin}/teslimat/${token}`;
                                            const text = `Teslimat formunu doldurmanız bekleniyor: ${url}`;
                                            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                                        }}
                                        className="flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                                        WhatsApp
                                    </button>
                                    <button
                                        onClick={copyLink}
                                        className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                        Kopyala
                                    </button>
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
                                <div className="relative flex justify-center"><span className="px-3 bg-white text-xs text-slate-400 uppercase tracking-wider">veya e-posta gönder</span></div>
                            </div>

                            {/* Email Section */}
                            <div className="space-y-3">
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="alici@sirket.com"
                                        className="flex-1"
                                        value={shareEmail}
                                        onChange={(e) => setShareEmail(e.target.value)}
                                        type="email"
                                    />
                                    <Button
                                        variant="primary"
                                        onClick={sendShareLink}
                                        disabled={sendingEmail || !shareEmail}
                                        loading={sendingEmail}
                                        className="px-6"
                                    >
                                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                        Gönder
                                    </Button>
                                </div>
                                <p className="text-xs text-slate-500 text-center">
                                    Alıcıya teslimat formu linki içeren bir e-posta gönderilecektir.
                                </p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100">
                            <Button variant="ghost" className="w-full" onClick={() => setShowShareModal(false)}>
                                Kapat
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* New Delivery Modal */}

        </div >
    );
}
