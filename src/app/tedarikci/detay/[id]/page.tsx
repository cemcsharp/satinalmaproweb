"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { fetchJsonWithRetry } from "@/lib/http";
import Skeleton from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

import SupplierPerformanceScore from "@/components/SupplierPerformanceScore";

type SupplierDetail = {
  id: string;
  name: string;
  active: boolean;
  taxId?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
  users?: {
    id: string;
    username: string;
    email: string;
    isActive: boolean;
    role: string;
  }[];
  _count?: {
    orders: number;
    contracts: number;
  }
}

export default function TedarikciDetayPage() {
  const { id } = useParams();
  const router = useRouter();
  const { show } = useToast();
  const [data, setData] = useState<SupplierDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        const d = await fetchJsonWithRetry<SupplierDetail>(`/api/tedarikci/${id}`, { cache: "no-store" }, { retries: 2, backoffMs: 250 });
        if (active) setData(d);
      } catch (e: any) {
        show({ title: "Hata", description: "Tedarikçi detayı yüklenemedi", variant: "error" });
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [id, show]);

  if (loading) return <div className="p-10 text-center"><Skeleton height={200} /></div>;
  if (!data) return <div className="p-10 text-center text-muted-foreground">Tedarikçi bulunamadı</div>;

  return (
    <section className="space-y-6 max-w-5xl mx-auto pb-10">
      <PageHeader
        title={`Tedarikçi: ${data.name}`}
        description={data.taxId ? `Vergi No: ${data.taxId}` : undefined}
        variant="default"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/tedarikci/liste")}>Listeye Dön</Button>
            <Button variant="gradient" onClick={() => router.push(`/tedarikci/duzenle/${data.id}`)} className="shadow-lg shadow-sky-500/20">Düzenle</Button>
          </div>
        }
      />

      <SupplierPerformanceScore supplierId={data.id} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card title="Genel Bilgiler" className="p-5 h-full">
            {/* Existing general info content */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Firma Adı</label>
                <div className="text-base font-medium text-slate-900">{data.name}</div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Durum</label>
                <Badge variant={data.active ? "success" : "default"} className="px-2.5 py-0.5">{data.active ? "Aktif" : "Pasif"}</Badge>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Vergi Numarası</label>
                <div className="text-sm font-medium text-slate-700 font-mono tracking-wide">{data.taxId || "-"}</div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Kayıt Tarihi</label>
                <div className="text-sm text-slate-700">{new Date(data.createdAt).toLocaleDateString("tr-TR")}</div>
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Adres</label>
                <div className="text-sm text-slate-700 whitespace-pre-wrap">{data.address || "-"}</div>
              </div>
            </div>
          </Card>

          <Card title="Kullanıcı Hesapları" className="p-0 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <p className="text-sm text-slate-500">Bu tedarikçinin sisteme giriş yetkisi olan hesapları</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-5 py-3 font-semibold text-slate-700">Kullanıcı Adı</th>
                    <th className="px-5 py-3 font-semibold text-slate-700">E-Posta</th>
                    <th className="px-5 py-3 font-semibold text-slate-700">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.users && data.users.length > 0 ? (
                    data.users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3 font-medium text-slate-900">{u.username}</td>
                        <td className="px-5 py-3 text-slate-600">{u.email}</td>
                        <td className="px-5 py-3">
                          <Badge variant={u.isActive ? "success" : "default"}>
                            {u.isActive ? "Aktif" : "Pasif"}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-5 py-8 text-center text-slate-400 italic">
                        Bağlı kullanıcı hesabı bulunamadı.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="İletişim" className="p-5">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Yetkili Kişi</label>
                <div className="text-sm font-medium text-slate-900">{data.contactName || "-"}</div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">E-Posta</label>
                <div className="text-sm font-medium text-blue-600 truncate">{data.email || "-"}</div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Telefon</label>
                <div className="text-sm font-medium text-slate-700">{data.phone || "-"}</div>
              </div>
            </div>
          </Card>

          <Card title="Özet" className="p-5">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="text-2xl font-bold text-slate-900">{data._count?.orders ?? 0}</div>
                <div className="text-xs text-slate-500 font-medium uppercase mt-1">Sipariş</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="text-2xl font-bold text-slate-900">{data._count?.contracts ?? 0}</div>
                <div className="text-xs text-slate-500 font-medium uppercase mt-1">Sözleşme</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}