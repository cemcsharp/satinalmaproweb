import React, { useEffect, useState } from "react";
import { ContractDetail } from "@/types/sozlesme";
import Button from "@/components/ui/Button";
import { fetchJsonWithRetry } from "@/lib/http";

interface ContractViewProps {
    id: string;
    onClose: () => void;
    onEdit: (id: string) => void;
}

export default function ContractView({ id, onClose, onEdit }: ContractViewProps) {
    const [data, setData] = useState<ContractDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        const load = async () => {
            try {
                setLoading(true);
                const d = await fetchJsonWithRetry<ContractDetail>(`/api/sozlesme/${id}`, { cache: "no-store" }, { retries: 2, backoffMs: 250 });
                if (active) setData(d);
            } catch (e: any) {
                if (active) setError(e.message || "Detay yüklenemedi");
            } finally {
                if (active) setLoading(false);
            }
        };
        load();
        return () => { active = false; };
    }, [id]);

    if (loading) return <div className="p-4 text-sm text-muted-foreground">Yükleniyor...</div>;
    if (error) return <div className="p-4 text-sm text-red-600">{error}</div>;
    if (!data) return null;

    return (
        <div className="space-y-3 text-sm">
            <div><span className="font-medium text-gray-600">No:</span> {data.number}</div>
            <div><span className="font-medium text-gray-600">Başlık:</span> {data.title}</div>
            <div><span className="font-medium text-gray-600">Durum:</span> {data.status}</div>
            <div><span className="font-medium text-gray-600">Versiyon:</span> {data.version ?? "-"}</div>
            <div><span className="font-medium text-gray-600">Başlangıç:</span> {data.startDate ? new Date(data.startDate as any).toLocaleDateString() : "-"}</div>
            <div><span className="font-medium text-gray-600">Bitiş:</span> {data.endDate ? new Date(data.endDate as any).toLocaleDateString() : "-"}</div>
            {data.parties ? (<div><span className="font-medium text-gray-600">Taraflar:</span> {data.parties}</div>) : null}

            <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" size="sm" onClick={onClose}>Kapat</Button>
                <Button size="sm" onClick={() => { onClose(); onEdit(id); }}>Güncelle</Button>
            </div>
        </div>
    );
}
