"use client";
import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Card from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import ItemsSection, { ProductRow, Option as UnitOption } from "@/components/ItemsSection";
import { calculateWithholding, type InvoiceItemInput, type WithholdingRule } from "@/lib/withholding";

function FaturaOlusturContent() {
  const { show } = useToast();
  const router = useRouter();

  // Permission check removed as requested
  // users can access this page without restrictions

  const params = useSearchParams();
  const initialOrderNo = params.get("orderNo") ?? "";
  const initialDueDate = params.get("dueDate") ?? "";

  const [orderBarcode, setOrderBarcode] = useState(initialOrderNo);
  const [orderResults, setOrderResults] = useState<Array<{ id: string; barcode: string; date: string; status: string; method: string; total: number }>>([]);
  const [orderSearchOpen, setOrderSearchOpen] = useState(false);
  const [orderSearchLoading, setOrderSearchLoading] = useState(false);
  const [orderSearchError, setOrderSearchError] = useState<string>("");
  const [orderActiveIndex, setOrderActiveIndex] = useState<number>(-1);

  const [detail, setDetail] = useState<null | {
    id: string;
    barcode: string;
    date: string | null;
    total: number;
    supplier?: { id?: string; name?: string; taxId?: string | null; address?: string | null } | null;
    company?: { id?: string; name?: string; taxId?: string | null; address?: string | null } | null;
    items?: Array<{ id: string; name: string; quantity: number; unitPrice: number }> | null;
  }>(null);

  const [unitOptions, setUnitOptions] = useState<UnitOption[]>([]);
  const [items, setItems] = useState<ProductRow[]>([]);
  const [dueDate, setDueDate] = useState(initialDueDate);
  const [invoiceNumber, setInvoiceNumber] = useState<string>(() => "F-" + new Date().toISOString().slice(0, 10).replace(/-/g, ""));
  const [vatRate, setVatRate] = useState<number>(18);
  const [jobTypeId, setJobTypeId] = useState<string>("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const r = await fetch("/api/options");
        if (!r.ok) return;
        const j = await r.json();
        const units = (j?.birimTipi || []).map((it: { id: string; label: string }) => ({ id: it.id, label: it.label }));
        setUnitOptions(units);
      } catch { }
    };
    loadOptions();
  }, []);

  useEffect(() => {
    const prefillFromOrderNo = async () => {
      if (!initialOrderNo) return;
      try {
        setOrderSearchLoading(true);
        const r = await fetch(`/api/siparis?q=${encodeURIComponent(initialOrderNo)}`);
        const j = await r.json();
        const first = Array.isArray(j?.items) ? j.items.find((x: { barcode?: string }) => (x.barcode || "") === initialOrderNo) : null;
        if (first) {
          await selectOrder(first);
        }
      } catch { }
      finally {
        setOrderSearchLoading(false);
      }
    };
    prefillFromOrderNo();
  }, [initialOrderNo]);


  const searchOrders = async () => {
    try {
      setOrderSearchLoading(true);
      setOrderSearchError("");
      setOrderActiveIndex(-1);
      const r = await fetch(`/api/siparis?q=${encodeURIComponent(orderBarcode)}`);
      if (!r.ok) throw new Error("list_failed");
      const j = await r.json();
      setOrderResults(Array.isArray(j?.items) ? j.items : []);
    } catch (e: unknown) {
      setOrderSearchError("Arama başarısız");
    } finally {
      setOrderSearchLoading(false);
    }
  };

  const selectOrder = async (o: { id: string; barcode: string }) => {
    try {
      const r = await fetch(`/api/siparis/${encodeURIComponent(o.id)}`);
      if (!r.ok) throw new Error("order_failed");
      const j = await r.json();
      const d = {
        id: j.id,
        barcode: j.barcode,
        date: j.date ?? null,
        total: Number(j.total || 0),
        supplier: j.supplierName || j.supplierTaxId || j.supplierAddress ? { name: j.supplierName || "", taxId: j.supplierTaxId ?? null, address: j.supplierAddress ?? null } : null,
        company: j.companyName || j.companyTaxId || j.companyAddress ? { name: j.companyName || "", taxId: j.companyTaxId ?? null, address: j.companyAddress ?? null } : null,
        items: Array.isArray(j.items) ? j.items.map((it: { id: string; name: string; quantity: number; unitPrice: number }) => ({ id: it.id, name: it.name, quantity: it.quantity, unitPrice: it.unitPrice })) : [],
      };
      setDetail(d);
      setOrderBarcode(j.barcode || "");
      setItems((d.items || []).map((it: { id: string; name: string; quantity: number; unitPrice: number }) => ({ id: it.id, name: it.name, quantity: it.quantity, unit: unitOptions[0]?.id || "u1", unitPrice: it.unitPrice, extraCosts: 0 })));
      try {
        const a = await fetch(`/api/autofill?type=invoice&orderId=${encodeURIComponent(d.id)}`);
        if (a.ok) {
          const aj = await a.json();
          const last = aj?.lastInvoice || null;
          if (last?.dueDate) setDueDate(String(last.dueDate).slice(0, 10));
        }
      } catch { }
      setOrderSearchOpen(false);
    } catch {
      show({ title: "Hata", description: "Sipariş detay alınamadı", variant: "error" });
    }
  };

  useEffect(() => {
    const q = orderBarcode.trim();
    if (q.length < 3) return;
    let controller: AbortController | null = null;
    const timer = window.setTimeout(async () => {
      try {
        controller = new AbortController();
        setOrderSearchLoading(true);
        setOrderSearchError("");
        const r = await fetch(`/api/siparis?q=${encodeURIComponent(q)}`, { signal: controller.signal });
        if (!r.ok) throw new Error("list_failed");
        const j = await r.json();
        const list: Array<{ id: string; barcode: string; date: string; status: string; method: string; total: number }> = Array.isArray(j?.items) ? j.items : [];
        setOrderResults(list);
        const exact = list.find((x) => (x.barcode || "") === q);
        if (exact) {
          await selectOrder(exact);
        } else if (list.length === 1) {
          await selectOrder(list[0]);
        } else if (list.length > 1) {
          setOrderSearchOpen(true);
        } else {
          show({ title: "Bulunamadı", description: "Barkoda ait sipariş yok", variant: "warning" });
        }
      } catch (err: unknown) {
        const isAbort = err instanceof DOMException && err.name === "AbortError";
        if (!isAbort) {
          show({ title: "Hata", description: "Barkod arama başarısız", variant: "error" });
        }
      } finally {
        setOrderSearchLoading(false);
      }
    }, 500);
    return () => { window.clearTimeout(timer); controller?.abort(); };
  }, [orderBarcode]);

  const [jobTypes, setJobTypes] = useState<{ id: string; label: string; ratio: string }[]>([]);
  useEffect(() => {
    const fallback = [
      { id: "201", label: "Yapım işleri ve birlikte mühendislik/mimarlık/etüt-proje", ratio: "4/10" },
      { id: "202", label: "Etüt, plan-proje, danışmanlık, denetim ve benzeri hizmetler", ratio: "9/10" },
      { id: "203", label: "Makine/teçhizat/demirbaş/taşınmaz tadil, bakım ve onarım", ratio: "7/10" },
      { id: "204", label: "Yemek servis hizmeti", ratio: "5/10" },
      { id: "205", label: "Organizasyon hizmetleri", ratio: "9/10" },
      { id: "206", label: "İşgücü temin hizmetleri", ratio: "9/10" },
      { id: "207", label: "Özel güvenlik hizmeti", ratio: "9/10" },
      { id: "208", label: "Yapı denetim hizmetleri", ratio: "9/10" },
      { id: "209", label: "Fason tekstil/konfeksiyon/çanta/ayakkabı işleri ve aracılık", ratio: "7/10" },
      { id: "210", label: "Turistik mağazalara müşteri bulma/götürme", ratio: "9/10" },
      { id: "211", label: "Spor kulüplerinin yayın, reklam ve isim hakkı işlemleri", ratio: "9/10" },
      { id: "212", label: "Temizlik hizmeti", ratio: "9/10" },
      { id: "213", label: "Servis taşımacılığı hizmeti", ratio: "5/10" },
      { id: "214", label: "Her türlü baskı ve basım hizmetleri", ratio: "7/10" },
      { id: "215", label: "Cetvellerdeki idare/kurum/kuruluşlara yapılan diğer hizmetler", ratio: "5/10" },
      { id: "217", label: "Hurda metalden elde edilen külçe teslimleri", ratio: "7/10" },
      { id: "218", label: "Hurda metal dışı bakır/çinko/alüminyum külçe teslimleri", ratio: "7/10" },
      { id: "219", label: "Bakır/çinko/alüminyum/kurşun ürün teslimleri", ratio: "7/10" },
      { id: "220", label: "İstisnadan vazgeçenlerin hurda ve atık teslimi", ratio: "7/10" },
      { id: "221", label: "Hurda ve atıklardan elde edilen hammadde teslimi", ratio: "9/10" },
      { id: "222", label: "Pamuk, tiftik, yün, yapağı ve ham post/deri teslimleri", ratio: "9/10" },
      { id: "223", label: "Ağaç ve orman ürünleri teslimi", ratio: "5/10" },
      { id: "224", label: "Yük taşımacılığı hizmeti", ratio: "2/10" },
      { id: "225", label: "Ticari reklam hizmetleri", ratio: "9/10" },
      { id: "226", label: "Diğer teslimler", ratio: "2/10" },
      { id: "227", label: "Demir-çelik ürün teslimi", ratio: "5/10" },
      { id: "228", label: "Diğerleri", ratio: "3/10" },
      { id: "229", label: "Diğerleri", ratio: "4/10" },
      { id: "230", label: "Diğerleri", ratio: "5/10" },
      { id: "231", label: "Diğerleri", ratio: "7/10" },
      { id: "232", label: "Diğerleri", ratio: "9/10" },
    ];
    fetch("/api/withholding/job-types", { credentials: "include", cache: "no-store" })
      .then((r) => r.ok ? r.json() : Promise.reject(new Error("failed")))
      .then((data) => {
        const items = Array.isArray(data?.items) ? data.items : [];
        const mapped = items.map((it: { code: string; label: string; ratio: string }) => ({ id: it.code, label: it.label, ratio: it.ratio }));
        setJobTypes(mapped.length ? mapped : fallback);
      })
      .catch(() => setJobTypes(fallback));
  }, []);
  const selectedJob = jobTypes.find((x) => x.id === jobTypeId) || null;
  const rule = useMemo<WithholdingRule | null>(() => {
    if (!selectedJob) return null;
    const [num, den] = selectedJob.ratio.split("/").map((s) => Number(s));
    const p = den > 0 ? num / den : 0;
    return { id: selectedJob.id, code: selectedJob.ratio, label: selectedJob.label, vatRate, percent: p };
  }, [selectedJob, vatRate]);

  const lineItems = useMemo<InvoiceItemInput[]>(() => items.map((it) => ({ id: it.id, name: it.name, quantity: it.quantity, unitPrice: it.unitPrice, taxRate: vatRate, applyWithholding: Boolean(rule) })), [items, vatRate, rule]);
  const calc = useMemo(() => calculateWithholding(lineItems, rule), [lineItems, rule]);

  const example = useMemo(() => ({
    number: "F-" + new Date().toISOString().slice(0, 10).replace(/-/g, ""),
    date: new Date().toISOString().slice(0, 10),
    dueDate: dueDate || (() => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().slice(0, 10); })(),
    customer: {
      name: detail?.company?.name || "Firma",
      taxId: detail?.company?.taxId || "",
      address: detail?.company?.address || "",
    },
    supplier: {
      name: detail?.supplier?.name || "Tedarikçi",
      taxId: detail?.supplier?.taxId || "",
      address: detail?.supplier?.address || "",
    },
    items: items.map((it) => ({ id: it.id, name: it.name || "Ürün", quantity: it.quantity || 0, unitPrice: it.unitPrice || 0, taxRate: vatRate })),
  }), [detail, items, vatRate, dueDate]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Fatura Oluştur"
        description="Siparişle ilişkili veya bağımsız yeni bir fatura oluşturun."
        variant="gradient"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol Kolon: Fatura Bilgileri */}
        <div className="lg:col-span-1 space-y-6">
          <Card variant="glass" className="p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              Fatura Bilgileri
            </h3>

            <div className="space-y-4">
              <div className="relative">
                <Input
                  label="Sipariş Barkodu"
                  value={orderBarcode}
                  onChange={(e) => setOrderBarcode(e.target.value)}
                  autoFocus
                  placeholder="Sipariş barkodu girin"
                  error={orderSearchError}
                />
                {!detail && orderResults.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-xl max-h-48 overflow-auto">
                    {orderResults.map((r, idx) => (
                      <button
                        key={r.id}
                        className={`flex w-full items-center justify-between px-3 py-2 text-left hover:bg-blue-50 transition-colors ${orderActiveIndex === idx ? 'bg-blue-50' : ''}`}
                        onMouseEnter={() => setOrderActiveIndex(idx)}
                        onClick={() => selectOrder(r)}
                      >
                        <div>
                          <div className="text-sm font-medium text-slate-800">{r.barcode}</div>
                          <div className="text-xs text-slate-500">Seçmek için tıklayın</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {detail && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 text-sm text-blue-800 flex items-center justify-between">
                  <span>Sipariş seçildi: <strong>{detail.barcode}</strong></span>
                  <Button size="sm" variant="ghost" className="text-blue-600 hover:text-blue-800 hover:bg-blue-100" onClick={() => router.push(`/siparis/liste?q=${encodeURIComponent(orderBarcode)}`)}>
                    Detay
                  </Button>
                </div>
              )}

              <Input label="Fatura Numarası" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} onBlur={() => setInvoiceNumber((v) => v.trim())} />

              <Select label="KDV Oranı" value={String(vatRate)} onChange={(e) => setVatRate(Number(e.target.value))}>
                <option value="1">1%</option>
                <option value="10">10%</option>
                <option value="18">18%</option>
                <option value="20">20%</option>
              </Select>

              <Select label="İş Türü (Tevkifat)" value={jobTypeId} onChange={(e) => setJobTypeId(e.target.value)}>
                <option value="">Yok</option>
                {jobTypes.map((jt) => (
                  <option key={jt.id} value={jt.id}>{jt.label} • {jt.ratio}</option>
                ))}
              </Select>

              <Input label="Vade Tarihi" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </Card>
        </div>

        {/* Sağ Kolon: Kalemler ve Özet */}
        <div className="lg:col-span-2 space-y-6">
          <Card variant="glass" className="p-6">
            <ItemsSection
              label="Fatura Kalemleri"
              addButtonLabel="Kalem Ekle"
              items={items}
              onItemsChange={setItems}
              unitOptions={unitOptions}
            />
          </Card>

          <Card variant="glass" className="p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Fatura Önizleme</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">Alıcı (Firma)</div>
                <div className="text-sm font-bold text-slate-900">{example.customer.name}</div>
                <div className="text-xs text-slate-600 mt-1">Vergi No: <span className="font-medium">{example.customer.taxId || '-'}</span></div>
                <div className="text-xs text-slate-600">Adres: <span className="font-medium">{example.customer.address || '-'}</span></div>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">Satıcı (Tedarikçi)</div>
                <div className="text-sm font-bold text-slate-900">{example.supplier.name}</div>
                <div className="text-xs text-slate-600 mt-1">Vergi No: <span className="font-medium">{example.supplier.taxId || '-'}</span></div>
                <div className="text-xs text-slate-600">Adres: <span className="font-medium">{example.supplier.address || '-'}</span></div>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200 mb-6">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-4 py-3 text-left">Ürün/Hizmet</th>
                    <th className="px-4 py-3 text-right">Birim Fiyat</th>
                    <th className="px-4 py-3 text-center">Miktar</th>
                    <th className="px-4 py-3 text-center">Vergi (%)</th>
                    <th className="px-4 py-3 text-right">Tutar</th>
                    <th className="px-4 py-3 text-right">KDV</th>
                    <th className="px-4 py-3 text-right">Toplam</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {example.items.map((it) => {
                    const line = it.quantity * it.unitPrice;
                    const vat = line * (it.taxRate / 100);
                    const total = line + vat;
                    return (
                      <tr key={it.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-medium text-slate-900">{it.name}</td>
                        <td className="px-4 py-3 text-right text-slate-600">{new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(it.unitPrice)} ₺</td>
                        <td className="px-4 py-3 text-center text-slate-600">{it.quantity}</td>
                        <td className="px-4 py-3 text-center text-slate-600">{vatRate}</td>
                        <td className="px-4 py-3 text-right text-slate-600">{new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(line)} ₺</td>
                        <td className="px-4 py-3 text-right text-slate-600">{new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(vat)} ₺</td>
                        <td className="px-4 py-3 text-right font-medium text-slate-900">{new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(total)} ₺</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="font-medium text-slate-900 mb-2">Ödeme Bilgileri</div>
                  <div className="flex justify-between text-sm text-slate-600 mb-1">
                    <span>Yöntem:</span>
                    <span className="font-medium text-slate-900">Havale/EFT</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-600 mb-1">
                    <span>Vade:</span>
                    <span className="font-medium text-slate-900">{example.dueDate}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Koşullar:</span>
                    <span className="font-medium text-slate-900">30 gün</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Ara Toplam</span>
                  <span className="font-medium text-slate-900">{new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(calc.subtotal)} ₺</span>
                </div>
                <div className="flex justify-between text-sm text-slate-600">
                  <span>KDV Toplamı</span>
                  <span className="font-medium text-slate-900">{new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(calc.vatTotal)} ₺</span>
                </div>
                {rule && (
                  <div className="flex justify-between text-sm text-orange-600">
                    <span>Tevkifat ({rule.code})</span>
                    <span className="font-medium">-{new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(calc.withheldVat)} ₺</span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-200 flex justify-between text-base font-bold text-slate-900">
                  <span>Genel Toplam</span>
                  <span>{new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(calc.grossTotal)} ₺</span>
                </div>
                <div className="flex justify-between text-sm font-semibold text-blue-600">
                  <span>Ödenecek Tutar</span>
                  <span>{new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(rule ? calc.netPayableTotal : calc.grossTotal)} ₺</span>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <Button
                variant="gradient"
                size="lg"
                loading={creating}
                className="shadow-lg shadow-blue-500/20"
                onClick={async () => {
                  try {
                    setCreating(true);
                    const payload = {
                      number: invoiceNumber,
                      orderNo: detail?.barcode || orderBarcode,
                      amount: rule ? calc.netPayableTotal : calc.grossTotal,
                      dueDate: example.dueDate,
                      status: "Beklemede",
                      bank: null,
                      orderId: detail?.id || null,
                      vatRate,
                      withholdingCode: selectedJob ? selectedJob.ratio : undefined,
                      items: items.map((it) => ({ name: it.name, quantity: it.quantity, unitPrice: it.unitPrice, taxRate: vatRate })),
                    };
                    const errs: string[] = [];
                    if (!payload.number) errs.push("Fatura numarası");
                    if (!payload.orderNo) errs.push("Sipariş numarası");
                    if (!Number.isFinite(payload.amount)) errs.push("Tutar");
                    if (!payload.dueDate || isNaN(new Date(payload.dueDate).getTime())) errs.push("Vade tarihi");
                    if (errs.length) {
                      show({ title: "Eksik Bilgi", description: `Lütfen şu alanları kontrol edin: ${errs.join(", ")}`, variant: "warning" });
                      setCreating(false);
                      return;
                    }
                    const r = await fetch("/api/fatura", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(payload),
                    });
                    if (!r.ok) {
                      let errText = "Fatura oluşturulamadı";
                      try {
                        const ej = await r.json();
                        const code = ej?.code || ej?.error || "create_failed";
                        if (code === "duplicate_number") {
                          errText = "Bu fatura numarası zaten mevcut";
                        } else {
                          errText = ej?.message || "Sunucu hatası";
                        }
                      } catch { }
                      throw new Error(errText);
                    }
                    const j = await r.json().catch(() => ({}));
                    show({ title: "Başarılı", description: "Fatura başarıyla oluşturuldu", variant: "success" });
                    if (j?.id) router.push(`/fatura/liste?open=${encodeURIComponent(j.id)}`);
                  } catch (e: unknown) {
                    const msg = e instanceof Error ? e.message : "Fatura oluşturulamadı";
                    show({ title: "Hata", description: msg, variant: "error" });
                  } finally {
                    setCreating(false);
                  }
                }}
              >
                Faturayı Oluştur
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <Modal
        isOpen={orderSearchOpen}
        title="Sipariş Ara"
        onClose={() => setOrderSearchOpen(false)}
        footer={
          <Button variant="ghost" onClick={() => setOrderSearchOpen(false)}>Kapat</Button>
        }
      >
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input placeholder="Barkod ile ara..." value={orderBarcode} onChange={(e) => setOrderBarcode(e.target.value)} className="flex-1" />
            <Button loading={orderSearchLoading} onClick={searchOrders}>Ara</Button>
          </div>
          {orderSearchError && <div className="text-sm text-red-600">{orderSearchError}</div>}
          <div className="max-h-64 overflow-auto rounded-lg border border-slate-200">
            {orderResults.length === 0 && !orderSearchLoading ? (
              <div className="p-4 text-center text-sm text-slate-500">Sonuç bulunamadı</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {orderResults.map((r, idx) => (
                  <button
                    key={r.id}
                    className={`flex w-full items-center justify-between p-3 text-left hover:bg-slate-50 transition-colors ${orderActiveIndex === idx ? 'bg-slate-50' : ''}`}
                    onMouseEnter={() => setOrderActiveIndex(idx)}
                    onClick={() => selectOrder(r)}
                  >
                    <div>
                      <div className="text-sm font-medium text-slate-900">{r.barcode}</div>
                      <div className="text-xs text-slate-500">{new Date(r.date).toLocaleDateString('tr-TR')} • {r.status}</div>
                    </div>
                    <div className="text-sm font-semibold text-slate-700">{new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(r.total)} ₺</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}

// Wrapper with Suspense for useSearchParams
export default function FaturaOlusturPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Yükleniyor...</div>}>
      <FaturaOlusturContent />
    </Suspense>
  );
}
