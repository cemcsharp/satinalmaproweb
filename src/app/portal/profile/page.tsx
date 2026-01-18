"use client";
import React, { useEffect, useState } from "react";

type SupplierProfile = {
    id: string;
    name: string;
    taxId: string | null;
    taxOffice: string | null;
    address: string | null;
    contactName: string | null;
    email: string | null;
    phone: string | null;
    website: string | null;
    bankName: string | null;
    bankBranch: string | null;
    bankIban: string | null;
    bankAccountNo: string | null;
    bankCurrency: string | null;
    commercialRegistrationNo: string | null;
    mersisNo: string | null;
    notes: string | null;
};

export default function ProfilePage() {
    const [profile, setProfile] = useState<SupplierProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState<Partial<SupplierProfile>>({});
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    useEffect(() => {
        async function loadProfile() {
            try {
                const res = await fetch("/api/portal/profile");
                if (res.ok) {
                    const data = await res.json();
                    setProfile(data.profile);
                    setFormData(data.profile);
                }
            } catch (err) {
                console.error("Failed to load profile", err);
            } finally {
                setLoading(false);
            }
        }
        loadProfile();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const res = await fetch("/api/portal/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                const data = await res.json();
                setProfile({ ...profile, ...data.profile });
                setEditing(false);
                setMessage({ type: "success", text: "Profil başarıyla güncellendi!" });
            } else {
                const err = await res.json();
                setMessage({ type: "error", text: err.message || "Güncelleme başarısız." });
            }
        } catch {
            setMessage({ type: "error", text: "Bir hata oluştu." });
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (field: keyof SupplierProfile, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const Field = ({ label, field, readonly = false }: { label: string; field: keyof SupplierProfile; readonly?: boolean }) => (
        <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</label>
            {editing && !readonly ? (
                <input
                    type="text"
                    value={formData[field] || ""}
                    onChange={(e) => handleChange(field, e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm"
                />
            ) : (
                <p className="text-sm text-slate-800 font-medium py-2.5">{profile?.[field] || <span className="text-slate-400 italic">Belirtilmemiş</span>}</p>
            )}
        </div>
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-4 border-slate-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="p-12 text-center">
                <p className="text-slate-500">Profil bilgisi bulunamadı.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Firma Profili</h1>
                    <p className="text-slate-500 text-sm mt-1">İletişim bilgileriniz ve banka hesap bilgilerinizi yönetin.</p>
                </div>
                <div className="flex items-center gap-3">
                    {editing ? (
                        <>
                            <button
                                onClick={() => { setEditing(false); setFormData(profile); }}
                                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
                            >
                                İptal
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center gap-2"
                            >
                                {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                                Kaydet
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => setEditing(true)}
                            className="px-5 py-2 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-colors"
                        >
                            Düzenle
                        </button>
                    )}
                </div>
            </div>

            {/* Success/Error Message */}
            {message && (
                <div className={`p-4 rounded-xl text-sm font-medium ${message.type === "success" ? "bg-sky-50 text-blue-700 border border-sky-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                    {message.text}
                </div>
            )}

            {/* Company Info Section */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </span>
                    Firma Bilgileri
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Field label="Firma Adı" field="name" readonly />
                    <Field label="Vergi No" field="taxId" readonly />
                    <Field label="Vergi Dairesi" field="taxOffice" readonly />
                    <Field label="Ticaret Sicil No" field="commercialRegistrationNo" readonly />
                    <Field label="MERSİS No" field="mersisNo" readonly />
                    <Field label="Adres" field="address" />
                </div>
            </div>

            {/* Contact Info Section */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <span className="w-8 h-8 bg-sky-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </span>
                    İletişim Bilgileri
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Field label="Yetkili Kişi" field="contactName" />
                    <Field label="E-posta" field="email" />
                    <Field label="Telefon" field="phone" />
                    <Field label="Web Sitesi" field="website" />
                </div>
            </div>

            {/* Bank Info Section */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <span className="w-8 h-8 bg-sky-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                    </span>
                    Banka Bilgileri
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Field label="Banka Adı" field="bankName" />
                    <Field label="Şube" field="bankBranch" />
                    <Field label="IBAN" field="bankIban" />
                    <Field label="Hesap No" field="bankAccountNo" />
                    <Field label="Para Birimi" field="bankCurrency" />
                </div>
            </div>

            {/* Notes Section */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-800 mb-4">Notlar</h2>
                {editing ? (
                    <textarea
                        value={formData.notes || ""}
                        onChange={(e) => handleChange("notes", e.target.value)}
                        rows={4}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm resize-none"
                        placeholder="Ek notlarınızı buraya yazabilirsiniz..."
                    />
                ) : (
                    <p className="text-sm text-slate-600">{profile.notes || <span className="text-slate-400 italic">Not eklenmemiş.</span>}</p>
                )}
            </div>
        </div>
    );
}
