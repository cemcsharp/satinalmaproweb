"use client";
import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import Button from "@/components/ui/Button";
import { formatNumberTR } from "@/lib/format";
import { signIn, useSession } from "next-auth/react";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Badge from "@/components/ui/Badge";
import Alert from "@/components/ui/Alert";
import { Table, TableContainer, THead, TBody, TR, TH, TD } from "@/components/ui/Table";
import { SystemSettings, defaultSettings } from "@/lib/settings";
import PortalNegotiationPanel from "@/components/portal/PortalNegotiationPanel";

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
            categoryId?: string | null;
            categoryName?: string | null;
            categoryCode?: string | null;
        }>;
    };
    supplier: {
        id?: string;
        name: string;
        email: string;
        companyName?: string;
        taxId?: string;
        taxOffice?: string;
        contactName?: string;
        phone?: string;
        address?: string;
        website?: string;
        bankName?: string;
        bankBranch?: string;
        bankIban?: string;
        bankAccountNo?: string;
        bankCurrency?: string;
        commercialRegistrationNo?: string;
        mersisNo?: string;
    };
    needsOnboarding?: boolean;
    isRegistered?: boolean;
    existingOffer?: any;
};

export default function SupplierPortalRfqPage() {
    const params = useParams();
    const token = String((params as any)?.token || "");
    const { show } = useToast();
    const { data: session, status: authStatus } = useSession();

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

    const [siteSettings, setSiteSettings] = useState<Partial<SystemSettings>>(defaultSettings);

    // Fetch settings for dynamic branding
    useEffect(() => {
        fetch("/api/admin/settings")
            .then(res => res.json())
            .then(data => {
                if (data.ok && data.settings) {
                    setSiteSettings(data.settings);
                }
            })
            .catch(console.error);
    }, []);

    const siteName = siteSettings.siteName || defaultSettings.siteName;

    const CURRENCIES = ["TRY", "USD", "EUR", "GBP"];
    const [attachments, setAttachments] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);

    const [step, setStep] = useState<"loading" | "landing" | "onboard" | "offer" | "login_required" | "error">("loading");
    const [onboardData, setOnboardData] = useState({
        name: "",
        taxId: "",
        taxOffice: "",
        contactName: "",
        phone: "",
        address: "",
        website: "",
        notes: "",
        bankName: "",
        bankBranch: "",
        bankIban: "",
        bankAccountNo: "",
        bankCurrency: "TRY",
        commercialRegistrationNo: "",
        mersisNo: "",
        password: ""
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

                // Corporate 2.0 Flow: Always show landing if not logged in
                if (authStatus !== "authenticated") {
                    setStep("landing");
                }
                else if (session?.user?.email !== val.supplier.email) {
                    // Logged in as someone else? Show landing (which will show login/switch account)
                    setStep("landing");
                }
                else if (val.needsOnboarding && !val.existingOffer) {
                    setStep("onboard");
                    // Pre-fill existing supplier info
                    setOnboardData(prev => ({
                        ...prev,
                        name: val.supplier.name || val.supplier.companyName || "",
                        taxId: val.supplier.taxId || "",
                        taxOffice: val.supplier.taxOffice || "",
                        contactName: val.supplier.contactName || val.supplier.name || "",
                        email: val.supplier.email || "",
                        phone: val.supplier.phone || "",
                        address: val.supplier.address || "",
                        website: val.supplier.website || "",
                        bankName: val.supplier.bankName || "",
                        bankBranch: val.supplier.bankBranch || "",
                        bankIban: val.supplier.bankIban || "",
                        bankAccountNo: val.supplier.bankAccountNo || "",
                        bankCurrency: val.supplier.bankCurrency || "TRY",
                        commercialRegistrationNo: val.supplier.commercialRegistrationNo || "",
                        mersisNo: val.supplier.mersisNo || ""
                    }));
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
    }, [token, authStatus, session]);

    const handleOnboardSubmit = async () => {
        if (!onboardData.name || onboardData.name.length < 2) {
            show({ title: "Hata", description: "Firma adı zorunludur.", variant: "error" });
            return;
        }
        if (!onboardData.password || onboardData.password.length < 6) {
            show({ title: "Hata", description: "Kurumsal hesap güvenliği için en az 6 karakterli bir şifre belirlemelisiniz.", variant: "error" });
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

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-slate-600"></div>
                    <p className="mt-4 text-slate-500 font-medium">Teklif formu yükleniyor...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center p-4 py-20">
                <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md border border-slate-200">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h1 className="text-xl font-bold text-slate-800 mb-2">Erişim Hatası</h1>
                    <p className="text-slate-500 font-medium">{error}</p>
                </div>
            </div>
        );
    }

    if (!data) return null;

    // LANDING PAGE (NEW CORPORATE ENTRY)
    if (step === "landing") {
        return (
            <div className="flex items-center justify-center p-4 py-12 min-h-[60vh]">
                <Card className="max-w-2xl w-full overflow-hidden border-none shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700 rounded-[3rem]">
                    <div className="p-8 md:p-14 text-center">
                        <div className="flex justify-center mb-10">
                            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-blue-200 ring-8 ring-blue-50 transform hover:rotate-6 transition-transform">
                                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                        </div>

                        <div className="mb-12">
                            <h1 className="text-4xl font-black text-slate-900 mb-6 tracking-tighter">{siteName} Portal</h1>
                            <div className="flex justify-center mb-6">
                                <Badge variant="primary" className="px-6 py-2 rounded-2xl text-sm font-black uppercase tracking-widest shadow-sm">
                                    {data.rfq.rfxCode}
                                </Badge>
                            </div>
                            <p className="text-2xl font-semibold text-slate-500 max-w-lg mx-auto leading-tight italic">
                                "{data.rfq.title}"
                            </p>
                        </div>

                        <div className="space-y-6 max-w-sm mx-auto">
                            <Button
                                onClick={() => signIn(undefined, { callbackUrl: window.location.href })}
                                className="w-full h-24 rounded-[2rem] shadow-[0_25px_50px_-15px_rgba(37,99,235,0.4)] text-2xl font-black !gap-6 group"
                                variant="primary"
                            >
                                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center group-hover:bg-white group-hover:text-blue-600 transition-all">
                                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                    </svg>
                                </div>
                                Kurumsal Giriş Yap
                            </Button>

                            {data.isRegistered ? (
                                <div className="pt-6">
                                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full border border-blue-100 mb-2">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                        <span className="text-[10px] font-black text-blue-700 uppercase tracking-widest">Hesap Tanımlı</span>
                                    </div>
                                    <p className="text-sm text-slate-400 font-bold">Lütfen mail adresiniz ve şifrenizle devam edin.</p>
                                </div>
                            ) : (
                                <Button
                                    onClick={() => setStep("onboard")}
                                    variant="outline"
                                    className="w-full h-20 rounded-[1.5rem] border-[3px] text-xl font-black shadow-lg shadow-slate-100/50"
                                >
                                    Yeni Firma Aktivasyonu
                                </Button>
                            )}
                        </div>

                        <div className="mt-16 pt-10 border-t border-slate-100/60 flex items-center justify-center gap-12">
                            <div className="text-center">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Veri Güvenliği</p>
                                <p className="text-sm font-black text-slate-800">Uçtan Uca</p>
                            </div>
                            <div className="w-px h-8 bg-slate-100 rotate-12"></div>
                            <div className="text-center">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Standart</p>
                                <p className="text-sm font-black text-slate-800">ISO 27001</p>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        );
    }

    // LOGIN REQUIRED
    if (step === "login_required") {
        return (
            <div className="flex items-center justify-center p-4 py-20 min-h-[60vh]">
                <Card className="p-12 text-center max-w-lg border-none shadow-2xl animate-in fade-in zoom-in duration-500 rounded-[3rem]">
                    <div className="w-24 h-24 bg-blue-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-inner ring-1 ring-blue-100">
                        <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 mb-6 tracking-tight">Erişim İçin Oturum Açın</h1>
                    <p className="text-slate-500 font-semibold leading-relaxed mb-12 text-lg">
                        Bu satın alma süreci için sistemimizde tanımlı bir kurumsal hesabınız bulunmaktadır. Güvenliğiniz için lütfen giriş yapınız.
                    </p>
                    <div className="space-y-6">
                        <Button
                            onClick={() => signIn(undefined, { callbackUrl: window.location.href })}
                            className="w-full h-18 rounded-2xl text-xl font-black shadow-xl"
                            variant="primary"
                        >
                            Giriş Yap ve Devam Et
                        </Button>
                        <div className="pt-6 border-t border-slate-50 flex items-center justify-center gap-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hesap Email:</span>
                            <span className="text-sm font-black text-blue-600 tracking-tight">{data?.supplier.email}</span>
                        </div>
                    </div>
                </Card>
            </div>
        );
    }

    // ONBOARDING
    if (step === "onboard") {
        return (
            <div className="max-w-4xl mx-auto py-12 px-4">
                <Card className="border-none shadow-2xl overflow-hidden rounded-[3rem]">
                    <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-12 py-12 text-center relative">
                        <div className="absolute top-0 right-0 p-10 opacity-10">
                            <svg className="w-40 h-40 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <h2 className="text-4xl font-black text-white tracking-tighter relative z-10 mb-4 text-shadow-sm">Firma Aktivasyonu</h2>
                        <p className="text-blue-100 text-xl font-medium opacity-90 relative z-10 max-w-lg mx-auto leading-relaxed">Süreci başlatmak için kurumsal bilgilerinizi doğrulayınız ve porta giriş şifrenizi belirleyiniz.</p>
                    </div>

                    <div className="p-10 md:p-14 space-y-12 bg-white">
                        {/* Section 1: Firma Kimlik */}
                        <div className="space-y-8">
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-6 before:h-px before:flex-1 before:bg-slate-100 after:h-px after:flex-1 after:bg-slate-100">
                                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 text-slate-500 border border-slate-200">01</span>
                                FİRMA KİMLİK BİLGİLERİ
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="md:col-span-2">
                                    <Input
                                        label="Resmi Firma Ünvanı"
                                        required
                                        placeholder="Ticaret sicilindeki tam ünvan"
                                        value={onboardData.name}
                                        onChange={(e) => setOnboardData({ ...onboardData, name: e.target.value })}
                                        className="text-lg font-bold"
                                    />
                                </div>
                                <Input
                                    label="Vergi Numarası / TC Kimlik"
                                    required
                                    placeholder="0000000000"
                                    value={onboardData.taxId}
                                    onChange={(e) => setOnboardData({ ...onboardData, taxId: e.target.value })}
                                    className="text-lg font-bold"
                                />
                                <Input
                                    label="Vergi Dairesi"
                                    required
                                    placeholder="Daire adı"
                                    value={onboardData.taxOffice}
                                    onChange={(e) => setOnboardData({ ...onboardData, taxOffice: e.target.value })}
                                    className="text-lg font-bold"
                                />
                            </div>
                        </div>

                        {/* Section 2: İletişim */}
                        <div className="space-y-8">
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-6 before:h-px before:flex-1 before:bg-slate-100 after:h-px after:flex-1 after:bg-slate-100">
                                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 text-slate-500 border border-slate-200">02</span>
                                İLETİŞİM VE ADRES
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <Input
                                    label="Yetkili Ad Soyad"
                                    required
                                    placeholder="İrtibat kişisi"
                                    value={onboardData.contactName}
                                    onChange={(e) => setOnboardData({ ...onboardData, contactName: e.target.value })}
                                    className="text-lg font-bold"
                                />
                                <Input
                                    label="Kurumsal Telefon"
                                    required
                                    placeholder="+90 000 000 00 00"
                                    value={onboardData.phone}
                                    onChange={(e) => setOnboardData({ ...onboardData, phone: e.target.value })}
                                    className="text-lg font-bold"
                                />
                                <div className="md:col-span-2">
                                    <Textarea
                                        label="Merkez Adresi"
                                        required
                                        placeholder="Tam adres bilgisi"
                                        value={onboardData.address}
                                        onChange={(e) => setOnboardData({ ...onboardData, address: e.target.value })}
                                        className="text-lg font-bold h-24"
                                    />
                                </div>
                                <Input
                                    label="Kurumsal Web Adresi"
                                    placeholder="www.firma.com"
                                    value={onboardData.website}
                                    onChange={(e) => setOnboardData({ ...onboardData, website: e.target.value })}
                                    className="text-lg font-bold"
                                />
                            </div>
                        </div>

                        {/* Section 3: Banka */}
                        <div className="space-y-8">
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-6 before:h-px before:flex-1 before:bg-slate-100 after:h-px after:flex-1 after:bg-slate-100">
                                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 text-slate-500 border border-slate-200">03</span>
                                BANKA HESAP BİLGİLERİ
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                                <Input
                                    label="Banka Adı"
                                    placeholder="Örn: Garanti BBVA"
                                    value={onboardData.bankName}
                                    onChange={(e) => setOnboardData({ ...onboardData, bankName: e.target.value })}
                                    className="bg-white text-lg font-bold"
                                />
                                <Select
                                    label="Hesap Para Birimi"
                                    options={CURRENCIES.map(c => ({ label: c, value: c }))}
                                    value={onboardData.bankCurrency}
                                    onChange={(e) => setOnboardData({ ...onboardData, bankCurrency: e.target.value })}
                                    className="bg-white text-lg font-bold"
                                />
                                <div className="md:col-span-2">
                                    <Input
                                        label="IBAN Numarası"
                                        placeholder="TR00 0000 0000 0000 0000 0000 00"
                                        value={onboardData.bankIban}
                                        onChange={(e) => setOnboardData({ ...onboardData, bankIban: e.target.value })}
                                        className="bg-white text-xl font-mono font-black tracking-tighter"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 4: Güvenlik */}
                        <div className="pt-8">
                            <Card className="bg-blue-600 p-10 border-none shadow-2xl shadow-blue-200 rounded-[2.5rem] relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-5 scale-150 rotate-12 group-hover:rotate-0 transition-transform duration-700">
                                    <svg className="w-32 h-32 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-black text-white uppercase tracking-widest mb-8 flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                    Portal Hesap Güvenliği
                                </h3>
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-black text-blue-100 uppercase tracking-widest mb-3">Yeni Şifreniz <span className="text-red-300">*</span></label>
                                        <input
                                            type="password"
                                            className="w-full h-18 px-8 bg-white/10 border-2 border-white/20 rounded-2xl text-white text-2xl font-black placeholder-white/30 focus:outline-none focus:ring-4 focus:ring-white/20 focus:bg-white/20 transition-all shadow-inner"
                                            placeholder="••••••••"
                                            value={onboardData.password}
                                            onChange={(e) => setOnboardData({ ...onboardData, password: e.target.value })}
                                        />
                                    </div>
                                    <p className="text-sm text-blue-50 font-semibold opacity-80 leading-relaxed max-w-md">
                                        Tedarikçi portalına erişmek ve tekliflerinizi yönetmek için kullanacağınız güvenli giriş şifresidir.
                                    </p>
                                </div>
                            </Card>
                        </div>

                        <div className="pt-12">
                            <Button
                                onClick={handleOnboardSubmit}
                                loading={submitting}
                                className="w-full h-24 rounded-[2rem] text-2xl font-black shadow-2xl shadow-blue-200 tracking-tighter !gap-6 group"
                                variant="primary"
                            >
                                {submitting ? "Bilgiler Kaydediliyor..." : "Aktivasyonu Tamamla ve Giriş Yap"}
                                <svg className="w-8 h-8 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </Button>
                            <div className="mt-8 flex items-center justify-center gap-4">
                                <span className="w-12 h-px bg-slate-100"></span>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Kurumsal Tedarik Ağı Standartları</p>
                                <span className="w-12 h-px bg-slate-100"></span>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        );
    }

    // DEFAULT: OFFER FORM
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <PageHeader
                title={data.rfq.title}
                description={`Sayın ${data.supplier.name}, bu süreç için kurumsal teklifinizi aşağıda detaylandırabilirsiniz.`}
                icon={
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                }
                actions={
                    <div className="flex items-center gap-3">
                        <Badge variant="primary" className="px-4 py-1.5 rounded-xl font-black">{data.rfq.rfxCode}</Badge>
                        {deadlineInfo && (
                            <Badge
                                variant={deadlineInfo.isUrgent ? "error" : "success"}
                                className="px-4 py-1.5 rounded-xl font-black"
                            >
                                {deadlineInfo.date}
                            </Badge>
                        )}
                    </div>
                }
            />

            <PortalNegotiationPanel token={token} />

            {submitted && (
                <Alert
                    variant="success"
                    title="Teklif Başarıyla Gönderildi"
                    dismissible={true}
                    onDismiss={() => setSubmitted(false)}
                >
                    Teklifiniz sisteme kaydedilmiştir. Süreç bitimine kadar dilediğiniz zaman güncelleyebilirsiniz.
                </Alert>
            )}

            <Alert
                variant="info"
                title="Birim Fiyatlandırma Esasları"
            >
                Tüm birim fiyatlar KDV HARİÇ olarak girilmelidir. Sistem, değerlendirmeleri kurumsal vergi standartlarına göre otomatik yapacaktır.
            </Alert>

            <TableContainer>
                <Table>
                    <THead>
                        <TR>
                            <TH className="w-[35%] py-6">Ürün / Hizmet Bilgisi</TH>
                            <TH className="w-[10%] text-center py-6" align="center">Miktar</TH>
                            <TH className="w-[20%] py-6">Marka & Teknik Detay</TH>
                            <TH className="w-[15%] text-right py-6" align="right">Birim Fiyat</TH>
                            <TH className="w-[10%] text-center py-6" align="center">Döviz</TH>
                            <TH className="w-[10%] text-right py-6" align="right">Satır Toplamı</TH>
                        </TR>
                    </THead>
                    <TBody>
                        {data.rfq.items.map((item) => {
                            const price = prices[item.id] || 0;
                            const curr = itemCurrencies[item.id] || "TRY";
                            const total = item.quantity * price;
                            return (
                                <TR key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                                    <TD>
                                        <div className="flex flex-col gap-1 py-1">
                                            <div className="font-black text-slate-800 text-xl tracking-tight group-hover:text-blue-700 transition-colors">{item.name}</div>
                                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                                {item.categoryName && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-wider border border-blue-100/50">
                                                        {item.categoryCode ? `${item.categoryCode} | ` : ""}{item.categoryName}
                                                    </span>
                                                )}
                                                {item.description && (
                                                    <span className="text-xs text-slate-400 italic line-clamp-1">{item.description}</span>
                                                )}
                                            </div>
                                        </div>
                                    </TD>
                                    <TD align="center">
                                        <div className="flex flex-col items-center">
                                            <span className="text-2xl font-black text-slate-900 leading-none">{formatNumberTR(item.quantity)}</span>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{item.unit}</span>
                                        </div>
                                    </TD>
                                    <TD>
                                        <div className="px-2">
                                            <Input
                                                placeholder="Model / Teknik Detay..."
                                                size="sm"
                                                value={notes[item.id] || brands[item.id] || ""}
                                                onChange={e => setNotes({ ...notes, [item.id]: e.target.value })}
                                                className="bg-transparent border-0 border-b-2 border-slate-100 focus:border-blue-400 rounded-none px-0 py-2 font-bold text-slate-700 transition-all placeholder:font-medium placeholder:text-slate-300"
                                            />
                                        </div>
                                    </TD>
                                    <TD align="right">
                                        <div className="px-2">
                                            <Input
                                                type="number"
                                                placeholder="0.00"
                                                size="sm"
                                                value={prices[item.id] || ""}
                                                onChange={e => setPrices({ ...prices, [item.id]: Number(e.target.value) })}
                                                className="w-full font-black text-2xl text-blue-600 bg-blue-50/30 border-2 border-transparent focus:border-blue-400 focus:bg-white rounded-2xl px-4 py-3 text-right transition-all shadow-inner-sm"
                                            />
                                        </div>
                                    </TD>
                                    <TD align="center">
                                        <Select
                                            size="sm"
                                            options={CURRENCIES.map(c => ({ label: c, value: c }))}
                                            value={curr}
                                            onChange={e => setItemCurrencies({ ...itemCurrencies, [item.id]: e.target.value })}
                                            className="bg-slate-50 border-2 border-transparent focus:border-blue-200 rounded-xl font-black text-slate-700"
                                        />
                                    </TD>
                                    <TD align="right">
                                        <div className="flex flex-col items-end py-1">
                                            <span className="text-2xl font-black text-slate-900 font-mono tracking-tighter">{formatNumberTR(total)}</span>
                                            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest leading-none">{curr}</span>
                                        </div>
                                    </TD>
                                </TR>
                            );
                        })}
                    </TBody>
                </Table>

                {/* Table Footer - Totals summary */}
                <div className="bg-slate-900 p-8 flex flex-col md:flex-row items-center justify-between gap-6 border-t-[8px] border-blue-600">
                    <div className="text-center md:text-left">
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-1">Hesaplanan Teklif Özeti</p>
                        <h3 className="text-xl font-black text-white">GENEL TOPLAM <span className="text-blue-500/60 font-medium ml-2">(KDV HARİÇ)</span></h3>
                    </div>
                    <div className="flex flex-wrap justify-center md:justify-end gap-6 border-l border-white/10 pl-8">
                        {Object.keys(currencyTotals).length === 0 || Object.values(currencyTotals).every(v => v === 0) ? (
                            <div className="text-white/20 text-3xl font-black italic tracking-tighter">0,00 TRY</div>
                        ) : (
                            Object.entries(currencyTotals).filter(([_, v]) => v > 0).map(([curr, total]) => (
                                <div key={curr} className="text-right">
                                    <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-0.5">{curr} Bazında</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-black text-white tracking-tighter">{formatNumberTR(total)}</span>
                                        <span className="text-blue-500 text-sm font-black italic">{curr}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </TableContainer>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="p-8 border-none shadow-xl rounded-[2.5rem]">
                    <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </div>
                        Ek Kurumsal Notlarınız
                    </h3>
                    <Textarea
                        placeholder="Ödeme vadesi, teslimat süresi veya diğer kurumsal notlarınızı buraya ekleyebilirsiniz..."
                        value={generalNote}
                        onChange={e => setGeneralNote(e.target.value)}
                        className="bg-slate-50 border-none focus:bg-white h-44 text-lg font-bold p-6 rounded-3xl transition-all"
                    />
                </Card>

                <Card className="p-8 border-none shadow-xl rounded-[2.5rem]">
                    <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                        </div>
                        Dosya Ekleri (PDF, XLSX)
                    </h3>
                    <label className={`flex flex-col items-center justify-center py-12 border-4 border-dashed border-slate-100 rounded-[2.5rem] cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all group ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                        </div>
                        <span className="text-slate-500 text-xs font-black uppercase tracking-[0.2em]">{uploading ? "Sistem Yüklüyor..." : "Dosya Seçin veya Sürükleyin"}</span>
                        <input type="file" className="hidden" multiple onChange={handleFileUpload} disabled={uploading} />
                    </label>
                    {attachments.length > 0 && (
                        <div className="mt-8 space-y-3">
                            {attachments.map((url, idx) => (
                                <div key={idx} className="flex items-center justify-between bg-slate-50 border border-slate-100/50 rounded-2xl px-6 py-4 group hover:bg-white hover:shadow-lg hover:border-blue-200 transition-all">
                                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-slate-700 font-black text-sm truncate flex items-center gap-3">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                        {url.split('/').pop()}
                                    </a>
                                    <button onClick={() => removeAttachment(url)} className="text-slate-300 hover:text-red-600 transition-colors p-2 bg-white rounded-lg shadow-sm border border-slate-100">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>

            <div className="flex justify-end pt-12 pb-24">
                <Button
                    onClick={handleSubmit}
                    loading={submitting}
                    className="h-28 px-16 rounded-[2.5rem] shadow-[0_25px_50px_-12px_rgba(37,99,235,0.5)] text-3xl font-black italic tracking-tighter transform hover:-translate-y-2 active:scale-95 transition-all !gap-10 group"
                    variant="primary"
                >
                    <div>
                        <span className="block text-3xl leading-none">Teklifi Tamamla</span>
                        <span className="block text-[10px] font-black uppercase tracking-[0.4em] text-blue-100 mt-2 opacity-60">Sistem Kaydı İçin Onaylayın</span>
                    </div>
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-xl group-hover:rotate-12 transition-transform">
                        {submitting ? (
                            <div className="w-8 h-8 border-[6px] border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        )}
                    </div>
                </Button>
            </div>
        </div>
    );
}
