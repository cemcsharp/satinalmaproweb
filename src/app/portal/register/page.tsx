"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";

import { SystemSettings, defaultSettings } from "@/lib/settings";

export default function SupplierRegisterPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [categories, setCategories] = useState<any[]>([]);

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

    const [formData, setFormData] = useState({
        // Supplier info
        companyName: "",
        categoryId: "",
        taxId: "",
        taxOffice: "",
        address: "",
        phone: "",
        website: "",
        mersisNo: "",
        commercialRegistrationNo: "",
        // Bank info
        bankName: "",
        bankBranch: "",
        bankIban: "",
        bankAccountNo: "",
        bankCurrency: "TRY",
        // User info
        contactName: "",
        email: "",
        password: "",
        passwordConfirm: "",
    });

    // Fetch Categories
    useEffect(() => {
        fetch("/api/tedarikci/kategori")
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setCategories(data);
            })
            .catch(() => { });
    }, []);

    const renderCategoryOptions = (cats: any[], depth = 0): React.ReactNode[] => {
        return cats.map(cat => (
            <option key={cat.id} value={cat.id}>
                {"- ".repeat(depth)} {cat.name}
            </option>
        ));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validation
        if (!formData.companyName || !formData.email || !formData.password || !formData.contactName) {
            setError("Zorunlu alanları doldurun.");
            return;
        }
        if (formData.password !== formData.passwordConfirm) {
            setError("Şifreler eşleşmiyor.");
            return;
        }
        if (formData.password.length < 6) {
            setError("Şifre en az 6 karakter olmalıdır.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/portal/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            const data = await res.json();

            if (res.ok) {
                router.push("/portal/register/pending");
            } else {
                setError(data.error || "Kayıt sırasında bir hata oluştu.");
            }
        } catch {
            setError("Bir hata oluştu. Lütfen tekrar deneyin.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 flex items-center justify-center p-6 py-12">
            <div className="w-full max-w-2xl">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-sky-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-sky-500/30">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">Tedarikçi Kaydı</h1>
                    <p className="text-sm text-slate-500 mt-1">{siteSettings.siteName} Tedarikçi Portalı&apos;na kayıt olun</p>
                </div>

                <Card className="p-8 shadow-xl border-0">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Company Info Section */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                                <span className="w-6 h-6 bg-sky-100 rounded-full flex items-center justify-center text-blue-600 text-xs font-bold">1</span>
                                Firma Bilgileri
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2 space-y-1">
                                    <label className="text-sm font-medium text-slate-700">Firma Sektörü / Kategorisi *</label>
                                    <select
                                        name="categoryId"
                                        className="w-full h-10 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white"
                                        value={formData.categoryId}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Sektör Seçiniz...</option>
                                        {renderCategoryOptions(categories)}
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <Input
                                        label="Firma Adı *"
                                        name="companyName"
                                        value={formData.companyName}
                                        onChange={handleChange}
                                        placeholder="Örn: ABC Ticaret Ltd. Şti."
                                        required
                                    />
                                </div>
                                <Input
                                    label="Vergi No / TCKN"
                                    name="taxId"
                                    value={formData.taxId}
                                    onChange={handleChange}
                                    placeholder="1234567890"
                                />
                                <Input
                                    label="Vergi Dairesi"
                                    name="taxOffice"
                                    value={formData.taxOffice}
                                    onChange={handleChange}
                                    placeholder="Örn: Kadıköy"
                                />
                                <Input
                                    label="MERSİS No"
                                    name="mersisNo"
                                    value={formData.mersisNo}
                                    onChange={handleChange}
                                    placeholder="16 haneli no"
                                />
                                <Input
                                    label="Ticaret Sicil No"
                                    name="commercialRegistrationNo"
                                    value={formData.commercialRegistrationNo}
                                    onChange={handleChange}
                                    placeholder="Sicil numarası"
                                />
                                <div className="md:col-span-2">
                                    <Input
                                        label="Firma Adresi"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        placeholder="Detaylı adres bilgisi"
                                    />
                                </div>
                                <Input
                                    label="Telefon"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="+90 212 123 45 67"
                                />
                                <Input
                                    label="Website"
                                    name="website"
                                    value={formData.website}
                                    onChange={handleChange}
                                    placeholder="www.example.com"
                                />
                            </div>
                        </div>

                        {/* Bank Info Section */}
                        <div className="space-y-6 pt-4 border-t border-slate-100">
                            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                                <span className="w-6 h-6 bg-sky-100 rounded-full flex items-center justify-center text-indigo-600 text-xs font-bold">2</span>
                                Banka Bilgileri
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <Input
                                        label="IBAN"
                                        name="bankIban"
                                        value={formData.bankIban}
                                        onChange={(e) => {
                                            const val = e.target.value.toUpperCase().replace(/\s/g, '');
                                            setFormData(prev => ({ ...prev, bankIban: val }));
                                        }}
                                        placeholder="TR00 ..."
                                    />
                                </div>
                                <Input
                                    label="Banka Adı"
                                    name="bankName"
                                    value={formData.bankName}
                                    onChange={handleChange}
                                    placeholder="Örn: Garanti BBVA"
                                />
                                <Input
                                    label="Şube"
                                    name="bankBranch"
                                    value={formData.bankBranch}
                                    onChange={handleChange}
                                    placeholder="Banka şubesi"
                                />
                                <Input
                                    label="Hesap No"
                                    name="bankAccountNo"
                                    value={formData.bankAccountNo}
                                    onChange={handleChange}
                                    placeholder="Hesap numarası"
                                />
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700">Para Birimi</label>
                                    <select
                                        name="bankCurrency"
                                        className="w-full h-10 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                                        value={formData.bankCurrency}
                                        onChange={handleChange}
                                    >
                                        <option value="TRY">TRY - Türk Lirası</option>
                                        <option value="USD">USD - Amerikan Doları</option>
                                        <option value="EUR">EUR - Euro</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* User Info Section */}
                        <div className="space-y-6 pt-4 border-t border-slate-100">
                            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                                <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xs font-bold">3</span>
                                Yetkili Bilgileri
                            </h3>
                            <div className="space-y-4">
                                <Input
                                    label="Yetkili Ad Soyad *"
                                    name="contactName"
                                    value={formData.contactName}
                                    onChange={handleChange}
                                    placeholder="Örn: Ahmet Yılmaz"
                                    required
                                />
                                <Input
                                    label="E-posta *"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="email@firma.com"
                                    required
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        label="Şifre *"
                                        name="password"
                                        type="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="En az 6 karakter"
                                        required
                                    />
                                    <Input
                                        label="Şifre Tekrar *"
                                        name="passwordConfirm"
                                        type="password"
                                        value={formData.passwordConfirm}
                                        onChange={handleChange}
                                        placeholder="Şifreyi tekrar girin"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Info Box */}
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                            <div className="flex items-start gap-3">
                                <svg className="w-5 h-5 text-sky-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                <p className="text-sm text-amber-700 font-medium">
                                    Kayıt sonrası hesabınız admin tarafından incelenecektir.
                                    Onay sonrası e-posta ile bilgilendirileceksiniz.
                                </p>
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 font-medium animate-pulse">
                                {error}
                            </div>
                        )}

                        {/* Submit */}
                        <Button
                            type="submit"
                            variant="primary"
                            fullWidth
                            size="lg"
                            loading={loading}
                            className="h-12 bg-sky-600 hover:bg-sky-700 shadow-lg shadow-sky-500/20"
                        >
                            Kaydı Tamamla
                        </Button>
                    </form>
                </Card>

                {/* Login Link */}
                <p className="text-center text-sm text-slate-500 mt-8">
                    Zaten hesabınız var mı?{" "}
                    <Link href="/portal/login" className="text-blue-600 font-semibold hover:underline decoration-2 underline-offset-4">
                        Giriş Yap
                    </Link>
                </p>
            </div>
        </div>
    );
}
