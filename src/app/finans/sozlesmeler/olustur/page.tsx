"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

export default function SozlesmeOlusturPage() {
    const router = useRouter();
    const { show } = useToast();
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState<{ id: string; username: string }[]>([]);

    const [form, setForm] = useState({
        number: "",
        title: "",
        parties: "",
        startDate: new Date().toISOString().split("T")[0],
        endDate: "",
        type: "GENEL",
        responsibleUserId: "",
        notes: ""
    });

    useEffect(() => {
        // Sorumlu kullanıcı listesi
        fetch("/api/options")
            .then(r => r.json())
            .then(d => {
                if (d.kullanici) setUsers(d.kullanici.map((u: any) => ({ id: u.id, username: u.label })));
            })
            .catch(console.error);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.number || !form.title || !form.parties || !form.startDate) {
            show({ title: "Eksik Bilgi", description: "Sözleşme No, Başlık, Taraflar ve Başlangıç Tarihi zorunludur.", variant: "warning" });
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/finans/sozlesmeler", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form)
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                if (err.error === "duplicate_number") {
                    throw new Error("Bu sözleşme numarası zaten kullanımda.");
                }
                throw new Error(err.message || "Sözleşme oluşturulamadı.");
            }

            const data = await res.json();
            show({ title: "Başarılı", description: `Sözleşme ${data.number} oluşturuldu.`, variant: "success" });
            router.push("/finans/sozlesmeler");
        } catch (e: any) {
            show({ title: "Hata", description: e.message, variant: "error" });
        } finally {
            setLoading(false);
        }
    };

    const contractTypes = [
        { value: "GENEL", label: "Genel Sözleşme" },
        { value: "TEDARIK", label: "Tedarik Sözleşmesi" },
        { value: "HIZMET", label: "Hizmet Sözleşmesi" },
        { value: "CERCEVE", label: "Çerçeve Sözleşme" },
        { value: "BAKIM", label: "Bakım Sözleşmesi" },
        { value: "KIRA", label: "Kira Sözleşmesi" }
    ];

    return (
        <div className="space-y-6 max-w-3xl mx-auto pb-10">
            <PageHeader
                title="Yeni Sözleşme Oluştur"
                description="Kurumsal tedarik sözleşmesi kaydı"
            />

            <form onSubmit={handleSubmit}>
                <Card className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Sözleşme No *"
                            placeholder="SZL-2026-001"
                            value={form.number}
                            onChange={e => setForm(prev => ({ ...prev, number: e.target.value }))}
                            required
                        />
                        <Select
                            label="Sözleşme Tipi"
                            value={form.type}
                            onChange={e => setForm(prev => ({ ...prev, type: e.target.value }))}
                        >
                            {contractTypes.map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </Select>
                    </div>

                    <Input
                        label="Sözleşme Başlığı *"
                        placeholder="2026 Yılı Ofis Malzemeleri Tedarik Sözleşmesi"
                        value={form.title}
                        onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                        required
                    />

                    <Input
                        label="Taraflar *"
                        placeholder="Şirketimiz A.Ş. ↔ Tedarikçi Ltd. Şti."
                        value={form.parties}
                        onChange={e => setForm(prev => ({ ...prev, parties: e.target.value }))}
                        required
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Başlangıç Tarihi *"
                            type="date"
                            value={form.startDate}
                            onChange={e => setForm(prev => ({ ...prev, startDate: e.target.value }))}
                            required
                        />
                        <Input
                            label="Bitiş Tarihi"
                            type="date"
                            value={form.endDate}
                            onChange={e => setForm(prev => ({ ...prev, endDate: e.target.value }))}
                        />
                    </div>

                    <Select
                        label="Sorumlu Kişi"
                        value={form.responsibleUserId}
                        onChange={e => setForm(prev => ({ ...prev, responsibleUserId: e.target.value }))}
                    >
                        <option value="">Atanmamış</option>
                        {users.map(u => (
                            <option key={u.id} value={u.id}>{u.username}</option>
                        ))}
                    </Select>

                    <Input
                        label="Notlar"
                        multiline
                        rows={3}
                        placeholder="Ek bilgiler, özel şartlar..."
                        value={form.notes}
                        onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                    />

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <Button type="button" variant="outline" onClick={() => router.back()}>
                            İptal
                        </Button>
                        <Button type="submit" variant="primary" loading={loading}>
                            Sözleşme Oluştur
                        </Button>
                    </div>
                </Card>
            </form>
        </div>
    );
}
