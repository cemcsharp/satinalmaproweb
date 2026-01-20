"use client";
import React, { useEffect, useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/Toast";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import ItemsSection, { ProductRow } from "@/components/ItemsSection"; // Assuming ItemsSection is compatible
import { parseDecimalFlexible } from "@/lib/format";
import { fetchJsonWithRetry } from "@/lib/http";

type Option = { id: string; label: string; email?: string };
type OptionsPayload = {
  ilgiliKisi: Option[];
  birim: Option[];
  durum: Option[];
  paraBirimi: Option[];
  birimTipi: Option[];
  departman: Option[];
};
const emptyOptions: OptionsPayload = { ilgiliKisi: [], birim: [], durum: [], paraBirimi: [], birimTipi: [], departman: [] };

export default function TalepDuzenlePage() {
  const { id } = useParams();
  const { show } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false); // saving
  const [fetching, setFetching] = useState(true); // loading data
  const [detailData, setDetailData] = useState<any | null>(null);
  const [options, setOptions] = useState<OptionsPayload>(emptyOptions);

  // Form States
  const [subject, setSubject] = useState("");
  const [justification, setJustification] = useState("");
  const [relatedPersonId, setRelatedPersonId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [statusId, setStatusId] = useState("");
  const [currencyId, setCurrencyId] = useState("");
  const [requestDate, setRequestDate] = useState("");
  const [budget, setBudget] = useState("");
  const [unitEmail, setUnitEmail] = useState("");
  const [departmentId, setDepartmentId] = useState("");

  const [items, setItems] = useState<ProductRow[]>([]);

  // Load Options
  useEffect(() => {
    const loadOpts = async () => {
      try {
        const res = await fetch("/api/options?include=units,persons,statuses");
        if (res.ok) {
          const d = await res.json();
          // Map options to match expected structure if needed
          // Assuming /api/options returns flattened lists or I map them.
          // The previous page.tsx used /api/options returning { ilgiliKisi, birim, ... }
          setOptions(d);
        }
      } catch { }
    };
    loadOpts();
  }, []);

  // Update Unit Email when Department changes
  useEffect(() => {
    const d = options.departman.find(x => x.id === departmentId);
    setUnitEmail(d?.email || "");
  }, [departmentId, options.departman]);

  // Load Detail
  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setFetching(true);
      try {
        const res = await fetch(`/api/talep/${id}`);
        if (res.ok) {
          const d = await res.json();
          setDetailData(d);
          // Pre-fill
          setSubject(d.subject || "");
          setJustification(d.justification || "");
          setRelatedPersonId(d.relatedPersonId || "");
          setUnitId(d.unitId || "");
          setStatusId(d.statusId || "");
          setCurrencyId(d.currencyId || "");
          setDepartmentId(d.departmentId || "");
          // Date handling: d.createdAt or d.date? Schema has createdAt. TalepOlustur uses createdAt default usually? 
          // Request model has createdAt. d.date might be a custom field or not exist in schema (didn't see explicit date field in schema, only createdAt).
          // Checking schema Request again: Line 117 createdAt. Line 123 statusId.
          // TalepOlustur used `requestDateStr` but checked schema doesn't have `date` field. It might be saving to `createdAt` or ignored.
          // I will assume `createdAt` is the date.
          setRequestDate(d.createdAt ? String(d.createdAt).slice(0, 10) : "");
          setBudget(String(d.budget || "0"));

          if (Array.isArray(d.items)) {
            setItems(d.items.map((it: any) => ({
              id: it.id,
              name: it.name,
              quantity: Number(it.quantity),
              unitPrice: Number(it.unitPrice),
              unit: it.unitId || "", // ItemsSection expects 'unit' as ID or string?
              // RequestItem schema has unitId linking to OptionItem.
              // We need to match with options.birimTipi or similar? 
              // TalepOlustur uses productCatalog with static unitId 'u1'.
              // I will use unitId here.
              extraCosts: 0, // Not in schema, simulated
              total: Number(it.quantity) * Number(it.unitPrice)
            })));
          }
        } else {
          show({ title: "Hata", description: "Talep verisi yüklenemedi", variant: "error" });
        }
      } catch (e) {
        show({ title: "Hata", description: "Bir hata oluştu", variant: "error" });
      } finally {
        setFetching(false);
      }
    };
    load();
  }, [id, show]);

  // Calculate budget
  useEffect(() => {
    const sum = items.reduce((acc, row) => acc + (row.quantity * row.unitPrice) + (row.extraCosts || 0), 0);
    setBudget(String(sum));
  }, [items]);

  const handleSave = async () => {
    if (!id) return;
    if (!subject) { show({ title: "Hata", description: "Konu zorunludur", variant: "error" }); return; }

    setLoading(true);
    try {
      const payload = {
        subject,
        justification,
        relatedPersonId,
        unitId,
        statusId,
        currencyId,
        departmentId,
        budget: parseDecimalFlexible(budget),
        // We might update createdAt if backend allows, or just date.
        // If backend logic allows date update (rare for CreatedAt), otherwise we ignore.
        items: items.map(row => ({
          id: row.id.length < 10 ? undefined : row.id, // simple check for new/existing
          name: row.name,
          quantity: row.quantity,
          unitPrice: row.unitPrice,
          unitId: row.unit // Mapping unit select to unitId
        }))
      };

      const res = await fetch(`/api/talep/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        show({ title: "Başarılı", description: "Talep güncellendi", variant: "success" });
        router.push("/talep/liste");
      } else {
        const j = await res.json();
        throw new Error(j.error || "Güncelleme başarısız");
      }

    } catch (e: any) {
      show({ title: "Hata", description: e.message, variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="p-10 text-center"><Skeleton height={300} /></div>;
  if (!detailData) return <div className="p-10 text-center text-muted-foreground">Talep bulunamadı</div>;

  return (
    <section className="space-y-6 max-w-5xl mx-auto pb-10">
      <PageHeader
        title="Talep Düzenle"
        description={`${detailData.barcode}`}
        variant="default"
        actions={
          <Button variant="outline" onClick={() => router.push("/talep/liste")}>
            Vazgeç
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card title="Talep Detayları" className="p-5">
            <div className="space-y-4">
              <Input label="Konu" value={subject} onChange={(e) => setSubject(e.target.value)} required />
              <Textarea label="Gerekçe" value={justification} onChange={(e) => setJustification(e.target.value)} rows={3} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select label="İlgili Kişi" value={relatedPersonId} onChange={(e) => setRelatedPersonId(e.target.value)}>
                  <option value="">Seçiniz</option>
                  {options.ilgiliKisi?.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                </Select>
                <div>
                  <Select label="Talep Eden Birim (Bölüm)" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
                    <option value="">Seçiniz</option>
                    {options.departman?.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                  </Select>
                  {unitEmail && <div className="text-xs text-blue-600 mt-1 truncate">Bileşen E-Postası: {unitEmail}</div>}
                </div>
              </div>
            </div>
          </Card>

          <Card title="Talep Kalemleri" className="p-5">
            <ItemsSection
              items={items}
              onItemsChange={setItems}
              unitOptions={options.birimTipi?.length > 0 ? options.birimTipi : [{ id: "u1", label: "Adet" }, { id: "u2", label: "Kutu" }]}
              currencyOptions={options.paraBirimi}
              defaultCurrency={currencyId}
            />
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Durum ve Tarih" className="p-5">
            <div className="space-y-4">
              <Select label="Durum" value={statusId} onChange={(e) => setStatusId(e.target.value)}>
                <option value="">Seçiniz</option>
                {options.durum?.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
              </Select>
              <Select label="Para Birimi" value={currencyId} onChange={(e) => setCurrencyId(e.target.value)}>
                {options.paraBirimi?.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
              </Select>
              <Input type="date" label="Talep Tarihi" value={requestDate} disabled className="opacity-60 cursor-not-allowed" />
              {/* Usually date is creation date and not editable, but showing it */}
            </div>
          </Card>

          <Card title="Bütçe Özeti" className="p-5 bg-slate-50 border border-slate-200">
            <div className="text-3xl font-bold text-center text-slate-800">
              {Number(budget).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
              <span className="text-lg font-normal text-slate-500 ml-2">
                {options.paraBirimi?.find(x => x.id === currencyId)?.label || "TL"}
              </span>
            </div>
            <p className="text-xs text-center text-slate-500 mt-2">Kalemlerden hesaplanmıştır</p>
          </Card>
        </div>

        <div className="md:col-span-3 flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button variant="outline" onClick={() => router.push("/talep/liste")} disabled={loading}>Vazgeç</Button>
          <Button variant="gradient" onClick={handleSave} loading={loading} className="shadow-lg shadow-sky-500/20">Değişiklikleri Kaydet</Button>
        </div>
      </div>
    </section>
  );
}
