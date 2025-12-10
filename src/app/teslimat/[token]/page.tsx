
"use client";
import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import Textarea from "@/components/ui/Textarea";

export default function PublicDeliveryForm({ params }: { params: Promise<{ token: string }> }) {
    const { token } = use(params);
    const { show } = useToast();

    // Data States
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [order, setOrder] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    // Form States
    const [receiverName, setReceiverName] = useState("");
    const [receiverEmail, setReceiverEmail] = useState("");
    const [receiverUnitId, setReceiverUnitId] = useState("");
    const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
    const [formCode, setFormCode] = useState("");
    const [inputs, setInputs] = useState<Record<string, string>>({});
    const [notes, setNotes] = useState("");
    const [files, setFiles] = useState<{ name: string; data: string }[]>([]);

    useEffect(() => { if (token) loadOrder(); }, [token]);

    const loadOrder = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/teslimat/public?token=${token}`);
            if (res.ok) {
                const data = await res.json();
                setOrder(data);
                setFormCode(`IRS-${data.barcode}`);
            } else { setError("Geçersiz link."); }
        } catch { setError("Sunucu hatası."); } finally { setLoading(false); }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => setFiles(p => [...p, { name: file.name, data: reader.result as string }]);
            reader.readAsDataURL(file);
        }
    };

    const handleReceiveAll = () => {
        if (!order) return;
        const newInputs: Record<string, string> = {};
        order.items?.forEach((item: any) => { if (item.remaining > 0) newInputs[item.id] = String(item.remaining); });
        setInputs(newInputs);
        show({ title: "Otomatik Dolduruldu", description: "Sadece kalan miktarlar girildi.", variant: "info" });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const items = Object.entries(inputs)
            .map(([oId, qty]) => ({ orderItemId: oId, quantity: Number(qty) }))
            .filter(x => x.quantity > 0);

        if (!receiverName) return show({ title: "Eksik Bilgi", description: "Lütfen adınızı giriniz.", variant: "warning" });
        if (items.length === 0) return show({ title: "Eksik Bilgi", description: "En az bir ürün girmelisiniz.", variant: "warning" });

        setSubmitting(true);
        try {
            const res = await fetch("/api/teslimat/public", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, receiverName, receiverEmail, receiverUnitId, code: formCode, date: formDate, notes, items, attachments: files })
            });
            if (res.ok) { setOrder(null); setError("sent"); }
            else { show({ title: "Hata", description: "Kaydedilemedi.", variant: "error" }); }
        } catch { show({ title: "Hata", description: "Sunucu hatası.", variant: "error" }); }
        finally { setSubmitting(false); }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500 font-medium">Yükleniyor...</div>;
    if (error === "sent") return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <Card className="max-w-md w-full p-8 text-center shadow-lg border-green-100">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h2 className="text-xl font-bold text-slate-800">İşlem Başarılı</h2>
                <p className="text-slate-600 mt-2 text-sm">Teslimat kaydınız başarıyla oluşturuldu.</p>
            </Card>
        </div>
    );
    if (error) return <div className="min-h-screen flex items-center justify-center text-red-500 font-bold">{error}</div>;
    if (!order) return null;

    return (
        <div className="min-h-screen bg-slate-100 py-6 px-4 md:px-8 font-sans text-sm">
            <div className="max-w-6xl mx-auto space-y-4">

                {/* Header Compact */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <div>
                        <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                            Teslimat Girişi
                        </h1>
                        <p className="text-slate-500 text-xs mt-0.5">{order.companyName} • Sipariş: <span className="font-semibold text-slate-900">{order.barcode}</span></p>
                    </div>
                    <div className="text-xs font-medium text-green-600 bg-green-50 px-3 py-1.5 rounded-full border border-green-100 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Güvenli Form
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-4">

                    {/* Left Column: Form Details (Compact Sidebar) */}
                    <div className="lg:col-span-4 space-y-4">
                        <Card className="p-4 shadow-sm space-y-4 h-full">
                            <div>
                                <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 tracking-wider">Teslimat Bilgileri</h3>
                                <div className="space-y-3">
                                    <Input label="Teslim Alan Ad Soyad" value={receiverName} onChange={(e) => setReceiverName(e.target.value)} required className="h-9 text-sm" />
                                    <Input label="E-posta (Opsiyonel)" type="email" value={receiverEmail} onChange={(e) => setReceiverEmail(e.target.value)} className="h-9 text-sm" />
                                    <div>
                                        <label className="text-xs font-semibold text-slate-700 block mb-1">Birim / Departman</label>
                                        <select
                                            className="w-full h-9 text-sm border border-slate-300 rounded-lg px-2 bg-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                            value={receiverUnitId}
                                            onChange={(e) => setReceiverUnitId(e.target.value)}
                                        >
                                            <option value="">Seçiniz</option>
                                            {order.units?.map((u: any) => <option key={u.id} value={u.id}>{u.label}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2 border-t border-slate-100">
                                <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 tracking-wider">İrsaliye Detayı</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <Input label="Belge No" value={formCode} onChange={(e) => setFormCode(e.target.value)} className="h-9 text-sm" />
                                    <Input type="date" label="Tarih" value={formDate} onChange={(e) => setFormDate(e.target.value)} className="h-9 text-sm" />
                                </div>
                            </div>

                            <div className="pt-2 border-t border-slate-100">
                                <label className="text-xs font-bold text-slate-400 uppercase mb-2 block tracking-wider">Belge Fotoğrafı</label>
                                <div className="relative group border border-dashed border-slate-300 rounded-lg p-3 text-center cursor-pointer hover:bg-slate-50 hover:border-blue-400 transition-colors">
                                    <input type="file" accept="image/*,.pdf" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                    <div className="flex items-center justify-center gap-2 text-slate-500">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                        <span className="text-xs font-medium">Dosya Seç ({files.length})</span>
                                    </div>
                                </div>
                                {files.map((f, i) => (
                                    <div key={i} className="mt-2 flex justify-between items-center text-xs bg-slate-50 p-1.5 rounded border border-slate-200">
                                        <span className="truncate max-w-[150px]">{f.name}</span>
                                        <button type="button" onClick={() => setFiles(p => p.filter((_, x) => x !== i))} className="text-red-500 font-bold px-1">×</button>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-2 border-t border-slate-100">
                                <Textarea label="Notlar" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="text-sm min-h-[60px]" placeholder="Varsa ek notlar..." />
                            </div>
                        </Card>
                    </div>

                    {/* Right Column: Items List */}
                    <div className="lg:col-span-8 flex flex-col gap-4">
                        <Card className="p-0 shadow-sm overflow-hidden flex-1">
                            <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                                <h3 className="text-sm font-bold text-slate-700">Ürün Listesi</h3>
                                <button type="button" onClick={handleReceiveAll} className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-white border border-slate-200 px-3 py-1 rounded shadow-sm hover:shadow active:scale-95 transition-all">
                                    Kalanları Otomatik Doldur
                                </button>
                            </div>

                            <div className="divide-y divide-slate-50 max-h-[600px] overflow-y-auto">
                                {order.items?.map((item: any) => {
                                    const isDone = item.remaining <= 0;
                                    return (
                                        <div key={item.id} className={`px-4 py-3 flex items-center justify-between gap-3 ${isDone ? 'bg-slate-50 opacity-60' : 'hover:bg-blue-50/30'}`}>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-sm font-semibold truncate ${isDone ? 'text-slate-500 line-through' : 'text-slate-800'}`}>{item.name}</span>
                                                    {isDone && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 rounded font-bold">TAM</span>}
                                                </div>
                                                <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                                                    <span className="bg-slate-100 px-1.5 rounded text-slate-600">Sipariş: {item.quantity}</span>
                                                    {item.delivered > 0 && <span className="bg-blue-50 text-blue-600 px-1.5 rounded">Alınan: {item.delivered}</span>}
                                                    <span className={`${isDone ? 'text-green-600' : 'text-orange-600 font-bold'}`}>Kalan: {Math.max(0, item.remaining)} {item.unit}</span>
                                                </div>
                                            </div>

                                            {!isDone ? (
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        type="number"
                                                        className="w-20 text-right h-8 text-sm font-semibold"
                                                        placeholder="0"
                                                        min={0}
                                                        max={item.remaining}
                                                        value={inputs[item.id] || ""}
                                                        onChange={(e) => setInputs(p => ({ ...p, [item.id]: e.target.value }))}
                                                    />
                                                    <span className="text-xs text-slate-400 font-medium w-8">{item.unit}</span>
                                                </div>
                                            ) : (
                                                <div className="text-xs text-slate-400 italic pr-2">Tamamlandı</div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>

                        {/* Submit Actions */}
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                            <p className="text-xs text-slate-500 text-center md:text-left">
                                <span className="font-bold text-slate-700">{receiverName || "___________"}</span> olarak, yukarıdaki ürünleri teslim aldığımı beyan ederim.
                            </p>
                            <Button
                                type="submit"
                                className="w-full md:w-auto px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/20 active:scale-95"
                                loading={submitting}
                            >
                                Teslimatı Onayla
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
