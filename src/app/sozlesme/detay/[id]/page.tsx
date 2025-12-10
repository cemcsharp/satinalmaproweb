"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ContractDetail } from "@/types/sozlesme";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { fetchJsonWithRetry } from "@/lib/http";
import Skeleton from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

export default function SozlesmeDetayPage() {
  const { id } = useParams();
  const router = useRouter();
  const { show } = useToast();
  const [data, setData] = useState<ContractDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        const d = await fetchJsonWithRetry<ContractDetail>(`/api/sozlesme/${id}`, { cache: "no-store" }, { retries: 2, backoffMs: 250 });
        if (active) setData(d);
      } catch (e: any) {
        show({ title: "Hata", description: "Sözleşme detayı yüklenemedi", variant: "error" });
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [id, show]);

  const statusVariant = (s: string) => {
    const v = (s || "").toLowerCase();
    if (v.includes("aktif") || v.includes("onay")) return "success";
    if (v.includes("son") || v.includes("iptal")) return "error";
    if (v.includes("taslak") || v.includes("bekle")) return "warning";
    return "default";
  };

  if (loading) return <div className="p-10 text-center"><Skeleton height={200} /></div>;
  if (!data) return <div className="p-10 text-center text-muted-foreground">Sözleşme bulunamadı</div>;

  return (
    <section className="space-y-6 max-w-5xl mx-auto pb-10">
      <PageHeader
        title={`Sözleşme Detayı: ${data.number}`}
        description={data.title}
        variant="default"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/sozlesme/liste")}>Listeye Dön</Button>
            <Button variant="gradient" onClick={() => router.push(`/sozlesme/duzenle/${data.id}`)} className="shadow-lg shadow-purple-500/20">Düzenle</Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sol Kolon: Temel Bilgiler */}
        <div className="md:col-span-2 space-y-6">
          <Card title="Genel Bilgiler" className="p-5 h-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Sözleşme No</label>
                <div className="text-base font-medium text-slate-900">{data.number}</div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Durum</label>
                <Badge variant={statusVariant(data.status)} className="px-2.5 py-0.5">{data.status}</Badge>
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Başlık / Konu</label>
                <div className="text-sm text-slate-700 leading-relaxed font-medium">{data.title}</div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Versiyon</label>
                <div className="text-sm font-mono text-slate-700 bg-slate-100 inline-block px-2 rounded">{data.version ?? "v1.0"}</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Sağ Kolon: Tarih ve Taraflar */}
        <div className="space-y-6">
          <Card title="Tarihler" className="p-5">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Başlangıç Tarihi</label>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  <span className="text-sm font-medium text-slate-900">{data.startDate ? new Date(data.startDate as any).toLocaleDateString("tr-TR") : "-"}</span>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Bitiş Tarihi</label>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span className="text-sm font-medium text-slate-900">{data.endDate ? new Date(data.endDate as any).toLocaleDateString("tr-TR") : "-"}</span>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Taraflar" className="p-5">
            <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
              {data.parties || <span className="text-slate-400 italic">Taraf bilgisi girilmemiş.</span>}
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
