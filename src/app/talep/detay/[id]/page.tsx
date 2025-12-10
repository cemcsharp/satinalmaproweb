"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { TableContainer, Table, THead, TBody, TR, TH, TD } from "@/components/ui/Table";
import Skeleton from "@/components/ui/Skeleton";
import Button from "@/components/ui/Button";

type RequestItem = { id: string; name: string; quantity: number; unit: string | null; unitPrice?: number };
type RequestComment = { id: string; text: string; author: string | null; createdAt: string | null };
type RequestDetail = {
  id: string;
  barcode: string;
  subject: string;
  justification?: string | null;
  budget: number;
  unit?: string | null;
  status?: string | null;
  currency?: string | null;
  date?: string | null;
  relatedPerson?: string | null;
  unitEmail?: string | null;
  owner?: string | null;
  responsible?: string | null;
  items: RequestItem[];
  comments?: RequestComment[];
};

export default function TalepDetayPage() {
  const params = useParams();
  const router = useRouter();
  const id = String((params as any)?.id || "");
  const [data, setData] = useState<RequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/talep/${encodeURIComponent(id)}`);
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j?.error || "Detay getirilemedi");
        }
        const j = (await res.json()) as RequestDetail;
        setData({ ...j, items: Array.isArray(j.items) ? j.items : [] });
      } catch (e: any) {
        setError(e?.message || "Hata");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const statusVariant = (s?: string | null): "default" | "success" | "warning" | "error" | "info" => {
    const v = (s || "").toLowerCase();
    if (v.includes("onay")) return "success";
    if (v.includes("iptal") || v.includes("redd")) return "error";
    if (v.includes("taslak")) return "warning";
    if (v.includes("bekle") || v.includes("işlem")) return "info";
    return "default";
  };

  if (loading) return <div className="p-10 text-center"><Skeleton height={300} /></div>;
  if (error) return <div className="p-10 text-center text-red-600">{error}</div>;
  if (!data) return <div className="p-10 text-center text-muted-foreground">Talep bulunamadı</div>;

  return (
    <section className="space-y-6 max-w-5xl mx-auto pb-10">
      <PageHeader
        title={`Talep: ${data.barcode}`}
        description={data.subject}
        variant="default"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/talep/liste")}>Listeye Dön</Button>
            <Button variant="gradient" onClick={() => router.push(`/talep/duzenle/${data.id}`)}>Düzenle</Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card title="Talep Bilgileri" className="p-5 h-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Durum</label>
                <Badge variant={statusVariant(data.status)} className="px-2.5 py-0.5">{data.status || "Belirsiz"}</Badge>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Talep No</label>
                <div className="text-base font-medium text-slate-900">{data.barcode}</div>
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Konu</label>
                <div className="text-sm font-medium text-slate-900 leading-relaxed">{data.subject}</div>
              </div>
              {data.justification && (
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Gerekçe</label>
                  <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{data.justification}</div>
                </div>
              )}
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Talep Eden</label>
                <div className="text-sm text-slate-900">{data.owner || "-"}</div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">İlgili Kişi</label>
                <div className="text-sm text-slate-900">{data.relatedPerson || "-"}</div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Birim</label>
                <div className="text-sm text-slate-900">{data.unit || "-"}</div>
              </div>
              {data.unitEmail && (
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Birim E-Posta</label>
                  <div className="text-sm text-blue-600 truncate">{data.unitEmail}</div>
                </div>
              )}
            </div>
          </Card>

          <Card title="Talep Kalemleri" className="p-0 overflow-hidden">
            <TableContainer>
              <Table>
                <THead>
                  <TR>
                    <TH className="bg-slate-50/50 pl-6">Kalem Adı/Açıklama</TH>
                    <TH className="bg-slate-50/50">Miktar</TH>
                    <TH className="bg-slate-50/50">Birim</TH>
                    <TH className="bg-slate-50/50 text-right pr-6">Birim Fiyat</TH>
                    <TH className="bg-slate-50/50 text-right pr-6">Tutar</TH>
                  </TR>
                </THead>
                <TBody>
                  {data.items.length === 0 ? (
                    <TR><TD colSpan={5} className="pl-6 text-slate-500 italic">Kalem girilmemiş</TD></TR>
                  ) : (
                    data.items.map((item, i) => (
                      <TR key={i}>
                        <TD className="pl-6 font-medium text-slate-700">{item.name}</TD>
                        <TD>{item.quantity}</TD>
                        <TD>{item.unit || "-"}</TD>
                        <TD className="text-right pr-6 font-mono text-slate-600">
                          {item.unitPrice ? item.unitPrice.toLocaleString("tr-TR", { minimumFractionDigits: 2 }) : "-"}
                        </TD>
                        <TD className="text-right pr-6 font-medium text-slate-900">
                          {item.unitPrice ? (item.quantity * item.unitPrice).toLocaleString("tr-TR", { minimumFractionDigits: 2 }) : "-"}
                        </TD>
                      </TR>
                    ))
                  )}
                </TBody>
              </Table>
            </TableContainer>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Bütçe ve Tarih" className="p-5">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Tahmini Bütçe</label>
                <div className="text-xl font-bold text-slate-900">
                  {Number(data.budget).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  <span className="text-sm font-normal text-slate-500 ml-1">{data.currency || "TL"}</span>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Talep Tarihi</label>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  <span className="text-sm font-medium text-slate-900">{data.date ? new Date(data.date).toLocaleDateString("tr-TR") : "-"}</span>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Sorumlu" className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </div>
              <div>
                <div className="text-sm font-medium text-slate-900">{data.responsible || "Atanmamış"}</div>
                <div className="text-xs text-slate-500">Satınalma Sorumlusu</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
