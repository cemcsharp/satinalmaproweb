"use client";
import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import Button from "@/components/ui/Button";
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
    needsOnboarding?: boolean;
    existingOffer?: any;
};

export default function SupplierPortalRfqPage() {
    const params = useParams();
    const token = String((params as any)?.token || "");
    const { show } = useToast();

    const [data, setData] = useState<RfqPublicDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [prices, setPrices] = useState<Record<string, number>>({});
    const [itemCurrencies, setItemCurrencies] = useState<Record<string, string>>({});
    const [notes, setNotes] = useState<Record<string, string>>({});
    const [brands, setBrands] = useState<Record<string, string>>({});
    const [generalNote, setGeneralNote] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const CURRENCIES = ["TRY", "USD", "EUR", "GBP"];
    const [attachments, setAttachments] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);

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

    // Calculate totals grouped by currency
    const currencyTotals = useMemo(() => {
        if (!data) return {};
        const totals: Record<string, number> = {};
        data.rfq.items.forEach(item => {
            const price = prices[item.id] || 0;
            const curr = itemCurrencies[item.id] || "TRY";
            const lineTotal = item.quantity * price;
            totals[curr] = (totals[curr] || 0) + lineTotal;
        });
        return totals;
    }, [prices, itemCurrencies, data]);

    const deadlineInfo = useMemo(() => {
        if (!data?.rfq.deadline) return null;
        const deadline = new Date(data.rfq.deadline);
        const now = new Date();
        const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return {
            date: deadline.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }),
            daysLeft: diffDays,
            isUrgent: diffDays <= 3
        };
    }, [data?.rfq.deadline]);

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
                if (val.needsOnboarding && !val.existingOffer) {
                    setStep("onboard");
                    setOnboardData(prev => ({ ...prev, contactName: val.supplier.name || "", name: val.supplier.companyName || "" }));
                } else {
                    setStep("offer");
                }
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
                    // Load per-item currencies if available
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
            show({ title: "Kayıt Başarılı", description: "Tedarikçi kaydınız oluşturuldu.", variant: "success" });
            setStep("offer");
            if (data) {
                setData({ ...data, supplier: { ...data.supplier, name: onboardData.contactName, companyName: onboardData.name } });
                setCompanyName(onboardData.name);
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
            const res = await fetch("/api/upload", { method: "POST", body: formData });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "Upload failed");
            const newUrls = json.files.map((f: any) => f.url);
            setAttachments(prev => [...prev, ...newUrls]);
        } catch (err: any) {
            show({ title: "Yükleme Hatası", description: err.message, variant: "error" });
        } finally {
            setUploading(false);
            e.target.value = "";
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
            currency: itemCurrencies[item.id] || "TRY",
            notes: notes[item.id],
            brand: brands[item.id],
            quantity: item.quantity,
            vatRate: 20
        }));

        try {
            const res = await fetch(`/api/portal/rfq?token=${token}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    items: itemsPayload,
                    notes: generalNote,
                    companyName: companyName,
                    attachments: attachments.join(",")
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

    // Loading
    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-slate-600"></div>
                    <p className="mt-4 text-slate-500">Yükleniyor...</p>
                </div>
            </div>
        );
    }

    // Error
    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md border border-slate-200">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h1 className="text-xl font-bold text-slate-800 mb-2">Davetiye Bulunamadı</h1>
                    <p className="text-slate-500">{error}</p>
                </div>
            </div>
        );
    }

    if (!data) return null;

    // ONBOARDING
    if (step === "onboard") {
        return (
            <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
                {/* Header */}
                <header className="bg-white border-b border-slate-200 shadow-sm">
                    <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="font-bold text-slate-800">Tedarikçi Portalı</h1>
                            <p className="text-xs text-slate-500">Firma Kayıt Formu</p>
                        </div>
                    </div>
                </header>

                <div className="max-w-3xl mx-auto px-4 py-10">
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                        <div className="bg-slate-800 px-8 py-6 text-center">
                            <h2 className="text-xl font-bold text-white">Hoş Geldiniz!</h2>
                            <p className="text-slate-300 text-sm mt-1">Teklif vermeden önce firmanızı tanıtın.</p>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Firma Adı / Unvanı <span className="text-red-500">*</span></label>
                                    <input
                                        className="w-full px-4 py-3 border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all"
                                        placeholder="Örn: ABC A.Ş."
                                        value={onboardData.name}
                                        onChange={(e) => setOnboardData({ ...onboardData, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Vergi No / TCKN</label>
                                    <input
                                        className="w-full px-4 py-3 border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all"
                                        placeholder="Vergi numaranız"
                                        value={onboardData.taxId}
                                        onChange={(e) => setOnboardData({ ...onboardData, taxId: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Yetkili Kişi</label>
                                    <input
                                        className="w-full px-4 py-3 border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all"
                                        placeholder="Ad Soyad"
                                        value={onboardData.contactName}
                                        onChange={(e) => setOnboardData({ ...onboardData, contactName: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Telefon</label>
                                    <input
                                        className="w-full px-4 py-3 border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all"
                                        placeholder="05..."
                                        value={onboardData.phone}
                                        onChange={(e) => setOnboardData({ ...onboardData, phone: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Adres</label>
                                <textarea
                                    className="w-full px-4 py-3 border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all resize-none"
                                    rows={2}
                                    placeholder="Açık adresiniz"
                                    value={onboardData.address}
                                    onChange={(e) => setOnboardData({ ...onboardData, address: e.target.value })}
                                />
                            </div>
                            <div className="pt-4 border-t border-slate-200">
                                <Button
                                    onClick={handleOnboardSubmit}
                                    disabled={submitting}
                                    variant="gradient"
                                    size="lg"
                                    className="w-full"
                                >
                                    {submitting ? "Kaydediliyor..." : "Kaydet ve Devam Et →"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // OFFER FORM
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="font-bold text-slate-800">{data.rfq.rfxCode}</h1>
                            <p className="text-xs text-slate-500">Fiyat Teklifi Formu</p>
                        </div>
                    </div>
                    {deadlineInfo && (
                        <div className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 ${deadlineInfo.isUrgent ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Son: {deadlineInfo.date}
                        </div>
                    )}
                </div>
            </header>

            <div className="max-w-5xl mx-auto px-4 py-8">
                {/* Success */}
                {submitted && (
                    <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-semibold text-emerald-800">Teklifiniz Alındı!</h3>
                            <p className="text-sm text-emerald-600">Güncelleme yapmak isterseniz formu düzenleyebilirsiniz.</p>
                        </div>
                    </div>
                )}

                {/* Request Info Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">{data.rfq.title}</h2>
                        <p className="text-slate-500 mt-1">
                            Sayın <span className="font-medium text-slate-700">{data.supplier.name}</span>, lütfen teklifinizi aşağıya giriniz.
                        </p>
                    </div>
                </div>

                {/* KDV Warning */}
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 mb-6">
                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <div>
                        <h4 className="font-semibold text-amber-800">ÖNEMLİ: Tüm Fiyatlar KDV HARİÇ Girilmelidir</h4>
                        <p className="text-sm text-amber-700 mt-1">Kurumumuz tüm teklifleri KDV hariç değerlendirmektedir.</p>
                    </div>
                </div>

                {/* Products Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="text-left px-5 py-4 text-sm font-semibold text-slate-600">Ürün / Hizmet</th>
                                <th className="text-left px-5 py-4 text-sm font-semibold text-slate-600">Miktar</th>
                                <th className="text-left px-5 py-4 text-sm font-semibold text-slate-600">Marka/Not</th>
                                <th className="text-right px-5 py-4 text-sm font-semibold text-slate-600">Birim Fiyat <span className="text-amber-600">(KDV HARİÇ)</span></th>
                                <th className="text-center px-5 py-4 text-sm font-semibold text-slate-600">Para Birimi</th>
                                <th className="text-right px-5 py-4 text-sm font-semibold text-slate-600">Toplam</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {data.rfq.items.map((item) => {
                                const price = prices[item.id] || 0;
                                const curr = itemCurrencies[item.id] || "TRY";
                                const total = item.quantity * price;
                                return (
                                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-5 py-4">
                                            <div className="font-medium text-slate-800">{item.name}</div>
                                            {item.description && <div className="text-xs text-slate-400 mt-0.5">{item.description}</div>}
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="font-medium text-slate-700">{formatNumberTR(item.quantity)}</span>
                                            <span className="text-slate-400 text-sm ml-1">{item.unit}</span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <input
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-transparent"
                                                placeholder="Marka veya not..."
                                                value={notes[item.id] || brands[item.id] || ""}
                                                onChange={e => setNotes({ ...notes, [item.id]: e.target.value })}
                                            />
                                        </td>
                                        <td className="px-5 py-4">
                                            <input
                                                type="number"
                                                className="w-28 ml-auto px-3 py-2 border border-slate-200 rounded-lg text-slate-700 text-right font-mono focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-transparent"
                                                placeholder="0,00"
                                                value={prices[item.id] || ""}
                                                onChange={e => setPrices({ ...prices, [item.id]: Number(e.target.value) })}
                                            />
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <select
                                                className="px-3 py-2 border border-slate-200 rounded-lg text-slate-700 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                                                value={curr}
                                                onChange={e => setItemCurrencies({ ...itemCurrencies, [item.id]: e.target.value })}
                                            >
                                                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <span className="font-bold text-slate-800 font-mono">{formatNumberTR(total)}</span>
                                            <span className="text-slate-400 text-sm ml-1">{curr}</span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot>
                            <tr className="bg-slate-800">
                                <td colSpan={5} className="px-5 py-4 text-right text-white font-semibold">
                                    GENEL TOPLAM <span className="text-amber-400">(KDV HARİÇ)</span>:
                                </td>
                                <td className="px-5 py-4 text-right">
                                    <div className="space-y-1">
                                        {Object.entries(currencyTotals).filter(([_, v]) => v > 0).map(([curr, total]) => (
                                            <div key={curr} className="text-white">
                                                <span className="text-xl font-bold">{formatNumberTR(total)}</span>
                                                <span className="text-slate-300 ml-2">{curr}</span>
                                            </div>
                                        ))}
                                    </div>
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Notes & Attachments */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Genel Notlar
                        </h3>
                        <textarea
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-transparent resize-none h-32"
                            placeholder="Teslimat koşulları, ödeme vadesi vb..."
                            value={generalNote}
                            onChange={e => setGeneralNote(e.target.value)}
                        />
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                            Dosya Ekle
                        </h3>
                        <label className={`flex flex-col items-center justify-center py-8 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-slate-400 hover:bg-slate-50 transition-all ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            <svg className="w-10 h-10 text-slate-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <span className="text-slate-500 text-sm">{uploading ? "Yükleniyor..." : "Teklif, katalog, vb. yükleyin"}</span>
                            <input type="file" className="hidden" multiple onChange={handleFileUpload} disabled={uploading} />
                        </label>
                        {attachments.length > 0 && (
                            <ul className="mt-4 space-y-2">
                                {attachments.map((url, idx) => (
                                    <li key={idx} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-slate-800 text-sm truncate max-w-[180px]">
                                            📎 {url.split('/').pop()}
                                        </a>
                                        <button onClick={() => removeAttachment(url)} className="text-red-500 hover:text-red-700 p-1">✕</button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {/* Submit */}
                <div className="flex justify-end mb-12">
                    <Button
                        onClick={handleSubmit}
                        disabled={submitting}
                        variant="gradient"
                        size="lg"
                        className="px-10 shadow-lg"
                    >
                        {submitting ? "Gönderiliyor..." : submitted ? "Teklifi Güncelle" : "Teklifi Gönder"}
                    </Button>
                </div>

                {/* Footer */}
                <div className="text-center text-slate-400 text-sm pb-8">
                    © {new Date().getFullYear()} Satınalma Pro • Tedarikçi Portalı
                </div>
            </div>
        </div>
    );
}
