"use client";
import { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

interface GeneralSettings {
    siteName: string;
    siteDescription: string;
    supportEmail: string;
    supportPhone: string;
    currency: string;
    timezone: string;
}

const defaultSettings: GeneralSettings = {
    siteName: "SatınalmaPro",
    siteDescription: "B2B Satınalma Platformu",
    supportEmail: "destek@satinalmapro.com",
    supportPhone: "+90 212 000 00 00",
    currency: "TRY",
    timezone: "Europe/Istanbul"
};

export default function GeneralSettingsPage() {
    const [settings, setSettings] = useState<GeneralSettings>(defaultSettings);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Sayfa yüklenince ayarları çek
    useEffect(() => {
        fetch("/api/admin/settings")
            .then(res => res.json())
            .then(data => {
                if (data.ok && data.settings) {
                    setSettings({
                        siteName: data.settings.siteName || defaultSettings.siteName,
                        siteDescription: data.settings.siteDescription || defaultSettings.siteDescription,
                        supportEmail: data.settings.supportEmail || defaultSettings.supportEmail,
                        supportPhone: data.settings.supportPhone || defaultSettings.supportPhone,
                        currency: data.settings.currency || defaultSettings.currency,
                        timezone: data.settings.timezone || defaultSettings.timezone,
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
            const res = await fetch("/api/admin/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ settings })
            });

            const data = await res.json();

            if (data.ok) {
                setMessage({ type: "success", text: "✅ Ayarlar başarıyla kaydedildi!" });
            } else {
                setMessage({ type: "error", text: "❌ Ayarlar kaydedilemedi: " + (data.error || "Bilinmeyen hata") });
            }
        } catch (error) {
            setMessage({ type: "error", text: "❌ Bağlantı hatası" });
        }

        setSaving(false);
    };

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-500 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Genel Ayarlar</h1>
                    <p className="text-slate-500">Platform genel ayarlarını buradan yapılandırabilirsiniz.</p>
                </div>
            </div>

            {message && (
                <div className={`p-4 rounded-lg ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                    {message.text}
                </div>
            )}

            <Card title="Site Bilgileri">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Platform Adı</label>
                        <input
                            type="text"
                            value={settings.siteName}
                            onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Açıklama</label>
                        <textarea
                            value={settings.siteDescription}
                            onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            rows={2}
                        />
                    </div>
                </div>
            </Card>

            <Card title="İletişim Bilgileri">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Destek E-posta</label>
                        <input
                            type="email"
                            value={settings.supportEmail}
                            onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Destek Telefon</label>
                        <input
                            type="tel"
                            value={settings.supportPhone}
                            onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        />
                    </div>
                </div>
            </Card>

            <Card title="Bölgesel Ayarlar">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Varsayılan Para Birimi</label>
                        <select
                            value={settings.currency}
                            onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        >
                            <option value="TRY">TRY - Türk Lirası</option>
                            <option value="USD">USD - Amerikan Doları</option>
                            <option value="EUR">EUR - Euro</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Saat Dilimi</label>
                        <select
                            value={settings.timezone}
                            onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        >
                            <option value="Europe/Istanbul">Europe/Istanbul (UTC+3)</option>
                            <option value="UTC">UTC</option>
                        </select>
                    </div>
                </div>
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving}>
                    {saving ? "Kaydediliyor..." : "Ayarları Kaydet"}
                </Button>
            </div>
        </div>
    );
}
