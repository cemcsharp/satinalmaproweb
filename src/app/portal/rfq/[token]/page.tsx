"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import { formatNumberTR } from "@/lib/format";

type RfqPublicDetail = {
    ok: boolean;
    rfq: {
        title: string;
        rfxCode: string;
        deadline: string | null;
        items: Array<{
            id: string;
            name: string;
            quantity: number;
            unit: string;
            description?: string;
        }>;
    };
    supplier: {
        name: string;
        email: string;
        companyName?: string;
    };
    needsOnboarding?: boolean; // New flag
    existingOffer?: any;
};

export default function SupplierPortalRfqPage() {
    const params = useParams();
    const token = String((params as any)?.token || "");
    const { show } = useToast();

    const [data, setData] = useState<RfqPublicDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Form State
    const [prices, setPrices] = useState<Record<string, number>>({});
    const [notes, setNotes] = useState<Record<string, string>>({});
    const [brands, setBrands] = useState<Record<string, string>>({});
    const [generalNote, setGeneralNote] = useState("");
    const [companyName, setCompanyName] = useState(""); // Firma adı state
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    // Currency & File State
    const [currency, setCurrency] = useState("TRY");
    const CURRENCIES = ["TRY", "USD", "EUR", "GBP"];
    const [attachments, setAttachments] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);

    // Onboarding State
    const [step, setStep] = useState<"loading" | "onboard" | "offer">("loading");
    const [onboardData, setOnboardData] = useState({
        name: "",
        taxId: "",
        contactName: "",
        phone: "",
        address: "",
        website: "",
        notes: ""
    });

    useEffect(() => {
        if (!token) return;
        fetch(`/api/portal/rfq?token=${token}`)
            .then(async r => {
                if (r.status === 410) throw new Error("Linkin süresi dolmuş.");
                if (r.status === 404) throw new Error("Davetiye bulunamadı.");
                if (!r.ok) throw new Error("Bir hata oluştu.");
                return r.json();
            })
            .then((val: RfqPublicDetail) => {
                setData(val);

                // Determine step
                if (val.needsOnboarding && !val.existingOffer) {
                    setStep("onboard");
                    // Pre-fill contact from invitation if available
                    setOnboardData(prev => ({ ...prev, contactName: val.supplier.name || "", name: val.supplier.companyName || "" }));
                } else {
                    setStep("offer");
                }

                // Pre-fill Offer if exists
                if (val.existingOffer) {
                    const p: any = {};
                    const n: any = {};
                    const b: any = {};
                    val.existingOffer.items.forEach((it: any) => {
                        p[it.rfqItemId] = Number(it.unitPrice);
                        if (it.notes) n[it.rfqItemId] = it.notes;
                        if (it.brand) b[it.rfqItemId] = it.brand;
                    });
                    setPrices(p);
                    setNotes(n);
                    setBrands(b);
                    setGeneralNote(val.existingOffer.notes || "");
                    if (val.existingOffer.currency) setCurrency(val.existingOffer.currency);
                    if (val.existingOffer.attachments) setAttachments(val.existingOffer.attachments.split(",").filter(Boolean));
                    setSubmitted(true);
                }
            })
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, [token]);

    const handleOnboardSubmit = async () => {
        if (!onboardData.name || onboardData.name.length < 2) {
            show({ title: "Hata", description: "Firma adı zorunludur.", variant: "error" });
            return;
        }
        setSubmitting(true);
        try {
            const res = await fetch(`/api/portal/rfq?token=${token}&action=onboard`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(onboardData)
            });
            if (!res.ok) throw new Error("Kayıt işlemi başarısız.");

            show({ title: "Kayıt Başarılı", description: "Tedarikçi kaydınız oluşturuldu. Teklif ekranına yönlendiriliyorsunuz.", variant: "success" });
            setStep("offer"); // Go to next step
            // Update local data to reflect registered state (optional but good for UI consistency)
            if (data) {
                setData({ ...data, supplier: { ...data.supplier, name: onboardData.contactName, companyName: onboardData.name } });
                setCompanyName(onboardData.name); // Pre-fill offer form company name
            }

        } catch (e: any) {
            show({ title: "Hata", description: e.message, variant: "error" });
        } finally {
            setSubmitting(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        setUploading(true);
        const formData = new FormData();
        Array.from(e.target.files).forEach(f => formData.append("files", f));

        try {
            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "Upload failed");

            const newUrls = json.files.map((f: any) => f.url);
            setAttachments(prev => [...prev, ...newUrls]);
        } catch (err: any) {
            show({ title: "Yükleme Hatası", description: err.message, variant: "error" });
        } finally {
            setUploading(false);
            e.target.value = ""; // reset input
        }
    };

    const removeAttachment = (url: string) => {
        setAttachments(prev => prev.filter(a => a !== url));
    };

    const handleSubmit = async () => {
        if (!data) return;
        setSubmitting(true);

        const itemsPayload = data.rfq.items.map(item => ({
            rfqItemId: item.id,
            unitPrice: prices[item.id] || 0,
            notes: notes[item.id],
            brand: brands[item.id],
            quantity: item.quantity, // confirm quantity
            vatRate: 20 // default or ask user
        }));

        try {
            const res = await fetch(`/api/portal/rfq?token=${token}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    items: itemsPayload,
                    notes: generalNote,
                    currency: currency,
                    companyName: companyName, // Send company name
                    attachments: attachments.join(",") // Send as CSV
                })
            });

            if (!res.ok) throw new Error("Gönderim başarısız");
            setSubmitted(true);
            show({ title: "Teklifiniz iletildi", description: "Teşekkür ederiz.", variant: "success" });
        } catch (e: any) {
            show({ title: "Hata", description: e.message, variant: "error" });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="flex items-center justify-center min-h-screen text-slate-500">Yükleniyor...</div>;
    if (error) return <div className="flex items-center justify-center min-h-screen text-red-500 font-medium">{error}</div>;
    if (!data) return null;

    // STEP 1: ONBOARDING FORM
    if (step === "onboard") {
        return (
            <div className="min-h-screen bg-slate-50 py-10 px-4">
                <div className="max-w-3xl mx-auto space-y-6">
                    <div className="text-center space-y-2 mb-8">
                        <h1 className="text-2xl font-bold text-slate-800">Tedarikçi Kayıt</h1>
                        <p className="text-slate-600">Teklif vermeden önce lütfen firmanızı tanıtın.</p>
                    </div>

                    <Card className="p-8 shadow-lg">
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Firma Adı / Unvanı"
                                    required
                                    placeholder="Örn: ABC A.Ş."
                                    value={onboardData.name}
                                    onChange={(e) => setOnboardData({ ...onboardData, name: e.target.value })}
                                />
                                <Input
                                    label="Vergi No / TCKN"
                                    placeholder="Vergi numaranız"
                                    value={onboardData.taxId}
                                    onChange={(e) => setOnboardData({ ...onboardData, taxId: e.target.value })}
                                />
                                <Input
                                    label="Yetkili Kişi"
                                    placeholder="Ad Soyad"
                                    value={onboardData.contactName}
                                    onChange={(e) => setOnboardData({ ...onboardData, contactName: e.target.value })}
                                />
                                <Input
                                    label="Telefon"
                                    placeholder="05..."
                                    value={onboardData.phone}
                                    onChange={(e) => setOnboardData({ ...onboardData, phone: e.target.value })}
                                />
                                <Input
                                    label="Web Sitesi"
                                    placeholder="https://"
                                    value={onboardData.website}
                                    onChange={(e) => setOnboardData({ ...onboardData, website: e.target.value })}
                                />
                                <Input
                                    label="E-posta (Davet)"
                                    value={data?.supplier?.email || ""}
                                    disabled
                                    className="bg-slate-100"
                                />
                            </div>
                            <Input
                                label="Adres"
                                placeholder="Açık adresiniz"
                                multiline
                                rows={2}
                                value={onboardData.address}
                                onChange={(e) => setOnboardData({ ...onboardData, address: e.target.value })}
                            />

                            <div className="pt-4 border-t flex justify-end">
                                <Button
                                    onClick={handleOnboardSubmit}
                                    disabled={submitting}
                                    className="bg-blue-600 hover:bg-blue-700 text-white w-full md:w-auto px-8 py-3 h-auto text-lg"
                                >
                                    {submitting ? "Kaydediliyor..." : "Kaydet ve Devam Et →"}
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        );
    }

    // STEP 2: OFFER FORM (Existing UI)
    return (
        <div className="min-h-screen bg-slate-50 py-10 px-4">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Firma Bilgisi (Read-Only or Editable logic if needed, but we keep simple) */}
                {/* We can hide manual company input now if we trust step 1, OR keep it as override. 
                    Let's KEEP IT but pre-filled, so they can correct it if needed. 
                */}
                {/* Firma Bilgileri */}
                <Card className="p-6 mb-6">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Tedarikçi Bilgileri</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Firma Adı / Unvanı</label>
                            <Input
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                placeholder="Firma adınızı giriniz..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Yetkili Kişi</label>
                            <Input value={data?.supplier?.name || ""} disabled className="bg-slate-50" />
                        </div>
                    </div>
                </Card>

                {/* Ürün Listesi */}
                {/* Header */}
                <div className="text-center space-y-2 mb-8">
                    <h1 className="text-2xl font-bold text-slate-800">Fiyat Teklifi Formu</h1>
                    <p className="text-slate-600">{data.rfq.title} ({data.rfq.rfxCode})</p>
                    <div className="inline-block bg-white px-4 py-1 rounded-full text-sm border border-slate-200 shadow-sm mt-2">
                        Sayın <strong>{data.supplier.name}</strong>, lütfen teklifinizi giriniz.
                    </div>
                </div>

                {submitted && (
                    <div className="bg-green-100 border border-green-300 text-green-800 p-4 rounded-xl text-center mb-6">
                        <p className="font-semibold text-lg">✅ Teklifiniz başarıyla tarafımıza ulaşmıştır.</p>
                        <p className="text-sm mt-1">Gerekirse formu güncelleyip tekrar gönderebilirsiniz.</p>
                    </div>
                )}

                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-lg text-slate-800">Teklif Detayları</h3>
                    <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-slate-600">Para Birimi:</span>
                        <select
                            className="bg-white border border-slate-300 rounded-md px-3 py-1 text-sm font-semibold focus:ring-2 focus:ring-blue-100 outline-none"
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                        >
                            {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                </div>

                <Card className="p-6 shadow-xl border-slate-200">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-100 text-slate-700 uppercase font-semibold">
                                <tr>
                                    <th className="p-3 rounded-tl-lg">Ürün / Hizmet</th>
                                    <th className="p-3">Miktar</th>
                                    <th className="p-3">Marka/Not</th>
                                    <th className="p-3 text-right">Birim Fiyat ({currency})</th>
                                    <th className="p-3 text-right rounded-tr-lg">Toplam ({currency})</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {data.rfq.items.map(item => {
                                    const price = prices[item.id] || 0;
                                    const total = item.quantity * price;
                                    return (
                                        <tr key={item.id} className="hover:bg-slate-50/50">
                                            <td className="p-3">
                                                <div className="font-medium text-slate-900">{item.name}</div>
                                                {item.description && <div className="text-xs text-slate-500">{item.description}</div>}
                                            </td>
                                            <td className="p-3 font-medium">
                                                {formatNumberTR(item.quantity)} <span className="text-slate-500 text-xs">{item.unit}</span>
                                            </td>
                                            <td className="p-3">
                                                <input
                                                    className="w-full text-sm border-0 border-b border-transparent focus:border-blue-500 bg-transparent focus:ring-0 placeholder-slate-300 transition-colors py-1"
                                                    placeholder="Marka/Model veya Not..."
                                                    value={notes[item.id] || brands[item.id] || ""}
                                                    onChange={e => setNotes({ ...notes, [item.id]: e.target.value })}
                                                />
                                            </td>
                                            <td className="p-3 w-40">
                                                <Input
                                                    type="number"
                                                    className="text-right font-mono"
                                                    value={prices[item.id] || ""}
                                                    onChange={e => setPrices({ ...prices, [item.id]: Number(e.target.value) })}
                                                    placeholder="0.00"
                                                />
                                            </td>
                                            <td className="p-3 w-32 text-right font-bold text-slate-800">
                                                {formatNumberTR(total)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot className="bg-slate-50 font-bold text-slate-800 border-t border-slate-200">
                                <tr>
                                    <td colSpan={4} className="p-3 text-right">GENEL TOPLAM:</td>
                                    <td className="p-3 text-right font-mono text-lg">
                                        {formatNumberTR(Object.keys(prices).reduce((sum, id) => {
                                            const qty = data.rfq.items.find(i => i.id === id)?.quantity || 0;
                                            return sum + (qty * (prices[id] || 0));
                                        }, 0))} {currency}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    <div className="mt-8 space-y-4">
                        <label className="block text-sm font-semibold text-slate-700">Genel Notlarınız</label>
                        <textarea
                            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                            rows={3}
                            placeholder="Teslimat koşulları, ödeme vadesi vb. notlarınız..."
                            value={generalNote}
                            onChange={e => setGeneralNote(e.target.value)}
                        ></textarea>
                    </div>

                    <div className="mt-6 space-y-3">
                        <label className="block text-sm font-semibold text-slate-700">Dosya Ekle (Teklif, Katalog vb.)</label>
                        <div className="flex items-center gap-4">
                            <label className={`cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 px-4 rounded border border-slate-300 transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                {uploading ? "Yükleniyor..." : "Dosya Seç"}
                                <input type="file" className="hidden" multiple onChange={handleFileUpload} disabled={uploading} />
                            </label>
                            <span className="text-xs text-slate-500">Maks 10MB (PDF, Excel, Resim)</span>
                        </div>

                        {attachments.length > 0 && (
                            <ul className="space-y-1 mt-2">
                                {attachments.map((url, idx) => (
                                    <li key={idx} className="flex items-center gap-2 text-sm text-blue-600">
                                        <a href={url} target="_blank" rel="noopener noreferrer" className="hover:underline truncate max-w-xs">{url.split('/').pop()}</a>
                                        <button onClick={() => removeAttachment(url)} className="text-red-500 hover:text-red-700" title="Sil">✕</button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="mt-8 flex justify-end">
                        <Button
                            size="lg"
                            variant="gradient"
                            onClick={handleSubmit}
                            loading={submitting}
                            className="shadow-xl shadow-blue-500/20 px-8"
                        >
                            {submitted ? "Teklifi Güncelle" : "Teklifi Gönder"}
                        </Button>
                    </div>
                </Card>

                <div className="text-center text-xs text-slate-400 mt-8 pb-8">
                    &copy; {new Date().getFullYear()} Satınalma Pro Güvenli Tedarikçi Portalı
                </div>
            </div>
        </div>
    );
}
