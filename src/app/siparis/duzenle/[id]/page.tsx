"use client";
import React, { useEffect, useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import ItemsSection, { ProductRow } from "@/components/ItemsSection";
import { parseDecimalFlexible } from "@/lib/format";
import { fetchJsonWithRetry } from "@/lib/http";

type Option = { id: string; label: string };
type OptionsPayload = {
  siparisDurumu: Option[];
  alimYontemi: Option[];
  yonetmelikMaddesi: Option[];
  paraBirimi: Option[];
  tedarikci: Option[];
  firma: Option[];
  birim: Option[];
};
const emptyOptions: OptionsPayload = { siparisDurumu: [], alimYontemi: [], yonetmelikMaddesi: [], paraBirimi: [], tedarikci: [], firma: [], birim: [] };

export default function SiparisDuzenlePage() {
  const { id } = useParams();
  const { show } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false); // saving
  const [fetching, setFetching] = useState(true); // loading data
  const [detailData, setDetailData] = useState<any | null>(null);
  const [options, setOptions] = useState<OptionsPayload>(emptyOptions);

  // Form States
  const [barcode, setBarcode] = useState("");
  const [linkedRequestBarcode, setLinkedRequestBarcode] = useState("");
  const [editStatusId, setEditStatusId] = useState<string>("");
  const [editMethodId, setEditMethodId] = useState<string>("");
  const [editRegulationId, setEditRegulationId] = useState<string>("");
  const [editCurrencyId, setEditCurrencyId] = useState<string>("");
  const [editSupplierId, setEditSupplierId] = useState<string>("");

  const [editDate, setEditDate] = useState<string>("");
  const [editDeliveryDate, setEditDeliveryDate] = useState<string>("");
  const [editTotal, setEditTotal] = useState<string>("");
  const [editItems, setEditItems] = useState<ProductRow[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [editResponsibleUserId, setEditResponsibleUserId] = useState<string>("");

  // Product Catalog for autocomplete
  const productCatalog = useMemo(() => [
    { name: "Laptop", unitPrice: 35000, unitId: "u1" },
    { name: "Monitör", unitPrice: 5000, unitId: "u1" },
    { name: "Klavye", unitPrice: 700, unitId: "u1" },
    { name: "Mouse", unitPrice: 600, unitId: "u1" },
    { name: "Ofis Sandalyesi", unitPrice: 2500, unitId: "u1" },
  ], []);

  // Permission check
  useEffect(() => {
    fetch("/api/profile")
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          setPermissions(data.permissions || []);
          const isAdmin = data.role === "admin" || data.roleRef?.key === "admin";
          if (!isAdmin && !data.permissions?.includes("siparis:edit")) {
            show({ title: "Erişim Reddedildi", description: "Bu sayfayı görüntülemek için yetkiniz yok.", variant: "error" });
            router.push("/siparis/liste");
          }
        }
      })
      .catch(() => { });
  }, [router, show]);

  // Load Options
  useEffect(() => {
    const loadOpts = async () => {
      try {
        const res = await fetch("/api/options?include=suppliers,companies,units");
        if (res.ok) {
          setOptions(await res.json());
        }
      } catch { }
    };
    loadOpts();
  }, []);

  // Load Detail
  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setFetching(true);
      try {
        const res = await fetch(`/api/siparis/${id}`);
        if (res.ok) {
          const d = await res.json();
          setDetailData(d);
          // Pre-fill states
          setBarcode(d.barcode || "");
          setLinkedRequestBarcode(d.requestBarcode || "");
          setEditStatusId(d.statusId || "");
          setEditMethodId(d.methodId || "");
          setEditRegulationId(d.regulationId || "");
          setEditCurrencyId(d.currencyId || "");
          setEditSupplierId(d.supplierId || "");

          setEditDate(d.date ? String(d.date).slice(0, 10) : "");
          setEditDeliveryDate(d.estimatedDelivery ? String(d.estimatedDelivery).slice(0, 10) : "");
          setEditTotal(String(d.total || "0"));
          setEditResponsibleUserId(d.responsibleUserId || "");

          if (Array.isArray(d.items)) {
            setEditItems(d.items.map((it: any) => ({
              id: it.id,
              name: it.name,
              quantity: it.quantity,
              unitPrice: it.unitPrice,
              unitId: it.unitId || "",
              extraCosts: it.extraCosts || 0,
              total: it.quantity * it.unitPrice
            })));
          }
        } else {
          show({ title: "Hata", description: "Sipariş verisi yüklenemedi", variant: "error" });
        }
      } catch (e) {
        show({ title: "Hata", description: "Bir hata oluştu", variant: "error" });
      } finally {
        setFetching(false);
      }
    };
    load();
  }, [id, show]);

  // Calculate total automatically
  useEffect(() => {
    const sum = editItems.reduce((acc, row) => acc + (row.quantity * row.unitPrice) + (row.extraCosts || 0), 0);
    setEditTotal(String(sum));
  }, [editItems]);

  const handleSave = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const payload = {
        statusId: editStatusId || null,
        methodId: editMethodId || null,
        regulationId: editRegulationId || null,
        currencyId: editCurrencyId || null,
        supplierId: editSupplierId || null,

        date: editDate ? new Date(editDate).toISOString() : null,
        estimatedDelivery: editDeliveryDate ? new Date(editDeliveryDate).toISOString() : null,
        total: parseDecimalFlexible(editTotal),
        responsibleUserId: editResponsibleUserId || null,
        items: editItems.map(row => ({
          id: row.id.startsWith("new_") ? undefined : row.id,
          name: row.name,
          quantity: row.quantity,
          unitPrice: row.unitPrice
        }))
      };

      const res = await fetch(`/api/siparis/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        show({ title: "Başarılı", description: "Sipariş güncellendi.", variant: "success" });
        router.push("/siparis/liste");
      } else {
        const d = await res.json().catch(() => ({}));
        show({ title: "Hata", description: d.error || "Güncelleme başarısız.", variant: "error" });
      }
    } catch (e) {
      show({ title: "Hata", description: "Sunucu hatası.", variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="p-10 text-center"><Skeleton height={300} /></div>;
  if (!detailData) return <div className="p-10 text-center text-muted-foreground">Sipariş bulunamadı</div>;

  // Live calculation of order total
  const currentTotal = editItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
  const requestBudget = detailData?.requestBudget || 0;
  const difference = requestBudget - currentTotal;
  const isOverBudget = difference < 0;

  // Currency Formatting Helper
  const fmt = (val: number) => val.toLocaleString("tr-TR", { style: "currency", currency: options.paraBirimi.find(c => c.id === editCurrencyId)?.label || "TRY" });

  return (
    <section className="space-y-6 max-w-5xl mx-auto pb-10">
      <PageHeader
        title="Sipariş Düzenle"
        description={`${detailData.barcode} - ${detailData.subject || "Genel Alım"}`}
        variant="default"
        actions={
          <Button variant="outline" onClick={() => router.push("/siparis/liste")}>
            Vazgeç
          </Button>
        }
      />

      {/* Budget Comparison Card */}
      {detailData?.requestBarcode && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 border-l-4 border-blue-500 bg-blue-50/50">
            <div className="text-sm font-medium text-slate-500 mb-1">Talep Tutarı ({detailData.requestBarcode})</div>
            <div className="text-2xl font-bold text-slate-800">{fmt(requestBudget)}</div>
          </Card>
          <Card className="p-4 border-l-4 border-purple-500 bg-purple-50/50">
            <div className="text-sm font-medium text-slate-500 mb-1">Sipariş Tutarı (Güncel)</div>
            <div className="text-2xl font-bold text-slate-800">{fmt(currentTotal)}</div>
          </Card>
          <Card className={`p-4 border-l-4 ${isOverBudget ? 'border-red-500 bg-red-50/50' : 'border-emerald-500 bg-emerald-50/50'}`}>
            <div className="text-sm font-medium text-slate-500 mb-1">{isOverBudget ? "Bütçe Aşımı" : "Bütçe Avantajı"}</div>
            <div className={`text-2xl font-bold ${isOverBudget ? 'text-red-700' : 'text-emerald-700'}`}>
              {isOverBudget ? "-" : "+"}{fmt(Math.abs(difference))}
            </div>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sol Kolon: Temel Seçimler */}
        <div className="space-y-6">
          <Card title="Genel Bilgiler" className="p-5">
            <div className="space-y-4">
              <Input label="Sipariş No" value={barcode} disabled className="bg-slate-50 opacity-70" />

              {linkedRequestBarcode && (
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-blue-800 uppercase">Bağlı Talep</div>
                    <div className="text-sm font-bold text-blue-900">{linkedRequestBarcode}</div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => window.open(`/talep/detay/${detailData.requestId}`, '_blank')}>Görüntüle</Button>
                </div>
              )}

              <Select label="Durum" value={editStatusId} onChange={(e) => setEditStatusId(e.target.value)}>
                <option value="">Seçiniz</option>
                {options.siparisDurumu.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
              </Select>

              <Select label="Tedarikçi Firma" value={editSupplierId} onChange={(e) => setEditSupplierId(e.target.value)}>
                <option value="">Seçiniz</option>
                {options.tedarikci?.map((o: any) => <option key={o.id} value={o.id}>{o.label || o.name}</option>)}
              </Select>


            </div>
          </Card>

          <Card title="Alım Yöntemi ve Mevzuat" className="p-5">
            <div className="space-y-4">
              <Select label="Alım Yöntemi" value={editMethodId} onChange={(e) => setEditMethodId(e.target.value)}>
                <option value="">Seçiniz</option>
                {options.alimYontemi.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
              </Select>
              <Select label="Yönetmelik Maddesi" value={editRegulationId} onChange={(e) => setEditRegulationId(e.target.value)}>
                <option value="">Seçiniz</option>
                {options.yonetmelikMaddesi.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
              </Select>
            </div>
          </Card>
        </div>

        {/* Sağ Kolon: Finans ve Tarih */}
        <div className="space-y-6">
          <Card title="Finans ve Tarih" className="p-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Select label="Para Birimi" value={editCurrencyId} onChange={(e) => setEditCurrencyId(e.target.value)}>
                  <option value="">Seçiniz</option>
                  {options.paraBirimi.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                </Select>
              </div>
              <Input type="date" label="Tarih" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
              <Input type="date" label="Tahmini Teslim" value={editDeliveryDate} onChange={(e) => setEditDeliveryDate(e.target.value)} />
            </div>
          </Card>
          <Card title="Toplam Tutar" className="p-5 bg-slate-50 border border-slate-200">
            <div className="text-3xl font-bold text-center text-slate-800">
              {Number(editTotal).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
              <span className="text-lg font-normal text-slate-500 ml-2">
                {options.paraBirimi.find(x => x.id === editCurrencyId)?.label || "TL"}
              </span>
            </div>
            <p className="text-xs text-center text-slate-500 mt-2">Kalemlerden otomatik hesaplanmıştır.</p>
          </Card>
        </div>

        {/* Alt Satır: Kalemler (Tam Genişlik) */}
        <div className="md:col-span-2">
          <Card title="Sipariş Kalemleri" className="p-5">
            <ItemsSection
              items={editItems}
              onItemsChange={setEditItems}
              productCatalog={productCatalog}
              unitOptions={options.birim?.map((u: any) => ({ id: u.id, label: u.label })) || []}
            />
          </Card>
        </div>

        <div className="md:col-span-2 flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button variant="outline" onClick={() => router.push("/siparis/liste")} disabled={loading}>Vazgeç</Button>
          <Button variant="gradient" onClick={handleSave} loading={loading} className="shadow-lg shadow-blue-500/20">Değişiklikleri Kaydet</Button>
        </div>
      </div>
    </section>
  );
}