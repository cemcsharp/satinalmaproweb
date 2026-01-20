"use client";
import { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

interface FAQItem { question: string; answer: string; }
interface SolutionCard { icon: string; title: string; description: string; }
interface FeaturePoint { title: string; description: string; }

interface GeneralSettings {
    siteName: string;
    siteDescription: string;
    supportEmail: string;
    supportPhone: string;
    currency: string;
    timezone: string;
    heroTitle: string;
    heroSubtitle: string;
    heroCTAText: string;
    statsYears: string;
    statsSuppliers: string;
    statsTransactions: string;
    faqItems: FAQItem[];
    solutionsTitle: string;
    solutionsSubtitle: string;
    solutionCards: SolutionCard[];
    buyerTitle: string;
    buyerSubtitle: string;
    buyerFeatures: FeaturePoint[];
    supplierTitle: string;
    supplierSubtitle: string;
    supplierFeatures: FeaturePoint[];
    ctaTitle: string;
    ctaSubtitle: string;
}

const defaultSettings: GeneralSettings = {
    siteName: "satinalma.app",
    siteDescription: "Kurumsal e-Satınalma Platformu",
    supportEmail: "destek@satinalma.app",
    supportPhone: "+90 212 000 00 00",
    currency: "TRY",
    timezone: "Europe/Istanbul",
    heroTitle: "Kurumsal Satınalmayı Yeniden Tanımlıyoruz",
    heroSubtitle: "",
    heroCTAText: "Ücretsiz Demo İste",
    statsYears: "20+",
    statsSuppliers: "35K",
    statsTransactions: "1M+",
    faqItems: [],
    solutionsTitle: "",
    solutionsSubtitle: "",
    solutionCards: [],
    buyerTitle: "",
    buyerSubtitle: "",
    buyerFeatures: [],
    supplierTitle: "",
    supplierSubtitle: "",
    supplierFeatures: [],
    ctaTitle: "",
    ctaSubtitle: ""
};

const TabButton = ({ id, label, icon, activeTab, setActiveTab }: { id: string, label: string, icon: string, activeTab: string, setActiveTab: (id: any) => void }) => (
    <button onClick={() => setActiveTab(id)} className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${activeTab === id ? "border-sky-500 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
        {icon} {label}
    </button>
);

export default function GeneralSettingsPage() {
    const [settings, setSettings] = useState<GeneralSettings>(defaultSettings);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<"system" | "hero" | "solutions" | "features" | "faq_cta">("system");
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    useEffect(() => {
        fetch("/api/admin/settings")
            .then(res => res.json())
            .then(data => {
                if (data.ok && data.settings) {
                    const s = data.settings;
                    const parseJson = (val: any) => typeof val === "string" ? JSON.parse(val) : (val || []);

                    setSettings({
                        ...defaultSettings,
                        ...s,
                        faqItems: parseJson(s.faqItems),
                        solutionCards: parseJson(s.solutionCards),
                        buyerFeatures: parseJson(s.buyerFeatures),
                        supplierFeatures: parseJson(s.supplierFeatures),
                    });
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const payload = {
                ...settings,
                faqItems: JSON.stringify(settings.faqItems),
                solutionCards: JSON.stringify(settings.solutionCards),
                buyerFeatures: JSON.stringify(settings.buyerFeatures),
                supplierFeatures: JSON.stringify(settings.supplierFeatures),
            };
            const res = await fetch("/api/admin/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ settings: payload })
            });
            const data = await res.json();
            if (data.ok) setMessage({ type: "success", text: "✅ Ayarlar başarıyla kaydedildi!" });
            else setMessage({ type: "error", text: "❌ Ayarlar kaydedilemedi: " + (data.error || "Bilinmeyen hata") });
        } catch (error) {
            setMessage({ type: "error", text: "❌ Bağlantı hatası" });
        }
        setSaving(false);
    };

    // List Management Helpers
    const addItem = (key: keyof GeneralSettings, newItem: any) => {
        setSettings({ ...settings, [key]: [...(settings[key] as any[]), newItem] });
    };
    const removeItem = (key: keyof GeneralSettings, index: number) => {
        setSettings({ ...settings, [key]: (settings[key] as any[]).filter((_, i) => i !== index) });
    };
    const updateListItem = (key: keyof GeneralSettings, index: number, field: string, value: string) => {
        const updated = [...(settings[key] as any[])];
        updated[index] = { ...updated[index], [field]: value };
        setSettings({ ...settings, [key]: updated });
    };

    if (loading) return <div className="p-6 flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-12 w-12 border-4 border-sky-500 border-t-transparent"></div></div>;

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            <div><h1 className="text-2xl font-bold text-slate-800">Gelişmiş Genel Ayarlar</h1><p className="text-slate-500">Platformun tüm alanlarını buradan yönetin.</p></div>

            {message && <div className={`p-4 rounded-lg border ${message.type === "success" ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}>{message.text}</div>}

            <div className="flex gap-2 border-b border-slate-200 overflow-x-auto pb-px">
                <TabButton id="system" label="Sistem" icon="🔧" activeTab={activeTab} setActiveTab={setActiveTab} />
                <TabButton id="hero" label="Hero & Stats" icon="🚀" activeTab={activeTab} setActiveTab={setActiveTab} />
                <TabButton id="solutions" label="Çözümler" icon="💎" activeTab={activeTab} setActiveTab={setActiveTab} />
                <TabButton id="features" label="Özellikler" icon="⚡" activeTab={activeTab} setActiveTab={setActiveTab} />
                <TabButton id="faq_cta" label="SSS & CTA" icon="💬" activeTab={activeTab} setActiveTab={setActiveTab} />
            </div>

            {activeTab === "system" && <div className="space-y-6">
                <Card title="Site Bilgileri"><div className="space-y-4">
                    <div><label className="block text-sm font-bold text-slate-700 mb-1">Platform Adı</label><input type="text" value={settings.siteName} onChange={(e) => setSettings({ ...settings, siteName: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500" /></div>
                    <div><label className="block text-sm font-bold text-slate-700 mb-1">Açıklama</label><textarea value={settings.siteDescription} onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500" rows={2} /></div>
                </div></Card>
                <Card title="İletişim"><div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-bold text-slate-700 mb-1">E-posta</label><input type="email" value={settings.supportEmail} onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
                    <div><label className="block text-sm font-bold text-slate-700 mb-1">Telefon</label><input type="tel" value={settings.supportPhone} onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
                </div></Card>
            </div>}

            {activeTab === "hero" && <div className="space-y-6">
                <Card title="Hero Bölümü"><div className="space-y-4">
                    <div><label className="block text-sm font-bold text-slate-700 mb-1">Ana Başlık</label><input type="text" value={settings.heroTitle} onChange={(e) => setSettings({ ...settings, heroTitle: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
                    <div><label className="block text-sm font-bold text-slate-700 mb-1">Alt Başlık</label><textarea value={settings.heroSubtitle} onChange={(e) => setSettings({ ...settings, heroSubtitle: e.target.value })} className="w-full px-3 py-2 border rounded-lg" rows={2} /></div>
                    <div><label className="block text-sm font-bold text-slate-700 mb-1">CTA Buton</label><input type="text" value={settings.heroCTAText} onChange={(e) => setSettings({ ...settings, heroCTAText: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
                </div></Card>
                <Card title="İstatistikler"><div className="grid grid-cols-3 gap-4">
                    <div><label className="block text-sm font-bold text-slate-700 mb-1">Tecrübe</label><input type="text" value={settings.statsYears} onChange={(e) => setSettings({ ...settings, statsYears: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
                    <div><label className="block text-sm font-bold text-slate-700 mb-1">Tedarikçi</label><input type="text" value={settings.statsSuppliers} onChange={(e) => setSettings({ ...settings, statsSuppliers: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
                    <div><label className="block text-sm font-bold text-slate-700 mb-1">İşlem</label><input type="text" value={settings.statsTransactions} onChange={(e) => setSettings({ ...settings, statsTransactions: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
                </div></Card>
            </div>}

            {activeTab === "solutions" && <div className="space-y-6">
                <Card title="Çözümler Başlığı"><div className="space-y-4">
                    <div><label className="block text-sm font-bold text-slate-700 mb-1">Üst Başlık</label><input type="text" value={settings.solutionsTitle} onChange={(e) => setSettings({ ...settings, solutionsTitle: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
                    <div><label className="block text-sm font-bold text-slate-700 mb-1">Açıklama</label><textarea value={settings.solutionsSubtitle} onChange={(e) => setSettings({ ...settings, solutionsSubtitle: e.target.value })} className="w-full px-3 py-2 border rounded-lg" rows={2} /></div>
                </div></Card>
                <Card title="Çözüm Kartları"><div className="space-y-4">
                    {settings.solutionCards.map((card, i) => (
                        <div key={i} className="p-4 bg-slate-50 border rounded-lg space-y-3 relative">
                            <button onClick={() => removeItem("solutionCards", i)} className="absolute top-2 right-2 text-red-500 font-bold">Sil</button>
                            <div className="grid grid-cols-2 gap-3">
                                <input placeholder="İkon (e.g. zap, star)" value={card.icon} onChange={(e) => updateListItem("solutionCards", i, "icon", e.target.value)} className="w-full px-3 py-2 border rounded" />
                                <input placeholder="Başlık" value={card.title} onChange={(e) => updateListItem("solutionCards", i, "title", e.target.value)} className="w-full px-3 py-2 border rounded" />
                            </div>
                            <textarea placeholder="Açıklama" value={card.description} onChange={(e) => updateListItem("solutionCards", i, "description", e.target.value)} className="w-full px-3 py-2 border rounded w-full" rows={2} />
                        </div>
                    ))}
                    <button onClick={() => addItem("solutionCards", { icon: "zap", title: "Yeni Çözüm", description: "Açıklama buraya..." })} className="w-full py-2 border-2 border-dashed rounded-lg text-slate-400 hover:text-sky-500 hover:border-sky-500">+ Yeni Kart Ekle</button>
                </div></Card>
            </div>}

            {activeTab === "features" && <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                    <Card title="Alıcı Özellikleri (Buyer)"><div className="space-y-4">
                        <input value={settings.buyerTitle} onChange={(e) => setSettings({ ...settings, buyerTitle: e.target.value })} className="w-full px-3 py-2 border rounded font-bold" placeholder="Ana Başlık" />
                        <textarea value={settings.buyerSubtitle} onChange={(e) => setSettings({ ...settings, buyerSubtitle: e.target.value })} className="w-full px-3 py-2 border rounded text-sm" rows={2} placeholder="Alt Açıklama" />
                        <div className="space-y-2">
                            {settings.buyerFeatures.map((f, i) => (
                                <div key={i} className="p-3 bg-blue-50/50 border rounded-lg">
                                    <div className="flex justify-between mb-2"><input value={f.title} onChange={(e) => updateListItem("buyerFeatures", i, "title", e.target.value)} className="bg-transparent font-bold text-sm w-full" /><button onClick={() => removeItem("buyerFeatures", i)} className="text-red-400">×</button></div>
                                    <textarea value={f.description} onChange={(e) => updateListItem("buyerFeatures", i, "description", e.target.value)} className="w-full text-xs bg-transparent border-0 focus:ring-0" rows={2} />
                                </div>
                            ))}
                            <button onClick={() => addItem("buyerFeatures", { title: "Yeni Özellik", description: "..." })} className="text-xs text-blue-600 font-bold">+ Madde Ekle</button>
                        </div>
                    </div></Card>
                    <Card title="Tedarikçi Özellikleri (Supplier)"><div className="space-y-4">
                        <input value={settings.supplierTitle} onChange={(e) => setSettings({ ...settings, supplierTitle: e.target.value })} className="w-full px-3 py-2 border rounded font-bold" placeholder="Ana Başlık" />
                        <textarea value={settings.supplierSubtitle} onChange={(e) => setSettings({ ...settings, supplierSubtitle: e.target.value })} className="w-full px-3 py-2 border rounded text-sm" rows={2} placeholder="Alt Açıklama" />
                        <div className="space-y-2">
                            {settings.supplierFeatures.map((f, i) => (
                                <div key={i} className="p-3 bg-slate-50 border rounded-lg">
                                    <div className="flex justify-between mb-2"><input value={f.title} onChange={(e) => updateListItem("supplierFeatures", i, "title", e.target.value)} className="bg-transparent font-bold text-sm w-full" /><button onClick={() => removeItem("supplierFeatures", i)} className="text-red-400">×</button></div>
                                    <textarea value={f.description} onChange={(e) => updateListItem("supplierFeatures", i, "description", e.target.value)} className="w-full text-xs bg-transparent border-0 focus:ring-0" rows={2} />
                                </div>
                            ))}
                            <button onClick={() => addItem("supplierFeatures", { title: "Yeni Özellik", description: "..." })} className="text-xs text-blue-600 font-bold">+ Madde Ekle</button>
                        </div>
                    </div></Card>
                </div>
            </div>}

            {activeTab === "faq_cta" && <div className="space-y-6">
                <Card title="SSS (Sıkça Sorulan Sorular)"><div className="space-y-4">
                    {settings.faqItems.map((item, i) => (
                        <div key={i} className="p-4 bg-slate-50 border rounded-lg space-y-3">
                            <div className="flex justify-between items-center"><span className="text-xs font-bold text-slate-400">Soru #{i + 1}</span><button onClick={() => removeItem("faqItems", i)} className="text-red-500 font-bold text-xs uppercase">Sİl</button></div>
                            <input value={item.question} onChange={(e) => updateListItem("faqItems", i, "question", e.target.value)} className="w-full px-3 py-2 border rounded" placeholder="Soru" />
                            <textarea value={item.answer} onChange={(e) => updateListItem("faqItems", i, "answer", e.target.value)} className="w-full px-3 py-2 border rounded" rows={2} placeholder="Cevap" />
                        </div>
                    ))}
                    <button onClick={() => addItem("faqItems", { question: "", answer: "" })} className="w-full py-2 border-2 border-dashed rounded-lg text-slate-400 hover:text-sky-500 hover:border-sky-500">+ Soru Ekle</button>
                </div></Card>
                <Card title="Final CTA Bölümü"><div className="space-y-4">
                    <div><label className="block text-sm font-bold text-slate-700 mb-1">Ana Başlık</label><input value={settings.ctaTitle} onChange={(e) => setSettings({ ...settings, ctaTitle: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
                    <div><label className="block text-sm font-bold text-slate-700 mb-1">Alt Metin</label><textarea value={settings.ctaSubtitle} onChange={(e) => setSettings({ ...settings, ctaSubtitle: e.target.value })} className="w-full px-3 py-2 border rounded-lg" rows={2} /></div>
                </div></Card>
            </div>}

            <div className="flex justify-end pt-6 border-t font-semibold"><Button onClick={handleSave} disabled={saving}>{saving ? "Kaydediliyor..." : "Tüm Ayarları Kaydet"}</Button></div>
        </div>
    );
}
