"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

export default function SozlesmeDuzenlePage() {
    const params = useParams();
    const router = useRouter();
    const { show } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [users, setUsers] = useState<{ id: string; username: string }[]>([]);

    const [form, setForm] = useState({
        number: "",
        title: "",
        parties: "",
        startDate: "",
        endDate: "",
        type: "GENEL",
        status: "ACTIVE",
        responsibleUserId: "",
        notes: ""
    });

    useEffect(() => {
        if (!params.id) return;

        Promise.all([
            fetch(`/api/finans/sozlesmeler/${params.id}`).then(r => r.json()),
            fetch("/api/options").then(r => r.json())
        ]).then(([contract, options]) => {
            setForm({
                number: contract.number || "",
                title: contract.title || "",
                parties: contract.parties || "",
                startDate: contract.startDate?.split("T")[0] || "",
                endDate: contract.endDate?.split("T")[0] || "",
                type: contract.type || "GENEL",
                status: contract.status || "ACTIVE",
                responsibleUserId: contract.responsibleUserId || "",
                notes: contract.notes || ""
            });
            if (options.kullanici) {
                setUsers(options.kullanici.map((u: any) => ({ id: u.id, username: u.label })));
            }
        }).catch(e => {
            show({ title: "Hata", description: e.message, variant: "error" });
        }).finally(() => setLoading(false));
    }, [params.id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title || !form.parties) {
            show({ title: "Eksik", description: "Başlık ve Taraflar zorunludur.", variant: "warning" });
            return;
        }

        setSaving(true);
        try {
            const res = await fetch(`/api/finans/sozlesmeler/${params.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form)
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || "Güncelleme başarısız");
            }

            show({ title: "Kaydedildi", description: "Sözleşme güncellendi.", variant: "success" });
            router.push(`/finans/sozlesmeler/${params.id}`);
        } catch (e: any) {
            show({ title: "Hata", description: e.message, variant: "error" });
        } finally {
            setSaving(false);
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

    const statuses = [
        { value: "ACTIVE", label: "Aktif" },
        { value: "SUSPENDED", label: "Askıda" },
        { value: "TERMINATED", label: "Feshedildi" },
        { value: "EXPIRED", label: "Süresi Doldu" }
    ];

    if (loading) return <div className="p-10"><Skeleton height={400} /></div>;

    return (
        <div className="space-y-6 max-w-3xl mx-auto pb-10">
            <PageHeader
                title="Sözleşme Düzenle"
                description={`${form.number}`}
            />

            <form onSubmit={handleSubmit}>
                <Card className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Sözleşme No"
                            value={form.number}
                            onChange={e => setForm(prev => ({ ...prev, number: e.target.value }))}
                            disabled
                        />
                        <Select
                            label="Durum"
                            value={form.status}
                            onChange={e => setForm(prev => ({ ...prev, status: e.target.value }))}
                        >
                            {statuses.map(s => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                        </Select>
                    </div>

                    <Input
                        label="Başlık *"
                        value={form.title}
                        onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                        required
                    />

                    <Input
                        label="Taraflar *"
                        value={form.parties}
                        onChange={e => setForm(prev => ({ ...prev, parties: e.target.value }))}
                        required
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select
                            label="Sözleşme Tipi"
                            value={form.type}
                            onChange={e => setForm(prev => ({ ...prev, type: e.target.value }))}
                        >
                            {contractTypes.map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </Select>
                        <Select
                            label="Sorumlu"
                            value={form.responsibleUserId}
                            onChange={e => setForm(prev => ({ ...prev, responsibleUserId: e.target.value }))}
                        >
                            <option value="">Atanmamış</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>{u.username}</option>
                            ))}
                        </Select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Başlangıç Tarihi"
                            type="date"
                            value={form.startDate}
                            onChange={e => setForm(prev => ({ ...prev, startDate: e.target.value }))}
                        />
                        <Input
                            label="Bitiş Tarihi"
                            type="date"
                            value={form.endDate}
                            onChange={e => setForm(prev => ({ ...prev, endDate: e.target.value }))}
                        />
                    </div>

                    <Input
                        label="Notlar"
                        multiline
                        rows={3}
                        value={form.notes}
                        onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                    />

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <Button type="button" variant="outline" onClick={() => router.back()}>
                            İptal
                        </Button>
                        <Button type="submit" variant="primary" loading={saving}>
                            Kaydet
                        </Button>
                    </div>
                </Card>
            </form>
        </div>
    );
}
