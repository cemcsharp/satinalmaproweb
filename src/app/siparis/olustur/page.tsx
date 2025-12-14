"use client";
import React, { useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import useLocalStorageState from "@/lib/useLocalStorageState";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import ItemsSection, { ProductRow } from "@/components/ItemsSection";
import { formatNumberTR, parseDecimalFlexible } from "@/lib/format";

type Option = { id: string; label: string; active?: boolean; email?: string | null };
type OptionsPayload = { siparisDurumu: Option[]; alimYontemi: Option[]; yonetmelikMaddesi: Option[]; paraBirimi: Option[]; tedarikci: Option[]; firma: Option[]; birimTipi: Option[]; birim: Option[] };
const emptyOptions: OptionsPayload = { siparisDurumu: [], alimYontemi: [], yonetmelikMaddesi: [], paraBirimi: [], tedarikci: [], firma: [], birimTipi: [], birim: [] };

function SiparisOlusturContent() {
  const { show } = useToast();

  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRequestBarcode = searchParams.get("requestBarcode") || "";

  // Permission check removed as requested
  // users can access this page without restrictions

  const [orderBarcode, setOrderBarcode] = useState("");
  const [uniqueState, setUniqueState] = useState<"unknown" | "checking" | "unique" | "duplicate">("unknown");
  const [redirectTo, setRedirectTo] = useState<string | null>(null);
  const [linkedRequestBarcode, setLinkedRequestBarcode] = useState(initialRequestBarcode);
  const [linkedRequestBudget, setLinkedRequestBudget] = useState<number | "">("");
  const [budgetInput, setBudgetInput] = useState<string>("");
  const [linkedRequestId, setLinkedRequestId] = useState<string | null>(null);
  const [linkedRequestDetail, setLinkedRequestDetail] = useState<{
    id: string;
    barcode: string;
    subject: string;
    budget: number;
    unit: string;
    status: string;
    currency: string;
    date?: string;
    relatedPerson?: string | null;
    items?: Array<{ id: string; name: string; quantity: number; unit: string | null }>;
  } | null>(null);
  const [requestSearchResults, setRequestSearchResults] = useState<Array<{ id: string; barcode: string; subject: string; budget: number; unit: string; status: string; currency: string }>>([]);
  const [requestSearchOpen, setRequestSearchOpen] = useState(false);
  const [requestSearchLoading, setRequestSearchLoading] = useState(false);
  const [requestSearchError, setRequestSearchError] = useState<string>("");
  const [requestActiveIndex, setRequestActiveIndex] = useState<number>(-1);
  const [requestValidity, setRequestValidity] = useState<"unknown" | "checking" | "valid" | "invalid">("unknown");
  const [requestDetailError, setRequestDetailError] = useState<string>("");
  const [options, setOptions] = useState<OptionsPayload>(emptyOptions);
  const [unitEmail, setUnitEmail] = useState<string>("");
  const [currency, setCurrency] = useLocalStorageState("siparis.currency", "c1");
  const [status, setStatus] = useLocalStorageState("siparis.status", "s1");
  const [method, setMethod] = useLocalStorageState("siparis.method", "m1");
  const [regulation, setRegulation] = useLocalStorageState("siparis.regulation", "y1");
  const [supplier, setSupplier] = useLocalStorageState("siparis.supplier", "sup1");
  const [company, setCompany] = useLocalStorageState("siparis.company", "co1");
  const [estimatedDelivery, setEstimatedDelivery] = useState<string>("");
  const [supplierSearch, setSupplierSearch] = useState("");
  const [supplierOpen, setSupplierOpen] = useState(false);

  const genId = () => (typeof crypto !== "undefined" && typeof (crypto as any).randomUUID === "function"
    ? (crypto as any).randomUUID()
    : `id_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`);

  const [items, setItems] = useState<ProductRow[]>([{ id: genId(), name: "", quantity: 1, unit: "u1", unitPrice: 0, extraCosts: 0 }]);
  const [selectedRequestItemIds, setSelectedRequestItemIds] = useState<string[]>([]);

  const orderDate = useMemo(() => new Date(), []);

  const realizedTotal = items.reduce((sum, i) => sum + (i.quantity || 0) * (i.unitPrice || 0) + (i.extraCosts || 0), 0);
  const budgetDiff = linkedRequestBudget === "" ? undefined : Number(linkedRequestBudget) - realizedTotal;

  const formatTRInput = (raw: string, maxDecimals: number): string => {
    if (typeof raw !== "string") return "";
    let s = raw.replace(/\s+/g, "");
    if (s.includes(".") && s.includes(",")) {
      s = s.replace(/\./g, "");
    } else if (s.includes(".")) {
      s = s.replace(/\./g, "");
    }
    s = s.replace(/[^0-9,]/g, "");
    const parts = s.split(",");
    const intPart = parts[0] || "";
    const decPart = (parts[1] || "").slice(0, Math.max(0, maxDecimals));
    const intDigits = intPart.replace(/\./g, "");
    const withThousands = intDigits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    if (decPart) return `${withThousands},${decPart}`;
    if (s.endsWith(",") && withThousands.length > 0) return `${withThousands},`;
    if (s.endsWith(",")) return "";
    return withThousands;
  };

  const addItem = () => setItems((p) => [...p, { id: genId(), name: "", quantity: 1, unit: "u1", unitPrice: 0, extraCosts: 0 }]);
  const removeItem = (id: string) => setItems((p) => p.filter((i) => i.id !== id));
  const updateItem = (id: string, patch: Partial<ProductRow>) => setItems((p) => p.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  const checkUnique = async (val: string) => {
    if (!val) { setUniqueState("unknown"); return; }
    setUniqueState("checking");
    try {
      const res = await fetch(`/api/check-barcode?type=order&barcode=${encodeURIComponent(val)}`);
      const data = await res.json();
      setUniqueState(data.unique ? "unique" : "duplicate");
    } catch {
      setUniqueState("unknown");
    }
  };

  const handleReset = () => {
    setOrderBarcode("");
    setUniqueState("unknown");
    setRedirectTo(null);
    setLinkedRequestBarcode("");
    setLinkedRequestBudget("");
    setBudgetInput("");
    setLinkedRequestId(null);
    setLinkedRequestDetail(null);
    setRequestSearchResults([]);
    setRequestSearchOpen(false);
    setRequestSearchLoading(false);
    setRequestSearchError("");
    setRequestActiveIndex(-1);
    setRequestValidity("unknown");
    setItems([{ id: genId(), name: "", quantity: 1, unit: "u1", unitPrice: 0, extraCosts: 0 }]);
    setSelectedRequestItemIds([]);
    setCurrency(options.paraBirimi[0]?.id ?? "c1");
    setStatus(options.siparisDurumu[0]?.id ?? "s1");
    setMethod(options.alimYontemi[0]?.id ?? "m1");
    setRegulation(options.yonetmelikMaddesi[0]?.id ?? "y1");
    setSupplier(options.tedarikci[0]?.id ?? "sup1");
    setCompany(options.firma[0]?.id ?? "co1");
    setUnitEmail("");
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/options");
        const data = (await res.json()) as OptionsPayload;
        setOptions(data);
        setStatus(data.siparisDurumu[0]?.id ?? status);
        setMethod(data.alimYontemi[0]?.id ?? method);
        setRegulation(data.yonetmelikMaddesi[0]?.id ?? regulation);
        setCurrency(data.paraBirimi[0]?.id ?? currency);
        setSupplier(data.tedarikci[0]?.id ?? supplier);
        setCompany(data.firma[0]?.id ?? company);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);



  // Auto-search if initial barcode exists
  useEffect(() => {
    if (initialRequestBarcode && linkedRequestBarcode === initialRequestBarcode) {
      // Trigger validation and fetch
      validateRequestBarcode(initialRequestBarcode).then(ok => {
        if (ok) {
          fetch(`/api/talep?q=${encodeURIComponent(initialRequestBarcode)}&pageSize=1`)
            .then(res => res.json())
            .then(data => {
              const first = (data?.items || [])[0];
              if (first) {
                setLinkedRequestId(first.id);
                fetchRequestDetailById(first.id);
              }
            });
        }
      });
    }
  }, [initialRequestBarcode]);

  useEffect(() => {
    const label = (linkedRequestDetail?.unit || "").trim();
    if (!label) { setUnitEmail(""); return; }
    const match = options.birim.find((b) => (b.label || "").trim().toLowerCase() === label.toLowerCase());
    setUnitEmail(((match?.email ?? "") || ""));
  }, [linkedRequestDetail?.unit, options.birim]);

  const productCatalog = useMemo(
    () => [
      { name: "Laptop", unitPrice: 35000, unitId: "u1" },
      { name: "Monitör", unitPrice: 5000, unitId: "u1" },
      { name: "Klavye", unitPrice: 700, unitId: "u1" },
      { name: "Mouse", unitPrice: 600, unitId: "u1" },
      { name: "Ofis Sandalyesi", unitPrice: 2500, unitId: "u1" },
    ],
    []
  );

  useEffect(() => {
    const q = linkedRequestBarcode.trim();
    if (q.length < 3) {
      setRequestSearchResults([]);
      setRequestSearchError("");
      setRequestSearchLoading(false);
      setRequestSearchOpen(false);
      setRequestActiveIndex(-1);
      setRequestValidity("unknown");
      return;
    }
    setRequestSearchLoading(true);
    setRequestSearchError("");
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/talep?q=${encodeURIComponent(q)}&pageSize=5`);
        if (!res.ok) throw new Error("search_failed");
        const data = await res.json();
        const items = (data?.items || []) as Array<{ id: string; barcode: string; subject: string; budget: number; unit: string; status: string; currency: string }>;
        setRequestSearchResults(items);
        setRequestSearchOpen(true);
        setRequestActiveIndex(items.length > 0 ? 0 : -1);
        if (items.length === 0) {
          setRequestSearchError("Sonuç bulunamadı");
          setRequestValidity("invalid");
        } else {
          setRequestSearchError("");
          setRequestValidity("unknown");
        }
      } catch (err) {
        console.error(err);
        setRequestSearchError("Arama sırasında hata oluştu");
        setRequestSearchResults([]);
        setRequestSearchOpen(true);
        setRequestActiveIndex(-1);
        setRequestValidity("unknown");
      } finally {
        setRequestSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [linkedRequestBarcode]);

  const validateRequestBarcode = async (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) { setRequestValidity("invalid"); return false; }
    setRequestValidity("checking");
    try {
      const res = await fetch(`/api/check-barcode?type=request&barcode=${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      const exists = data && data.unique === false;
      setRequestValidity(exists ? "valid" : "invalid");
      return exists;
    } catch (e) {
      console.error(e);
      setRequestValidity("unknown");
      return false;
    }
  };

  const fetchRequestDetailById = async (id: string) => {
    if (!id) return;
    setRequestDetailError("");
    try {
      const res = await fetch(`/api/talep/${encodeURIComponent(id)}`);
      if (!res.ok) throw new Error("talep_detay_getirilemedi");
      const d = await res.json();
      setLinkedRequestDetail({
        id: d.id,
        barcode: d.barcode,
        subject: d.subject,
        budget: Number(d.budget),
        unit: d.unit ?? "-",
        status: d.status ?? "-",
        currency: d.currency ?? "-",
        date: d.date ?? undefined,
        relatedPerson: d.relatedPerson ?? null,
        items: Array.isArray(d.items) ? d.items : [],
      });
      const b = Number(d.budget);
      setLinkedRequestBudget(b);
      setBudgetInput(formatNumberTR(b));
      setLinkedRequestId(d.id);
      setRequestValidity("valid");
    } catch (e) {
      console.error(e);
      setRequestDetailError("Talep detayları alınamadı.");
    }
  };

  const handleSelectRequest = (idx: number) => {
    const item = requestSearchResults[idx];
    if (!item) return;
    setLinkedRequestBarcode(item.barcode);
    const bSel = Number(item.budget);
    setLinkedRequestBudget(bSel);
    setBudgetInput(formatNumberTR(bSel));
    setLinkedRequestId(item.id);
    fetchRequestDetailById(item.id);
    setRequestSearchOpen(false);
    setRequestActiveIndex(-1);
  };

  const transformRequestItems = (source: Array<{ id: string; name: string; quantity: number; unit: string | null }>) => {
    const invalids: string[] = [];
    const rows: ProductRow[] = source.map((it) => {
      const name = (it.name || "").trim();
      const qty = Number(it.quantity) || 0;
      if (!name || qty <= 0) {
        invalids.push(it.id);
      }
      const match = productCatalog.find((ci) => ci.name.toLowerCase() === name.toLowerCase());
      const unitId = match?.unitId || it.unit || options.birimTipi[0]?.id || "u1";
      const unitPrice = match?.unitPrice ?? 0;
      return { id: genId(), name, quantity: qty, unit: unitId, unitPrice, extraCosts: 0 } as ProductRow;
    }).filter((r) => r.name && r.quantity > 0);
    return { rows, invalids };
  };

  const mergeItems = (current: ProductRow[], incoming: ProductRow[]) => {
    const map = new Map<string, ProductRow>();
    const add = (row: ProductRow) => {
      const nameTrim = (row.name || "").trim();
      const qty = Number(row.quantity) || 0;
      if (!nameTrim || qty <= 0) return;
      const key = `${nameTrim.toLowerCase()}|${row.unit}`;
      const existing = map.get(key);
      if (existing) {
        map.set(key, { ...existing, quantity: (existing.quantity || 0) + (row.quantity || 0) });
      } else {
        map.set(key, row);
      }
    };
    current.forEach(add);
    incoming.forEach(add);
    return Array.from(map.values());
  };

  const handleTransferSelected = () => {
    if (!linkedRequestDetail || !Array.isArray(linkedRequestDetail.items) || linkedRequestDetail.items.length === 0) {
      return show({ title: "Aktarılacak ürün yok", description: "Önce bir talep seçin.", variant: "warning" });
    }
    const selected = linkedRequestDetail.items.filter((it) => selectedRequestItemIds.includes(it.id));
    if (selected.length === 0) {
      return show({ title: "Seçim yapın", description: "Aktarmak için en az bir ürün seçin.", variant: "info" });
    }
    const { rows, invalids } = transformRequestItems(selected);
    const merged = mergeItems(items, rows);
    setItems(merged);
    setSelectedRequestItemIds([]);
    if (invalids.length > 0) {
      show({ title: "Bazı ürünler atlandı", description: `${invalids.length} kalem geçersiz veri nedeniyle aktarılmadı.`, variant: "warning" });
    }
    show({ title: "Aktarım başarılı", description: `${rows.length} kalem siparişe eklendi.`, variant: "success" });
  };

  const handleTransferAll = () => {
    if (!linkedRequestDetail || !Array.isArray(linkedRequestDetail.items) || linkedRequestDetail.items.length === 0) {
      return show({ title: "Aktarılacak ürün yok", description: "Önce bir talep seçin.", variant: "warning" });
    }
    const { rows, invalids } = transformRequestItems(linkedRequestDetail.items);
    const merged = mergeItems(items, rows);
    setItems(merged);
    setSelectedRequestItemIds([]);
    if (invalids.length > 0) {
      show({ title: "Bazı ürünler atlandı", description: `${invalids.length} kalem geçersiz veri nedeniyle aktarılmadı.`, variant: "warning" });
    }
    show({ title: "Aktarım başarılı", description: `${rows.length} kalem siparişe eklendi.`, variant: "success" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uniqueState !== "unique") return show({ title: "Barkod benzersiz olmalıdır", description: "Farklı bir barkod girin.", variant: "warning" });
    if (!orderBarcode) return show({ title: "Sipariş barkodu zorunlu", description: "Lütfen barkodu girin.", variant: "warning" });
    if (!linkedRequestBarcode.trim()) return show({ title: "Talep barkodu zorunlu", description: "Lütfen talep barkodunu girin.", variant: "warning" });
    if (requestValidity !== "valid") {
      const ok = await validateRequestBarcode(linkedRequestBarcode);
      if (!ok) return show({ title: "Geçersiz talep barkodu", description: "Lütfen doğru barkodu giriniz.", variant: "warning" });
    }
    if (linkedRequestBudget === "" || Number(linkedRequestBudget) <= 0) return show({ title: "Geçersiz talep bütçesi", description: "Lütfen bütçeyi kontrol edin.", variant: "warning" });
    if (items.length === 0 || items.some((i) => !i.name.trim() || i.quantity <= 0)) return show({ title: "Kalemlerde hata var", description: "İsim ve miktarları kontrol edin.", variant: "warning" });
    try {
      const res = await fetch("/api/siparis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          barcode: orderBarcode,
          statusId: status,
          methodId: method,
          regulationId: regulation,
          currencyId: currency,
          supplierId: supplier,
          companyId: company,
          requestBarcode: linkedRequestBarcode || undefined,
          estimatedDelivery: estimatedDelivery || undefined,
          items: items.map((i) => ({ name: i.name, quantity: i.quantity, unitPrice: i.unitPrice, unitId: i.unit, extraCosts: i.extraCosts })),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "order_create_failed");
      }
      show({ title: "Kayıt başarıyla oluşturuldu", description: "Liste sayfasına yönlendiriliyorsunuz.", variant: "success" });
      setRedirectTo("/siparis/liste");
      setTimeout(() => {
        try {
          router.push("/siparis/liste");
        } catch (e) {
          console.error("redirect_failed", e);
        }
      }, 2000);
    } catch (err: any) {
      console.error(err);
      const code = typeof err?.message === "string" ? err.message : "";
      if (code === "duplicate_barcode") {
        show({
          title: "Barkod zaten kullanılıyor",
          description: "Farklı bir barkod girin veya mevcut kaydı açın.",
          variant: "warning",
        });
        setUniqueState("duplicate");
      } else {
        show({ title: "Sipariş oluşturulamadı", description: "Lütfen tekrar deneyin.", variant: "error" });
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Sipariş Oluştur"
        description="Yeni bir satınalma siparişi oluşturun ve detaylarını girin."
        variant="gradient"
      />

      {redirectTo && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            <span>Kayıt başarıyla oluşturuldu, liste sayfasına yönlendiriliyorsunuz.</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="bg-white hover:bg-green-50 border-green-200 text-green-700"
            onClick={() => router.push(redirectTo)}
          >
            Hemen Git
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol Kolon: Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card variant="glass" className="p-6">
            <form onSubmit={handleSubmit} className="space-y-8">

              {/* İlişkili Talep */}
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  İlişkili Talep
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1 relative">
                    <Input
                      label="İlişkili Talep Barkodu"
                      value={linkedRequestBarcode}
                      onChange={(e) => { setLinkedRequestBarcode(e.target.value); setRequestSearchOpen(true); }}
                      onFocus={() => { if (linkedRequestBarcode.trim().length >= 3) setRequestSearchOpen(true); }}
                      onBlur={async () => {
                        if (linkedRequestBarcode.trim()) {
                          const ok = await validateRequestBarcode(linkedRequestBarcode);
                          if (ok && !linkedRequestDetail) {
                            try {
                              const res = await fetch(`/api/talep?q=${encodeURIComponent(linkedRequestBarcode.trim())}&pageSize=1`);
                              if (res.ok) {
                                const data = await res.json();
                                const first = (data?.items || [])[0];
                                if (first) {
                                  setLinkedRequestId(first.id);
                                  await fetchRequestDetailById(first.id);
                                }
                              }
                            } catch (e) { console.error(e); }
                          }
                        }
                        setTimeout(() => setRequestSearchOpen(false), 150);
                      }}
                      placeholder="Talep barkodu giriniz"
                      description={
                        requestValidity === "checking" ? "Doğrulanıyor..." :
                          requestValidity === "valid" ? "Talep bulundu" :
                            requestValidity === "invalid" ? "Geçersiz barkod" :
                              "Arama ile talep listelenir (min 3 karakter)"
                      }
                      error={requestValidity === "invalid" ? "Geçersiz talep" : undefined}
                      success={requestValidity === "valid" ? "Talep doğrulandı" : undefined}
                    />
                    {requestSearchOpen && (
                      <div className="absolute z-20 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-xl max-h-60 overflow-auto">
                        {requestSearchLoading && <div className="p-3 text-sm text-slate-500">Aranıyor...</div>}
                        {!requestSearchLoading && requestSearchError && <div className="p-3 text-sm text-red-500">{requestSearchError}</div>}
                        {!requestSearchLoading && !requestSearchError && requestSearchResults.map((r, idx) => (
                          <button
                            type="button"
                            key={r.id}
                            className={`flex w-full items-start gap-3 p-3 text-left text-sm hover:bg-blue-50 transition-colors ${idx === requestActiveIndex ? "bg-blue-50" : ""}`}
                            onMouseDown={(e) => { if (e.button === 0) { e.preventDefault(); handleSelectRequest(idx); } }}
                          >
                            <div className="flex-1">
                              <div className="font-medium text-slate-800">{r.barcode}</div>
                              <div className="text-xs text-slate-500 mt-0.5">{r.subject}</div>
                            </div>
                            <div className="text-right text-xs text-slate-500">
                              <div>{formatNumberTR(Number(r.budget))} {r.currency}</div>
                              <div>{r.status}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Input label="Birim E-posta" type="email" value={unitEmail} onChange={(e) => setUnitEmail(e.target.value)} placeholder="birim@ornek.com" />
                  </div>
                </div>
              </div>

              {/* Sipariş Detayları */}
              <div className="border-t border-slate-100 pt-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                  </div>
                  Sipariş Detayları
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Sipariş Barkodu"
                    value={orderBarcode}
                    onChange={(e) => { setOrderBarcode(e.target.value); checkUnique(e.target.value); }}
                    description={
                      uniqueState === "checking" ? "Kontrol ediliyor..." :
                        uniqueState === "unique" ? "Benzersiz (demo)" :
                          uniqueState === "duplicate" ? "Barkod zaten mevcut!" :
                            "Benzersizlik kontrolü yapılacak"
                    }
                    error={uniqueState === "duplicate" ? "Bu barkod kullanılıyor" : undefined}
                    success={uniqueState === "unique" ? "Barkod uygun" : undefined}
                  />
                  <Input label="Sipariş Tarihi" value={orderDate.toLocaleDateString()} readOnly className="bg-slate-50" />
                  <Input label="Tahmini Teslim Tarihi" type="date" value={estimatedDelivery} onChange={(e) => setEstimatedDelivery(e.target.value)} />
                  <Select label="Sipariş Durumu" value={status} onChange={(e) => setStatus(e.target.value)}>
                    {options.siparisDurumu.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                  </Select>
                  <Select label="Alım Yöntemi" value={method} onChange={(e) => setMethod(e.target.value)}>
                    {options.alimYontemi.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                  </Select>
                  <Select label="Yönetmelik Maddesi" value={regulation} onChange={(e) => setRegulation(e.target.value)}>
                    {options.yonetmelikMaddesi.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                  </Select>
                </div>
              </div>

              {/* Tedarikçi ve Bütçe */}
              <div className="border-t border-slate-100 pt-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                  </div>
                  Tedarikçi ve Bütçe
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="relative">
                    <Input
                      label="Tedarikçi (Satıcı)"
                      placeholder="Tedarikçi adı yazın"
                      value={supplierSearch}
                      onChange={(e) => {
                        setSupplierSearch(e.target.value);
                        setSupplierOpen(Boolean(e.target.value.trim()));
                      }}
                    />
                    {supplierOpen && (
                      <RemoteSupplierSuggestions
                        query={supplierSearch}
                        onSelect={(item) => {
                          setSupplier(item.id);
                          setSupplierSearch(item.name);
                          setSupplierOpen(false);
                        }}
                      />
                    )}
                  </div>

                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <Input
                        label="Talep Bütçesi"
                        type="text"
                        inputMode="decimal"
                        value={budgetInput}
                        onChange={(e) => {
                          const masked = formatTRInput(e.target.value, 2);
                          setBudgetInput(masked);
                          const parsed = parseDecimalFlexible(masked);
                          setLinkedRequestBudget(parsed == null ? "" : parsed);
                        }}
                        placeholder="örn. 1.000,00"
                      />
                    </div>
                    <div className="w-32">
                      <Select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                        {options.paraBirimi.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Kalemler */}
              <div className="border-t border-slate-100 pt-6">
                <ItemsSection
                  label="Sipariş Kalemleri"
                  addButtonLabel="Kalem Ekle"
                  items={items}
                  onItemsChange={setItems}
                  unitOptions={options.birimTipi}
                  productCatalog={productCatalog}
                />

                <div className="mt-4 flex flex-col sm:flex-row justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="text-sm text-slate-600">
                    Gerçekleşen Tutar: <span className="font-bold text-slate-900 text-lg ml-1">{formatNumberTR(realizedTotal)}</span> {options.paraBirimi.find((c) => c.id === currency)?.label}
                  </div>
                  <div className="text-sm text-slate-600 mt-2 sm:mt-0">
                    Bütçe Farkı:
                    <span className={`font-bold text-lg ml-2 ${budgetDiff === undefined ? "text-slate-900" : budgetDiff >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {budgetDiff === undefined ? "-" : formatNumberTR(budgetDiff)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Button variant="outline" onClick={handleReset} type="button">
                  Temizle
                </Button>
                <Button
                  onClick={handleSubmit}
                  variant="gradient"
                  size="lg"
                  className="shadow-lg shadow-blue-500/20"
                >
                  Siparişi Kaydet
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Sağ Kolon: Talep Detayı */}
        <div className="lg:col-span-1">
          {linkedRequestDetail ? (
            <Card variant="glass" className="sticky top-6 p-5 border-l-4 border-l-blue-500">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Talep Detayları</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Talep Barkodu</div>
                  <div className="text-sm font-medium text-slate-900">{linkedRequestDetail.barcode}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Konu</div>
                  <div className="text-sm font-medium text-slate-900">{linkedRequestDetail.subject}</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Bütçe</div>
                    <div className="text-sm font-medium text-slate-900">{formatNumberTR(Number(linkedRequestDetail.budget))} {linkedRequestDetail.currency}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Tarih</div>
                    <div className="text-sm font-medium text-slate-900">{linkedRequestDetail.date ? new Date(linkedRequestDetail.date).toLocaleDateString() : "-"}</div>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">İlgili Kişi</div>
                  <div className="text-sm font-medium text-slate-900">{linkedRequestDetail.relatedPerson ?? "-"}</div>
                </div>

                {Array.isArray(linkedRequestDetail.items) && linkedRequestDetail.items.length > 0 && (
                  <div className="pt-4 border-t border-slate-100">
                    <div className="mb-2 text-sm font-semibold text-slate-700">Talep Edilen Ürünler</div>
                    <div className="max-h-60 overflow-y-auto pr-1 space-y-2">
                      {linkedRequestDetail.items.map((it) => (
                        <div key={it.id} className="flex items-start gap-2 p-2 rounded bg-slate-50 border border-slate-100 text-sm">
                          <input
                            type="checkbox"
                            className="mt-1 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            checked={selectedRequestItemIds.includes(it.id)}
                            onChange={(e) => {
                              setSelectedRequestItemIds((prev) => {
                                if (e.target.checked) return [...prev, it.id];
                                return prev.filter((pid) => pid !== it.id);
                              });
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{it.name}</div>
                            <div className="text-xs text-slate-500">{it.quantity} {it.unit ?? "-"}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <Button size="sm" variant="secondary" onClick={handleTransferSelected} className="w-full text-xs">
                        Seçileni Aktar
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleTransferAll} className="w-full text-xs">
                        Tümünü Aktar
                      </Button>
                    </div>
                  </div>
                )}

                {requestDetailError && (
                  <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">{requestDetailError}</div>
                )}
              </div>
            </Card>
          ) : (
            <div className="hidden lg:block sticky top-6">
              <div className="rounded-xl border-2 border-dashed border-slate-200 p-8 text-center bg-slate-50/50">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                </div>
                <h4 className="text-sm font-medium text-slate-900">Talep Seçilmedi</h4>
                <p className="text-xs text-slate-500 mt-1">Sol taraftan bir talep seçtiğinizde detayları burada görünecektir.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RemoteSupplierSuggestions({ query, onSelect }: { query: string; onSelect: (item: { id: string; name: string }) => void }) {
  const [items, setItems] = React.useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const q = query.trim();
    if (q.length < 2) { setItems([]); setLoading(false); setError(null); return; }
    setLoading(true);
    setError(null);
    const t = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q, pageSize: "6", sortBy: "name", sortDir: "asc" });
        const res = await fetch(`/api/tedarikci?${params.toString()}`);
        if (!res.ok) throw new Error("remote_search_failed");
        const data = await res.json();
        const list = (data?.items || []).map((s: any) => ({ id: s.id, name: s.name }));
        setItems(list);
      } catch (e: any) {
        setError(e?.message || "Hata");
        setItems([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div className="absolute z-10 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-xl max-h-48 overflow-auto">
      {loading && <div className="p-3 text-sm text-slate-500">Aranıyor…</div>}
      {!loading && error && <div className="p-3 text-sm text-red-500">{error}</div>}
      {!loading && !error && items.length === 0 && <div className="p-3 text-sm text-slate-500">Sonuç yok</div>}
      {!loading && !error && items.length > 0 && (
        <div>
          {items.map((o) => (
            <button
              key={o.id}
              type="button"
              className="flex w-full items-center justify-between p-3 text-left hover:bg-blue-50 transition-colors border-b border-slate-50 last:border-0"
              onClick={() => onSelect(o)}
            >
              <span className="font-medium text-sm text-slate-700">{o.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Wrapper with Suspense for useSearchParams
export default function SiparisOlusturPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Yükleniyor...</div>}>
      <SiparisOlusturContent />
    </Suspense>
  );
}
