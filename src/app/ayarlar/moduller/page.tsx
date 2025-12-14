"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { useModuleAccess } from "@/contexts/ModuleAccessContext";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

type ModuleInfo = { key: string; label: string };
type ModuleStatus = Record<string, boolean>; // moduleKey -> enabled

export default function ModulYonetimiPage() {
    const router = useRouter();
    const { show } = useToast();
    const { refresh: refreshModuleAccess } = useModuleAccess();
    const [modules, setModules] = useState<ModuleInfo[]>([]);
    const [status, setStatus] = useState<ModuleStatus>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);

    // Load module settings
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const res = await fetch("/api/ayarlar/modul-erisim");
                const data = await res.json();
                setModules(data.modules || []);
                // Extract only enabled status
                const statusMap: ModuleStatus = {};
                for (const mod of data.modules || []) {
                    statusMap[mod.key] = data.access?.[mod.key]?.enabled ?? true;
                }
                setStatus(statusMap);
            } catch (e) {
                console.error("Settings load error:", e);
                show({ title: "Hata", description: "Ayarlar yüklenemedi", variant: "error" });
            } finally {
                setLoading(false);
            }
        };
        loadSettings();
    }, []);

    // Toggle module
    const toggleModule = async (moduleKey: string) => {
        const currentValue = status[moduleKey] ?? true;
        setSaving(moduleKey);

        try {
            const res = await fetch("/api/ayarlar/modul-erisim", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ moduleKey, moduleEnabled: !currentValue })
            });

            if (res.ok) {
                setStatus(prev => ({ ...prev, [moduleKey]: !currentValue }));
                await refreshModuleAccess();
                show({
                    title: !currentValue ? "Modül Aktifleştirildi" : "Modül Pasifleştirildi",
                    variant: "success"
                });
            } else {
                throw new Error("API error");
            }
        } catch (e: any) {
            show({ title: "Hata", description: e.message, variant: "error" });
        } finally {
            setSaving(null);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-10 animate-in fade-in duration-500">
            <PageHeader
                title="Modül Yönetimi"
                description="Sistem modüllerini açın veya kapatın. Pasif modüller menüde görünmez."
                actions={
                    <Button variant="outline" onClick={() => router.push("/ayarlar")}>
                        ← Geri
                    </Button>
                }
            />

            <Card className="p-6">
                {loading ? (
                    <div className="flex justify-center py-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {modules.map(mod => {
                            const isEnabled = status[mod.key] ?? true;
                            const isSaving = saving === mod.key;

                            return (
                                <div
                                    key={mod.key}
                                    className={`flex items-center justify-between py-4 px-2 transition-all ${isEnabled ? "" : "opacity-60"
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold ${isEnabled
                                                ? "bg-gradient-to-br from-blue-500 to-indigo-600"
                                                : "bg-slate-400"
                                            }`}>
                                            {mod.label.charAt(0)}
                                        </div>
                                        <div>
                                            <span className="font-semibold text-slate-800">{mod.label}</span>
                                            <Badge
                                                variant={isEnabled ? "success" : "error"}
                                                className="ml-2"
                                            >
                                                {isEnabled ? "Aktif" : "Pasif"}
                                            </Badge>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => toggleModule(mod.key)}
                                        disabled={isSaving}
                                        className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 ${isEnabled ? "bg-blue-600" : "bg-slate-300"
                                            }`}
                                        aria-label={`${mod.label} modülünü ${isEnabled ? "kapat" : "aç"}`}
                                    >
                                        <span
                                            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isEnabled ? "translate-x-5" : "translate-x-0"
                                                }`}
                                        />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </Card>

            <Card className="p-4 bg-blue-50 border-blue-200">
                <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                        <p className="font-medium text-blue-800">Bilgi</p>
                        <p className="text-sm text-blue-700">
                            Modül değişiklikleri anında uygulanır. Pasif modüller menüde görünmez.
                            Kullanıcı izinleri için <strong>Ayarlar → Roller ve Yetkiler</strong> sayfasını kullanın.
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    );
}
