"use client";
import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

interface DemoRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function DemoRequestModal({ isOpen, onClose }: DemoRequestModalProps) {
    const { show } = useToast();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        name: "",
        email: "",
        company: "",
        phone: "",
        notes: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name || !form.email) {
            show({ title: "Hata", description: "Lütfen isim ve e-posta alanlarını doldurun.", variant: "error" });
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/demo-request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form)
            });

            if (res.ok) {
                show({ title: "Başarılı", description: "Talebiniz alındı. En kısa sürede sizinle iletişime geçeceğiz.", variant: "success" });
                setForm({ name: "", email: "", company: "", phone: "", notes: "" });
                onClose();
            } else {
                throw new Error("submission_failed");
            }
        } catch (error) {
            show({ title: "Hata", description: "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.", variant: "error" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Ücretsiz Demo Talep Edin"
            footer={
                <div className="flex gap-3 justify-end">
                    <Button variant="ghost" onClick={onClose} disabled={loading}>Vazgeç</Button>
                    <Button variant="gradient" onClick={handleSubmit} loading={loading}>Talebi Gönder</Button>
                </div>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-sm text-slate-500 mb-6">
                    satinalma.app platformunu yakından tanımak ve işletmeniz için nasıl değer yaratabileceğimizi görüşmek için formu doldurun.
                </p>
                <Input
                    label="Ad Soyad *"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Örn: Ahmet Yılmaz"
                    required
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                        label="Kurumsal E-posta *"
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="ahmet@firma.com"
                        required
                    />
                    <Input
                        label="Telefon"
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="05xx xxx xx xx"
                    />
                </div>
                <Input
                    label="Firma Adı"
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    placeholder="Şirketinizin adı"
                />
                <div>
                    <label className="text-xs font-semibold text-slate-500 ml-1 uppercase tracking-wide mb-1.5 block">
                        Kısa Not (Opsiyonel)
                    </label>
                    <textarea
                        className="w-full rounded-xl border border-slate-200/60 bg-white/50 px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all resize-none h-24"
                        placeholder="Süreçleriniz hakkında kısa bir bilgi verebilirsiniz..."
                        value={form.notes}
                        onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    />
                </div>
            </form>
        </Modal>
    );
}
