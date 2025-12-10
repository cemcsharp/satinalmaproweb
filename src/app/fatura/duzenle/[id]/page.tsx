"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { InvoiceDetail } from "@/types/fatura";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import { fetchJsonWithRetry } from "@/lib/http";
import { useToast } from "@/components/ui/Toast";
import Skeleton from "@/components/ui/Skeleton";

export default function FaturaDuzenlePage() {
    const { id } = useParams();
    const router = useRouter();
    const { show } = useToast();
    const [detail, setDetail] = useState<InvoiceDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;
        let active = true;
        const load = async () => {
            try {
                setLoading(true);
                const d = await fetchJsonWithRetry<InvoiceDetail>(`/api/fatura/${id}`, { cache: "no-store" }, { retries: 2, backoffMs: 250 });
                if (active) setDetail(d);
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
        if (!detail) return;
        try {
            setSaving(true);
            await fetchJsonWithRetry(`/api/fatura/${detail.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: detail.status, dueDate: detail.dueDate, bank: detail.bank }),
            }, { retries: 1, backoffMs: 200 });
            show({ title: "Güncellendi", description: "Fatura bilgileri başarıyla güncellendi", variant: "success" });
            router.push("/fatura/liste");
        } catch (e: any) {
            show({ title: "Hata", description: "Güncelleme başarısız oldu", variant: "error" });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-10 text-center"><Skeleton height={300} /></div>;
    if (error) return <div className="p-10 text-center text-red-600">{error}</div>;
    if (!detail) return null;

    return (
        <section className="space-y-6 max-w-4xl mx-auto pb-10">
            <PageHeader
                title="Fatura Düzenle"
                description={`${detail.number} numaralı faturayı düzenliyorsunuz.`}
                variant="default"
                actions={
                    <Button variant="outline" onClick={() => router.push("/fatura/liste")}>
                        Vazgeç
                    </Button>
                }
            />

            <Card className="p-6">
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

                <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-slate-100">
                    <Button variant="outline" onClick={() => router.push("/fatura/liste")} disabled={saving}>Vazgeç</Button>
                    <Button variant="gradient" onClick={handleSave} loading={saving} className="shadow-lg shadow-amber-500/20">Değişiklikleri Kaydet</Button>
                </div>
            </Card>
        </section>
    );
}
