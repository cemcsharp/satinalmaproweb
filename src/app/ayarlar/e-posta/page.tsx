"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import IconButton from "@/components/ui/IconButton";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { fetchJsonWithRetry } from "@/lib/http";

type SmtpSetting = {
    id: string;
    key: string;
    name: string;
    host: string;
    port: number;
    user: string;
    pass: string;
    secure: boolean;
    active: boolean;
    isDefault: boolean;
    from: string;
};

export default function EpostaAyarlariPage() {
    const router = useRouter();
    const { show } = useToast();

    const [smtpSettings, setSmtpSettings] = useState<SmtpSetting[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"add" | "edit">("add");
    const [current, setCurrent] = useState<Partial<SmtpSetting>>({});

    const loadSmtp = async () => {
        setLoading(true);
        try {
            const data = await fetchJsonWithRetry<SmtpSetting[]>("/api/ayarlar/smtp");
            setSmtpSettings(data || []);
        } catch (e) {
            show({ title: "Hata", description: "SMTP ayarları yüklenemedi", variant: "error" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSmtp();
    }, []);

    const handleSave = async () => {
        try {
            const method = modalMode === "add" ? "POST" : "PUT";
            await fetchJsonWithRetry("/api/ayarlar/smtp", {
                method,
                body: JSON.stringify(current),
            });
            show({ title: "Başarılı", description: "SMTP ayarı kaydedildi", variant: "success" });
            setModalOpen(false);
            loadSmtp();
        } catch (e) {
            show({ title: "Hata", description: "Kaydedilemedi", variant: "error" });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Bu ayarı silmek istediğinize emin misiniz?")) return;
        try {
            await fetchJsonWithRetry(`/api/ayarlar/smtp?id=${id}`, { method: "DELETE" });
            show({ title: "Silindi", variant: "success" });
            loadSmtp();
        } catch (e) {
            show({ title: "Hata", description: "Silinemedi", variant: "error" });
        }
    };

    const openAddModal = () => {
        setModalMode("add");
        setCurrent({ port: 587, secure: false, active: true, isDefault: false });
        setModalOpen(true);
    };

    const openEditModal = (smtp: SmtpSetting) => {
        setModalMode("edit");
        setCurrent(smtp);
        setModalOpen(true);
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-10 animate-in fade-in duration-500">
            <PageHeader
                title="E-posta Ayarları"
                description="SMTP sunucularını ve e-posta gönderim ayarlarını yapılandırın."
                actions={
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => router.push("/ayarlar")}>← Geri</Button>
                        <Button onClick={openAddModal}>Yeni SMTP Ekle</Button>
                    </div>
                }
            />

            {loading ? (
                <Card className="p-10">
                    <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                    </div>
                </Card>
            ) : smtpSettings.length === 0 ? (
                <Card className="p-10 text-center">
                    <div className="text-5xl mb-4">📧</div>
                    <h3 className="font-bold text-slate-800 mb-2">SMTP Sunucusu Yok</h3>
                    <p className="text-slate-500 mb-4">E-posta gönderimi için bir SMTP sunucusu ekleyin.</p>
                    <Button onClick={openAddModal}>İlk SMTP'yi Ekle</Button>
                </Card>
            ) : (
                <div className="space-y-4">
                    {smtpSettings.map((smtp) => (
                        <Card key={smtp.id} className="p-5">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="font-bold text-slate-800">{smtp.name || smtp.key}</h3>
                                        <Badge variant={smtp.active ? "success" : "default"}>
                                            {smtp.active ? "Aktif" : "Pasif"}
                                        </Badge>
                                        {smtp.isDefault && (
                                            <Badge variant="info">Varsayılan</Badge>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                                        <div><span className="text-slate-500">Host:</span> <span className="font-mono">{smtp.host}</span></div>
                                        <div><span className="text-slate-500">Port:</span> <span className="font-mono">{smtp.port}</span></div>
                                        <div><span className="text-slate-500">Kullanıcı:</span> {smtp.user}</div>
                                        <div><span className="text-slate-500">SSL/TLS:</span> {smtp.secure ? "Evet" : "Hayır"}</div>
                                        <div className="col-span-2"><span className="text-slate-500">Gönderen:</span> {smtp.from}</div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <IconButton variant="ghost" icon="edit" label="Düzenle" onClick={() => openEditModal(smtp)} />
                                    <IconButton variant="ghost" icon="trash" label="Sil" tone="danger" onClick={() => handleDelete(smtp.id)} />
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Info */}
            <Card className="p-4 bg-emerald-50 border-emerald-200">
                <div className="flex items-start gap-3">
                    <span className="text-xl">💡</span>
                    <div className="text-sm text-emerald-700">
                        <p className="font-medium mb-1">Popüler Ayarlar:</p>
                        <p>Gmail: smtp.gmail.com | Port: 587 | SSL: Açık</p>
                        <p>Outlook: smtp.office365.com | Port: 587 | SSL: Açık</p>
                        <p>Yahoo: smtp.mail.yahoo.com | Port: 465 | SSL: Açık</p>
                    </div>
                </div>
            </Card>

            {/* Modal */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={modalMode === "add" ? "Yeni SMTP Sunucusu" : "SMTP Ayarını Düzenle"}
                size="md"
                footer={
                    <>
                        <Button variant="outline" onClick={() => setModalOpen(false)}>İptal</Button>
                        <Button onClick={handleSave}>Kaydet</Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Tanım (Ör: Gmail)" value={current.name || ""} onChange={(e) => setCurrent({ ...current, name: e.target.value })} />
                        <Input label="Key (Benzersiz Kod)" value={current.key || ""} onChange={(e) => setCurrent({ ...current, key: e.target.value })} disabled={modalMode === "edit"} />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2">
                            <Input label="Host (Ör: smtp.gmail.com)" value={current.host || ""} onChange={(e) => setCurrent({ ...current, host: e.target.value })} />
                        </div>
                        <Input label="Port" type="number" value={current.port || 587} onChange={(e) => setCurrent({ ...current, port: Number(e.target.value) })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Kullanıcı (E-posta)" value={current.user || ""} onChange={(e) => setCurrent({ ...current, user: e.target.value })} />
                        <Input label="Şifre" type="password" value={current.pass || ""} onChange={(e) => setCurrent({ ...current, pass: e.target.value })} placeholder={modalMode === "edit" ? "********" : ""} />
                    </div>
                    <Input label="Gönderen (From)" value={current.from || ""} onChange={(e) => setCurrent({ ...current, from: e.target.value })} />

                    <div className="flex items-center gap-6 pt-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={current.secure || false} onChange={(e) => setCurrent({ ...current, secure: e.target.checked })} className="w-4 h-4" />
                            <span>SSL/TLS (Secure)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={current.isDefault || false} onChange={(e) => setCurrent({ ...current, isDefault: e.target.checked })} className="w-4 h-4" />
                            <span>Varsayılan Sunucu</span>
                        </label>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
