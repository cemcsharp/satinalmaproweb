import React, { useEffect, useState } from "react";
import { ContractDetail } from "@/types/sozlesme";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { fetchJsonWithRetry } from "@/lib/http";
import { useToast } from "@/components/ui/Toast";

interface ContractEditProps {
    id: string;
    onSave: () => void;
    onCancel: () => void;
}

export default function ContractEdit({ id, onSave, onCancel }: ContractEditProps) {
    const { show } = useToast();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [title, setTitle] = useState("");
    const [status, setStatus] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    useEffect(() => {
        let active = true;
        const load = async () => {
            try {
                setLoading(true);
                const data = await fetchJsonWithRetry<ContractDetail>(`/api/sozlesme/${id}`, { cache: "no-store" }, { retries: 2, backoffMs: 250 });
                if (!active) return;
                setTitle(data.title || "");
                setStatus(data.status || "");
                const sd = data.startDate ? new Date(data.startDate as any) : null;
                const ed = data.endDate ? new Date(data.endDate as any) : null;
                setStartDate(sd ? new Date(sd.getTime() - sd.getTimezoneOffset() * 60000).toISOString().slice(0, 10) : "");
                setEndDate(ed ? new Date(ed.getTime() - ed.getTimezoneOffset() * 60000).toISOString().slice(0, 10) : "");
            } catch (e: any) {
                if (active) setError(e.message || "Detay yüklenemedi");
            } finally {
                if (active) setLoading(false);
            }
        };
        load();
        return () => { active = false; };
    }, [id]);

    const handleSave = async () => {
        try {
            setSaving(true);
            setError(null);
            const body: any = { title, status };
            if (startDate) body.startDate = startDate;
            if (endDate) body.endDate = endDate;

            await fetchJsonWithRetry(`/api/sozlesme/${id}?confirm=true`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            }, { retries: 1, backoffMs: 200 });

            show({ title: "Sözleşme güncellendi", description: "Değişiklikler kaydedildi", variant: "success" });
            onSave();
        } catch (e: any) {
            setError("Kaydetme başarısız. Lütfen tekrar deneyin.");
            show({ title: "Hata", description: "Güncelleme başarısız", variant: "error" });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-4 text-sm text-muted-foreground">Yükleniyor...</div>;
    if (error && !title) return <div className="p-4 text-sm text-red-600">{error}</div>;

    return (
        <div className="space-y-3 text-sm">
            {error && <div className="text-red-600 mb-2">{error}</div>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
                <Input size="sm" label="Başlık" value={title} onChange={(e) => setTitle(e.target.value)} />
                <Select size="sm" label="Durum" value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="Taslak">Taslak</option>
                    <option value="Aktif">Aktif</option>
                    <option value="Askıda">Askıda</option>
                    <option value="Sona Erdi">Sona Erdi</option>
                </Select>
                <Input size="sm" type="date" label="Başlangıç" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                <Input size="sm" type="date" label="Bitiş" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" size="sm" onClick={onCancel} disabled={saving}>Vazgeç</Button>
                <Button size="sm" onClick={handleSave} loading={saving}>Kaydet</Button>
            </div>
        </div>
    );
}
