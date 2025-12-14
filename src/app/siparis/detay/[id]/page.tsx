"use client";
import React, { useEffect, useMemo, useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { TableContainer, Table, THead, TBody, TR, TH, TD } from "@/components/ui/Table";
import Skeleton from "@/components/ui/Skeleton";
import Button from "@/components/ui/Button";
import DeliverySection from "@/components/DeliverySection";

type OrderItem = { id: string; name: string; quantity: number; unitPrice: number };
type OrderDetail = {
  id: string;
  barcode: string;
  refNumber?: string | null;
  date: string | null;
  estimatedDelivery?: string | null;
  total: number;
  status?: string | null;
  method?: string | null;
  regulation?: string | null;
  currency?: string | null;
  supplierName?: string | null;
  companyName?: string | null;
  requestBarcode?: string | null;
  requestId?: string | null;
  items: OrderItem[];
};
function SiparisDetayContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = String((params as any)?.id || "");
  const [data, setData] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestBudget, setRequestBudget] = useState<number | null>(null);
  const [requestCurrency, setRequestCurrency] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"detay" | "teslimat">("detay");

  useEffect(() => {
    const t = searchParams.get("tab");
    if (t === "teslimat") setActiveTab("teslimat");
  }, [searchParams]);

  const [permissions, setPermissions] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          setPermissions(data.permissions || []);
          setIsAdmin(data.role === "admin" || data.roleRef?.key === "admin");
        }
      })
      .catch(() => { });
  }, []);

  const loadOrder = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/siparis/${encodeURIComponent(id)}`);
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "Detay getirilemedi");
      }
      const j = (await res.json()) as OrderDetail;
      setData({ ...j, items: Array.isArray(j.items) ? j.items : [] });
      // bağlı talep bütçesini getir
      if (j.requestId) {
        try {
          const r = await fetch(`/api/talep/${encodeURIComponent(j.requestId)}`);
          if (r.ok) {
            const req = await r.json();
            const b = Number(req?.budget ?? NaN);
            setRequestBudget(Number.isFinite(b) ? b : null);
            setRequestCurrency(req?.currency || null);
          }
        } catch (_) { }
      }
    } catch (e: any) {
      setError(e?.message || "Hata");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [id]);

  const totalCurrency = useMemo(() => (data?.currency ? ` ${data.currency}` : ""), [data?.currency]);
  const budgetDiff = useMemo(() => {
    if (!data) return null;
    if (requestBudget == null) return null;
    return requestBudget - (Number(data.total) || 0);
  }, [requestBudget, data]);

  const statusVariant = (s: string | null | undefined): "default" | "success" | "warning" | "error" | "info" => {
    const v = String(s || "").toLowerCase();
    if (v.includes("onay") || v.includes("tamam")) return "success";
    if (v.includes("iptal") || v.includes("red")) return "error";
    if (v.includes("bekle")) return "warning";
    return "default";
  };

  if (loading) return <div className="p-10 text-center"><Skeleton height={300} /></div>;
  if (error) return <div className="p-10 text-center text-red-600">{error}</div>;
  if (!data) return <div className="p-10 text-center text-muted-foreground">Sipariş bulunamadı</div>;

  return (
    <section className="space-y-6 max-w-5xl mx-auto pb-10">
      <PageHeader
        title={`Sipariş: ${data.barcode}`}
        description={`${data.supplierName || "Tedarikçi Belirtilmemiş"} - ${data.companyName || "Şirket Belirtilmemiş"}`}
        variant="default"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/siparis/liste")}>Listeye Dön</Button>
            {/* Permission Check for Actions */}
            {(isAdmin || permissions.includes("siparis:update") || permissions.includes("siparis:edit")) && (
              <Button variant="gradient" onClick={() => router.push(`/siparis/duzenle/${data.id}`)} className="shadow-lg shadow-blue-500/20">Düzenle</Button>
            )}
            {(isAdmin || permissions.includes("fatura:create")) && (
              <Button
                variant="secondary"
                onClick={() => router.push(`/fatura/olustur?orderNo=${encodeURIComponent(data.barcode)}`)}
                title="Siparişe istinaden fatura oluştur"
              >
                Fatura Oluştur
              </Button>
            )}
            {(isAdmin || permissions.includes("teslimat:create")) && (
              <Button
                variant="secondary"
                onClick={() => setActiveTab("teslimat")}
                title="Teslimat işlemleri"
              >
                Teslimat Ekle
              </Button>
            )}
            {(isAdmin || permissions.includes("sozlesme:create")) && (
              <Button
                variant="secondary"
                onClick={() => router.push(`/sozlesme/olustur?orderBarcode=${encodeURIComponent(data.barcode)}`)}
                title="Sözleşme taslağı oluştur"
              >
                Sözleşme Oluştur
              </Button>
            )}
          </div>
        }
      />

      <div className="mb-6 flex space-x-2 border-b border-slate-200">
        <button onClick={() => setActiveTab("detay")} className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors ${activeTab === "detay" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"}`}>Sipariş Detayı</button>
        <button onClick={() => setActiveTab("teslimat")} className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors ${activeTab === "teslimat" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"}`}>Teslimatlar</button>
      </div>

      {activeTab === "detay" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Sol Kolon: Temel Bilgiler */}
          <div className="md:col-span-2 space-y-6">
            <Card title="Sipariş Detayları" className="p-5 h-full">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sipariş Numarası</label>
                  <div className="p-3 bg-slate-50 border rounded-lg text-sm font-medium text-slate-700">{data.barcode}</div>
                  {/* Auto generated ID info */}
                  <p className="text-[10px] text-slate-400">Sistem tarafından otomatik üretilir</p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sipariş Barkodu</label>
                  <div className="p-3 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700">
                    {data.refNumber || <span className="text-slate-400 italic">Belirtilmedi</span>}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sipariş Tarihi</label>
                  <div className="p-3 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700">
                    {data.date ? new Date(data.date).toLocaleDateString("tr-TR") : "-"}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 mt-6">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Durum</label>
                  <Badge variant={statusVariant(data.status)} className="px-2.5 py-0.5">{data.status || "Belirsiz"}</Badge>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Tedarikçi</label>
                  <div className="text-sm font-medium text-slate-900">{data.supplierName || "-"}</div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Şirket</label>
                  <div className="text-sm font-medium text-slate-900">{data.companyName || "-"}</div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Alım Yöntemi</label>
                  <div className="text-sm text-slate-700">{data.method || "-"}</div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Yönetmelik</label>
                  <div className="text-sm text-slate-700">{data.regulation || "-"}</div>
                </div>
              </div>
            </Card>

            <Card title="Ürünler / Hizmetler" className="p-0 overflow-hidden">
              <TableContainer>
                <Table>
                  <THead>
                    <TR>
                      <TH className="w-12 bg-slate-50/50 pl-6">#</TH>
                      <TH className="bg-slate-50/50">Hizmet/Ürün Adı</TH>
                      <TH className="bg-slate-50/50">Miktar</TH>
                      <TH className="bg-slate-50/50 text-right">Birim Fiyat</TH>
                      <TH className="bg-slate-50/50 text-right pr-6">Tutar</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {data.items.length === 0 ? (
                      <TR><TD colSpan={5} className="pl-6 text-slate-500 italic">Kalem yok</TD></TR>
                    ) : (
                      data.items.map((item, i) => (
                        <TR key={i}>
                          <TD className="pl-6 text-slate-400 text-xs font-mono">{i + 1}</TD>
                          <TD className="font-medium text-slate-700">{item.name}</TD>
                          <TD>
                            {Number(item.quantity).toLocaleString("tr-TR")}
                            {/* Birim verisi veritabanında saklanmadığı için gösterilemiyor */}
                          </TD>
                          <TD className="text-right font-mono text-slate-700">
                            {Number(item.unitPrice).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </TD>
                          <TD className="text-right pr-6 font-bold text-slate-900 font-mono">
                            {(Number(item.quantity) * Number(item.unitPrice)).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            <span className="text-xs font-normal text-slate-400 ml-1">{data.currency}</span>
                          </TD>
                        </TR>
                      ))
                    )}
                  </TBody>
                </Table>
              </TableContainer>
              <div className="bg-slate-50 border-t border-slate-100 p-4 px-6 flex justify-end items-center gap-4">
                <span className="text-sm font-semibold text-slate-600">Genel Toplam</span>
                <span className="text-xl font-bold text-slate-900">
                  {Number(data.total).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{totalCurrency}
                </span>
              </div>
            </Card>
          </div>

          {/* Sağ Kolon: Finans ve Tarih */}
          <div className="space-y-6">
            <Card title="Finansal Özet" className="p-5">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Sipariş Tutarı</label>
                  <div className="text-2xl font-bold text-slate-900">
                    {Number(data.total).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{totalCurrency}
                  </div>
                </div>
                {requestBudget !== null && (
                  <>
                    <div className="pt-2 border-t border-slate-100">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Talep Bütçesi</label>
                      <div className="text-sm font-medium text-slate-700">
                        {requestBudget.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}{requestCurrency ? ` ${requestCurrency}` : ""}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Bütçe Farkı</label>
                      <div className={`text-sm font-bold ${Number(budgetDiff) < 0 ? "text-red-600" : "text-emerald-600"}`}>
                        {Number(budgetDiff).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}{totalCurrency}
                        {Number(budgetDiff) < 0 && <span className="text-xs font-normal ml-1">(Aşım)</span>}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </Card>

            <Card title="Tarihler" className="p-5">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Sipariş Tarihi</label>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <span className="text-sm font-medium text-slate-900">{data.date ? new Date(data.date).toLocaleDateString("tr-TR") : "-"}</span>
                  </div>
                </div>
                {data.estimatedDelivery && (
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Teslim Tarihi (Tahmini)</label>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <span className="text-sm font-medium text-slate-900">{new Date(data.estimatedDelivery).toLocaleDateString("tr-TR")}</span>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {data.requestBarcode && (
              <Card title="Bağlantılar" className="p-5">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1" id="link-request-label">Bağlı Talep</label>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-blue-600 hover:text-blue-700 bg-blue-50/50 border-blue-100 hover:bg-blue-100"
                    onClick={() => router.push(`/talep/detay/${data.requestId}`)}
                    aria-labelledby="link-request-label"
                  >
                    <span className="truncate">{data.requestBarcode} Nolu Talep</span>
                    <svg className="w-4 h-4 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {activeTab === "teslimat" && data && (
        <DeliverySection
          orderId={data.id}
          orderBarcode={data.barcode}
          orderItems={data.items}
          onUpdate={loadOrder}
        />
      )}
    </section>
  );
}

// Wrapper with Suspense for useSearchParams
export default function SiparisDetayPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Yükleniyor...</div>}>
      <SiparisDetayContent />
    </Suspense>
  );
}
