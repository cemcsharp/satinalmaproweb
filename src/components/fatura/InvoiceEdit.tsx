import React, { useEffect, useState } from "react";
import { Invoice, InvoiceDetail } from "@/types/fatura";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Card from "@/components/ui/Card";
import { fetchJsonWithRetry } from "@/lib/http";
import { useToast } from "@/components/ui/Toast";

interface InvoiceEditProps {
    item: Invoice;
    onSave: () => void;
    onCancel: () => void;
}

export default function InvoiceEdit({ item, onSave, onCancel }: InvoiceEditProps) {
    const { show } = useToast();
    const [loading, setLoading] = useState(false);
    const [detail, setDetail] = useState<InvoiceDetail | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        const load = async () => {
            try {
                setLoading(true);
                const d = await fetchJsonWithRetry<InvoiceDetail>(`/api/fatura/${item.id}`, { cache: "no-store" }, { retries: 2, backoffMs: 250 });
                if (active) setDetail(d);
            } catch (e: any) {
                if (active) setError(e.message || "Detay yüklenemedi");
            } finally {
                if (active) setLoading(false);
            }
        };
        load();
        return () => { active = false; };
    }, [item.id]);

    const handleSave = async () => {
        if (!detail) return;
        try {
            setLoading(true);
            await fetchJsonWithRetry(`/api/fatura/${detail.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: detail.status, dueDate: detail.dueDate, bank: detail.bank }),
            }, { retries: 1, backoffMs: 200 });
            show({ title: "Güncellendi", description: "Fatura bilgileri başarıyla güncellendi", variant: "success" });
            onSave();
        } catch (e: any) {
            show({ title: "Hata", description: "Güncelleme başarısız oldu", variant: "error" });
        } finally {
            setLoading(false);
        }
    };

    if (loading && !detail) return <div className="p-8 text-center text-sm text-slate-500 animate-pulse">Yükleniyor...</div>;
    if (error) return <div className="p-6 text-sm text-red-600 bg-red-50 rounded-xl border border-red-100">{error}</div>;
    if (!detail) return null;

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-2xl border border-amber-100">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Fatura Düzenle</h3>
                        <p className="text-sm text-slate-500">{detail.number} numaralı faturayı düzenliyorsunuz.</p>
                    </div>
                </div>
            </div>

            <Card variant="glass" className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                        <Select
                            label="Durum"
                            value={detail.status}
                            onChange={(e) => setDetail({ ...detail, status: e.target.value })}
                        >
                            <option value="Beklemede">Beklemede</option>
                            <option value="Onaylandı">Onaylandı</option>
                            <option value="Ödendi">Ödendi</option>
                        </Select>
                    </div>
                    <div>
                        <Input
                            label="Vade Tarihi"
                            type="date"
                            value={detail.dueDate ? String(detail.dueDate).slice(0, 10) : ""}
                            onChange={(e) => setDetail({ ...detail, dueDate: e.target.value })}
                        />
                    </div>
                    <div className="sm:col-span-2">
                        <Input
                            label="Banka"
                            placeholder="Banka adı ve IBAN bilgisi"
                            value={detail.bank || ""}
                            onChange={(e) => setDetail({ ...detail, bank: e.target.value })}
                        />
                    </div>
                </div>
            </Card>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button variant="outline" onClick={onCancel} disabled={loading}>Vazgeç</Button>
                <Button variant="gradient" onClick={handleSave} loading={loading} className="shadow-lg shadow-amber-500/20">Kaydet</Button>
            </div>
        </div>
    );
}
