"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ContractDetail } from "@/types/sozlesme";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import { fetchJsonWithRetry } from "@/lib/http";
import { useToast } from "@/components/ui/Toast";
import Skeleton from "@/components/ui/Skeleton";

export default function SozlesmeDuzenlePage() {
  const { id } = useParams();
  const router = useRouter();
  const { show } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [number, setNumber] = useState("");

  useEffect(() => {
    if (!id) return;
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchJsonWithRetry<ContractDetail>(`/api/sozlesme/${id}`, { cache: "no-store" }, { retries: 2, backoffMs: 250 });
        if (!active) return;
        setNumber(data.number || "");
        setTitle(data.title || "");
        setStatus(data.status || "");
        const sd = data.startDate ? new Date(data.startDate as any) : null;
        const ed = data.endDate ? new Date(data.endDate as any) : null;
        setStartDate(sd ? new Date(sd.getTime() - sd.getTimezoneOffset() * 60000).toISOString().slice(0, 10) : "");
        setEndDate(ed ? new Date(ed.getTime() - ed.getTimezoneOffset() * 60000).toISOString().slice(0, 10) : "");
      } catch (e: any) {
        show({ title: "Hata", description: "Sözleşme yüklenemedi", variant: "error" });
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [id, show]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const body: any = { title, status };
      if (startDate) body.startDate = startDate;
      if (endDate) body.endDate = endDate;
      // Note: API might support 'confirm=true' query param for immediate effect
      await fetchJsonWithRetry(`/api/sozlesme/${id}?confirm=true`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }, { retries: 1, backoffMs: 200 });

      show({ title: "Başarılı", description: "Sözleşme güncellendi", variant: "success" });
      router.push("/sozlesme/liste");
    } catch (e: any) {
      show({ title: "Hata", description: "Güncelleme başarısız", variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-center"><Skeleton height={200} /></div>;

  return (
    <section className="space-y-6 max-w-4xl mx-auto pb-10">
      <PageHeader
        title="Sözleşme Düzenle"
        description={`${number} numaralı sözleşme kaydını düzenliyorsunuz.`}
        variant="default"
        actions={
          <Button variant="outline" onClick={() => router.push("/sozlesme/liste")}>
            Vazgeç
          </Button>
        }
      />

      <Card className="p-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <Input
                label="Başlık / Konu"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Sözleşme başlığı"
              />
            </div>
            <div>
              <Select
                label="Durum"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="Taslak">Taslak</option>
                <option value="Aktif">Aktif</option>
                <option value="Askıda">Askıda</option>
                <option value="Sona Erdi">Sona Erdi</option>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="date"
                label="Başlangıç"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <Input
                type="date"
                label="Bitiş"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-slate-100">
          <Button variant="outline" onClick={() => router.push("/sozlesme/liste")} disabled={saving}>Vazgeç</Button>
          <Button variant="gradient" onClick={handleSave} loading={saving} className="shadow-lg shadow-purple-500/20">Değişiklikleri Kaydet</Button>
        </div>
      </Card>
    </section>
  );
}