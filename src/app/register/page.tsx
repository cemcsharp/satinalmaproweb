"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { SystemSettings, defaultSettings } from "@/lib/settings";

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        // Basic Info (Always used)
        companyName: "",
        fullName: "",
        email: "",
        phone: "",
        password: "",
        passwordConfirm: "",
        userType: "buyer" as "buyer" | "supplier",
        acceptTerms: false,
        // Detailed Supplier Info (Used only when userType === 'supplier')
        categoryId: "",
        taxId: "",
        taxOffice: "",
        address: "",
        website: "",
        mersisNo: "",
        commercialRegistrationNo: "",
        bankName: "",
        bankBranch: "",
        bankIban: "",
        bankAccountNo: "",
        bankCurrency: "TRY",
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const [categories, setCategories] = useState<any[]>([]);

    const [siteSettings, setSiteSettings] = useState<Partial<SystemSettings>>(defaultSettings);

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

    // Fetch Categories for all registration types
    useEffect(() => {
        fetch("/api/tedarikci/kategori")
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setCategories(data);
            })
            .catch(() => { });
    }, []);

    const validate = () => {
        const errors: Record<string, string> = {};

        if (!formData.companyName.trim()) errors.companyName = "Şirket adı gereklidir";
        if (!formData.fullName.trim()) errors.fullName = "Ad soyad gereklidir";
        if (!formData.email.trim()) {
            errors.email = "E-posta gereklidir";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = "Geçerli bir e-posta giriniz";
        }
        if (!formData.phone.trim()) errors.phone = "Telefon gereklidir";
        if (!formData.password) {
            errors.password = "Şifre gereklidir";
        } else if (formData.password.length < 8) {
            errors.password = "Şifre en az 8 karakter olmalıdır";
        }
        if (formData.password !== formData.passwordConfirm) {
            errors.passwordConfirm = "Şifreler eşleşmiyor";
        }
        if (!formData.acceptTerms) {
            errors.acceptTerms = "Kullanım koşullarını kabul etmelisiniz";
        }

        // Required for both Buyer and Supplier
        if (!formData.categoryId) errors.categoryId = "Sektör seçimi zorunludur";

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        setError(null);

        try {
            // Both Buyer and Supplier now use the comprehensive registration flow
            const endpoint = "/api/portal/register";

            const payload = {
                ...formData,
                contactName: formData.fullName // Mapping fullName to contactName expected by portal API
            };

            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Kayıt oluşturulamadı");
            }

            setSuccess(true);
        } catch (err: any) {
            setError(err.message || "Bir hata oluştu. Lütfen tekrar deneyin.");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (validationErrors[field]) {
            setValidationErrors(prev => {
                const copy = { ...prev };
                delete copy[field];
                return copy;
            });
        }
    };

    const renderCategoryOptions = (cats: any[], depth = 0): React.ReactNode[] => {
        return cats.map(cat => (
            <option key={cat.id} value={cat.id}>
                {"- ".repeat(depth)} {cat.name}
            </option>
        ));
    };

    if (success) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Kayıt Başarılı!</h2>
                    <p className="text-slate-600 mb-6">
                        Hesabınız oluşturuldu. Yönetici onayından sonra giriş yapabileceksiniz.
                    </p>
                    <Link
                        href="/login"
                        className="inline-block w-full py-3 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg transition-colors"
                    >
                        Giriş Yap
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex bg-white">
            {/* Left Column: Branding/Hero */}
            <div className="hidden lg:flex lg:w-1/2 bg-slate-900 relative items-center justify-center p-12 overflow-hidden">
                {/* Background Patterns */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]"></div>
                    <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-sky-600/20 rounded-full blur-[120px]"></div>
                </div>

                <div className="relative z-10 w-full max-w-lg">
                    <Link href="/" className="inline-flex items-center gap-3 group mb-12">
                        <div className="w-12 h-12 bg-sky-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <span className="text-2xl font-bold text-white tracking-tight">{siteSettings.siteName}</span>
                    </Link>

                    <div className="space-y-6">
                        <h1 className="text-5xl font-extrabold text-white leading-tight">
                            Dijital <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-500">satın alma</span> dünyasına hoş geldiniz.
                        </h1>
                        <p className="text-xl text-slate-400 leading-relaxed">
                            Binlerce tedarikçi ve alıcı firma ile ticaretinizi büyütün, operasyonel yükünüzü azaltın.
                        </p>

                        <div className="grid grid-cols-1 gap-6 mt-12">
                            {[
                                { title: 'Geniş Ağ', desc: 'Sektörün lider firmalarıyla anında bağlantı kurun' },
                                { title: 'Verimlilik', desc: 'Süreçlerinizi otomatikleştirerek zaman kazanın' },
                                { title: 'Güvenli Ticaret', desc: 'Uçtan uca şifrelenmiş ve onaylı sistem' }
                            ].map((item, i) => (
                                <div key={i} className="flex gap-4 items-start">
                                    <div className="w-6 h-6 rounded-full bg-sky-500/20 flex items-center justify-center shrink-0 mt-1">
                                        <div className="w-2 h-2 rounded-full bg-sky-500"></div>
                                    </div>
                                    <div>
                                        <div className="text-white font-bold">{item.title}</div>
                                        <div className="text-slate-500 text-sm">{item.desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer info for left side */}
                <div className="absolute bottom-12 left-12 text-slate-500 text-sm">
                    &copy; {new Date().getFullYear()} {siteSettings.siteName} | İşletmeniz için Akıllı Çözümler
                </div>
            </div>

            {/* Right Column: Form */}
            <div className="w-full lg:w-1/2 flex items-start justify-center p-8 bg-slate-50 overflow-y-auto">
                <div className="w-full max-w-xl py-12">
                    <div className="lg:hidden text-center mb-10">
                        <Link href="/" className="inline-flex items-center gap-2 mb-4">
                            <div className="w-10 h-10 bg-sky-600 rounded-xl flex items-center justify-center shadow-md">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            </div>
                            <span className="text-xl font-bold text-slate-900">{siteSettings.siteName}</span>
                        </Link>
                    </div>

                    <div className="bg-white rounded-3xl p-8 lg:p-10 shadow-xl shadow-slate-200/50 border border-slate-100">
                        <div className="mb-8">
                            <h2 className="text-3xl font-bold text-slate-900">Hesap Oluşturun</h2>
                            <p className="text-slate-500 mt-2 text-sm font-medium">Bize katılın ve avantajları yakalayın.</p>
                        </div>

                        {/* User Type Selector */}
                        <div className="flex gap-2 mb-8 p-1 bg-slate-50 rounded-2xl border border-slate-200">
                            <button
                                type="button"
                                onClick={() => handleChange("userType", "buyer")}
                                className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${formData.userType === "buyer"
                                    ? "bg-white text-sky-600 shadow-md border border-slate-100"
                                    : "text-slate-500 hover:text-slate-700"
                                    }`}
                            >
                                Alıcı Firma
                            </button>
                            <button
                                type="button"
                                onClick={() => handleChange("userType", "supplier")}
                                className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${formData.userType === "supplier"
                                    ? "bg-white text-sky-600 shadow-md border border-slate-100"
                                    : "text-slate-500 hover:text-slate-700"
                                    }`}
                            >
                                Tedarikçi
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Section 1: Basic Personel & Company Name */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <span className="w-5 h-5 bg-sky-100 rounded-full flex items-center justify-center text-sky-600 text-[10px]">1</span>
                                    Genel Bilgiler
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-slate-700 ml-1">Şirket Adı *</label>
                                        <input
                                            type="text"
                                            value={formData.companyName}
                                            onChange={(e) => handleChange("companyName", e.target.value)}
                                            placeholder="Şirket ismini girin"
                                            className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all ${validationErrors.companyName ? "border-red-500 bg-red-50" : "border-slate-200 hover:border-slate-300"}`}
                                        />
                                        {validationErrors.companyName && <p className="text-[10px] text-red-500 ml-1 font-medium">{validationErrors.companyName}</p>}
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-slate-700 ml-1">Yetkili Ad Soyad *</label>
                                        <input
                                            type="text"
                                            value={formData.fullName}
                                            onChange={(e) => handleChange("fullName", e.target.value)}
                                            placeholder="Adınız ve soyadınız"
                                            className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all ${validationErrors.fullName ? "border-red-500 bg-red-50" : "border-slate-200 hover:border-slate-300"}`}
                                        />
                                        {validationErrors.fullName && <p className="text-[10px] text-red-500 ml-1 font-medium">{validationErrors.fullName}</p>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-slate-700 ml-1">E-posta *</label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => handleChange("email", e.target.value)}
                                            placeholder="name@company.com"
                                            className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all ${validationErrors.email ? "border-red-500 bg-red-50" : "border-slate-200 hover:border-slate-300"}`}
                                        />
                                        {validationErrors.email && <p className="text-[10px] text-red-500 ml-1 font-medium">{validationErrors.email}</p>}
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-slate-700 ml-1">Telefon *</label>
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => handleChange("phone", e.target.value)}
                                            placeholder="05xx xxx xx xx"
                                            className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all ${validationErrors.phone ? "border-red-500 bg-red-50" : "border-slate-200 hover:border-slate-300"}`}
                                        />
                                        {validationErrors.phone && <p className="text-[10px] text-red-500 ml-1 font-medium">{validationErrors.phone}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Detailed Fields (Shared for Buyer & Supplier now) */}
                            <div className="space-y-4 pt-6 border-t border-slate-100 animate-in fade-in slide-in-from-top-4 duration-500">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <span className="w-5 h-5 bg-sky-100 rounded-full flex items-center justify-center text-sky-600 text-[10px]">2</span>
                                    Firma Detayları & Banka
                                </h3>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-slate-700 ml-1">Firma Sektörü *</label>
                                    <select
                                        value={formData.categoryId}
                                        onChange={(e) => handleChange("categoryId", e.target.value)}
                                        className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all ${validationErrors.categoryId ? "border-red-500 bg-red-50" : "border-slate-200 hover:border-slate-300"}`}
                                    >
                                        <option value="">Sektör Seçiniz...</option>
                                        {renderCategoryOptions(categories)}
                                    </select>
                                    {validationErrors.categoryId && <p className="text-[10px] text-red-500 ml-1 font-medium">{validationErrors.categoryId}</p>}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-slate-700 ml-1">Vergi No / TCKN</label>
                                        <input
                                            type="text"
                                            value={formData.taxId}
                                            onChange={(e) => handleChange("taxId", e.target.value)}
                                            placeholder="10 haneli no"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-slate-700 ml-1">Vergi Dairesi</label>
                                        <input
                                            type="text"
                                            value={formData.taxOffice}
                                            onChange={(e) => handleChange("taxOffice", e.target.value)}
                                            placeholder="Daire adı"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-slate-700 ml-1">MERSİS No</label>
                                        <input
                                            type="text"
                                            value={formData.mersisNo}
                                            onChange={(e) => handleChange("mersisNo", e.target.value)}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-slate-700 ml-1">Ticaret Sicil No</label>
                                        <input
                                            type="text"
                                            value={formData.commercialRegistrationNo}
                                            onChange={(e) => handleChange("commercialRegistrationNo", e.target.value)}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-slate-700 ml-1">IBAN *</label>
                                    <input
                                        type="text"
                                        value={formData.bankIban}
                                        onChange={(e) => handleChange("bankIban", e.target.value.toUpperCase().replace(/\s/g, ''))}
                                        placeholder="TR..."
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-slate-700 ml-1">Banka Adı</label>
                                        <input
                                            type="text"
                                            value={formData.bankName}
                                            onChange={(e) => handleChange("bankName", e.target.value)}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-slate-700 ml-1">Para Birimi</label>
                                        <select
                                            value={formData.bankCurrency}
                                            onChange={(e) => handleChange("bankCurrency", e.target.value)}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                                        >
                                            <option value="TRY">TRY</option>
                                            <option value="USD">USD</option>
                                            <option value="EUR">EUR</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: Password */}
                            <div className="space-y-4 pt-6 border-t border-slate-100">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <span className="w-5 h-5 bg-sky-100 rounded-full flex items-center justify-center text-sky-600 text-[10px]">3</span>
                                    Güvenlik
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-slate-700 ml-1">Şifre *</label>
                                        <input
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) => handleChange("password", e.target.value)}
                                            placeholder="••••••••"
                                            className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all ${validationErrors.password ? "border-red-500 bg-red-50" : "border-slate-200 hover:border-slate-300"}`}
                                        />
                                        {validationErrors.password && <p className="text-[10px] text-red-500 ml-1 font-medium">{validationErrors.password}</p>}
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-slate-700 ml-1">Şifre Tekrar *</label>
                                        <input
                                            type="password"
                                            value={formData.passwordConfirm}
                                            onChange={(e) => handleChange("passwordConfirm", e.target.value)}
                                            placeholder="••••••••"
                                            className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all ${validationErrors.passwordConfirm ? "border-red-500 bg-red-50" : "border-slate-200 hover:border-slate-300"}`}
                                        />
                                        {validationErrors.passwordConfirm && <p className="text-[10px] text-red-500 ml-1 font-medium">{validationErrors.passwordConfirm}</p>}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 px-1 py-2">
                                <input
                                    type="checkbox"
                                    id="acceptTerms"
                                    checked={formData.acceptTerms}
                                    onChange={(e) => handleChange("acceptTerms", e.target.checked)}
                                    className="mt-1 w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 transition-all"
                                />
                                <label htmlFor="acceptTerms" className="text-xs text-slate-600 leading-normal">
                                    <Link href="/kvkk" className="text-sky-600 hover:text-sky-700 font-bold underline transition-colors">KVKK Aydınlatma Metni</Link>&apos;ni ve{" "}
                                    <Link href="/gizlilik-politikasi" className="text-sky-600 hover:text-sky-700 font-bold underline transition-colors">Gizlilik Politikası</Link>&apos;nı okudum, kabul ediyorum.
                                </label>
                            </div>
                            {validationErrors.acceptTerms && <p className="text-[10px] text-red-500 ml-1 font-medium">{validationErrors.acceptTerms}</p>}

                            {error && (
                                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3">
                                    <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    <p className="text-sm text-red-800 font-medium">{error}</p>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-2xl shadow-lg shadow-sky-600/25 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group mt-4"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        Hesap Oluştur
                                        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-8 pt-8 border-t border-slate-100 text-center">
                            <p className="text-slate-600 text-sm font-medium">
                                Zaten bir hesabınız var mı?{" "}
                                <Link href="/login" className="text-sky-600 hover:text-sky-700 font-bold underline-offset-4 hover:underline transition-all">
                                    Giriş Yapın
                                </Link>
                            </p>
                        </div>
                    </div>

                    <div className="mt-8 text-center text-slate-400 text-xs font-medium">
                        © {new Date().getFullYear()} {siteSettings.siteName} | Tüm hakları saklıdır.
                    </div>
                </div>
            </div>
        </div>
    );
}
