"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import useLocalStorageState from "@/lib/useLocalStorageState";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import ItemsSection from "@/components/ItemsSection";
import { formatNumberTR, parseDecimalFlexible } from "@/lib/format";

type Option = { id: string; label: string; active?: boolean; email?: string | null };
type ProductRow = { id: string; name: string; quantity: number; unit: string; unitPrice: number; extraCosts: number; currency?: string };

type OptionsPayload = Record<string, Option[]>;
const emptyOptions: OptionsPayload = { ilgiliKisi: [], birim: [], durum: [], paraBirimi: [], birimTipi: [] };

const genId = () => (typeof crypto !== "undefined" && typeof (crypto as any).randomUUID === "function"
  ? (crypto as any).randomUUID()
  : (() => {
    if (typeof crypto !== "undefined" && typeof (crypto as any).getRandomValues === "function") {
      const buf = new Uint8Array(16);
      (crypto as any).getRandomValues(buf);
      buf[6] = (buf[6] & 0x0f) | 0x40;
      buf[8] = (buf[8] & 0x3f) | 0x80;
      const hex = Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    }
    return `id_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  })());

export default function TalepOlusturPage() {
  const { show } = useToast();
  const router = useRouter();

  // Permission check removed as requested
  // users can access this page without restrictions

  const [barcode, setBarcode] = useState("");
  const [barcodeUnique, setBarcodeUnique] = useState<"unknown" | "checking" | "unique" | "duplicate">("unknown");
  const [redirectTo, setRedirectTo] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [justification, setJustification] = useState("");
  const [budget, setBudget] = useState<number | "">("");
  const [options, setOptions] = useState<OptionsPayload>(emptyOptions);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [unitEmail, setUnitEmail] = useState<string>("");
  const [unitEmailError, setUnitEmailError] = useState<string | null>(null);
  const [selected, setSelected] = useLocalStorageState("talep.selected", {
    ilgiliKisi: "p1",
    birim: "b1",
    durum: "d1",
    paraBirimi: "c1",
  });
  const [products, setProducts] = useState<ProductRow[]>([
    { id: genId(), name: "", quantity: 1, unit: "u1", unitPrice: 0, extraCosts: 0 },
  ]);

  const formatDate = (d: Date) => d.toISOString().slice(0, 10);
  const [requestDateStr, setRequestDateStr] = useState<string>(formatDate(new Date()));

  const productCatalog = useMemo(
    () => [
      { sku: "LPT-001", name: "Laptop", unitPrice: 35000, unitId: "u1" },
      { sku: "MON-001", name: "Monitör", unitPrice: 5000, unitId: "u1" },
      { sku: "KLY-001", name: "Klavye", unitPrice: 700, unitId: "u1" },
      { sku: "MS-001", name: "Mouse", unitPrice: 600, unitId: "u1" },
      { sku: "OFS-001", name: "Ofis Sandalyesi", unitPrice: 2500, unitId: "u1" },
      { sku: "KRT-001", name: "Karton Kutu (Küçük)", unitPrice: 15, unitId: "u1" },
      { sku: "KRT-002", name: "Karton Kutu (Büyük)", unitPrice: 25, unitId: "u1" },
      { sku: "PRT-001", name: "A4 Fotokopi Kağıdı", unitPrice: 120, unitId: "u1" },
    ],
    []
  );

  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    (async () => {
      setOptionsLoading(true);
      setOptionsError(null);
      try {
        const [optRes, profRes] = await Promise.all([
          fetch("/api/options", { cache: "no-store" }),
          fetch("/api/profile", { cache: "no-store" })
        ]);

        if (!optRes.ok) {
          console.error("[options] fetch failed", optRes.status);
          setOptionsError(`HTTP ${optRes.status}`);
          setOptions(emptyOptions);
          return;
        }

        const data = (await optRes.json()) as OptionsPayload;
        const merged = { ...emptyOptions, ...data };
        setOptions(merged);

        let userData: any = null;
        if (profRes.ok) {
          userData = await profRes.json();
          setUserProfile(userData);
        }

        setSelected((s) => {
          // Find matching related person (ilgili kişi) by username
          const matchingPerson = userData
            ? merged.ilgiliKisi.find(p => p.label === userData.username)
            : null;

          // Find matching unit (birim) by unitId
          const matchingUnit = userData
            ? merged.birim.find(b => b.id === userData.unitId)
            : null;

          return {
            ilgiliKisi: matchingPerson?.id ?? (merged.ilgiliKisi[0]?.id ?? s.ilgiliKisi),
            birim: matchingUnit?.id ?? (merged.birim[0]?.id ?? s.birim),
            durum: merged.durum[0]?.id ?? s.durum,
            paraBirimi: merged.paraBirimi[0]?.id ?? s.paraBirimi,
          };
        });

      } catch (e) {
        console.error("[options] error:", e);
        setOptionsError("network_error");
        setOptions(emptyOptions);
      } finally {
        setOptionsLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    const u = options.birim.find((b) => b.id === selected.birim);
    // Priority: Unit's own email -> User's profile email -> Empty string
    const emailToSet = (u?.email ?? "") || (userProfile?.email ?? "") || "";
    setUnitEmail(emailToSet);
  }, [selected.birim, options.birim, userProfile]);

  useEffect(() => {
    if (!barcode) {
      setBarcodeUnique("unknown");
      return;
    }
    setBarcodeUnique("checking");
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/check-barcode?type=request&barcode=${encodeURIComponent(barcode)}`);
        const data = await res.json();
        setBarcodeUnique(data.unique ? "unique" : "duplicate");
      } catch {
        setBarcodeUnique("unknown");
      }
    }, 300);
    return () => clearTimeout(t);
  }, [barcode]);

  const computedBudgetRaw = useMemo(
    () =>
      products.reduce((sum, p) => {
        const lineTotal = (p.unitPrice || 0) * (p.quantity || 0) + (p.extraCosts || 0);
        return sum + lineTotal;
      }, 0),
    [products]
  );

  // Calculate totals per currency from products
  const currencyTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    products.forEach(p => {
      const currencyId = p.currency || selected.paraBirimi || options.paraBirimi[0]?.id;
      const lineTotal = (p.unitPrice || 0) * (p.quantity || 0) + (p.extraCosts || 0);
      if (currencyId) {
        totals[currencyId] = (totals[currencyId] || 0) + lineTotal;
      }
    });
    return totals;
  }, [products, selected.paraBirimi, options.paraBirimi]);


  const [budgetLimit, setBudgetLimit] = useState<number | "">("");

  // Currency Rates State
  const [rates, setRates] = useState<Record<string, number>>({
    TRY: 1,
    USD: 42.53, // Fallback
    EUR: 49.58, // Fallback
    GBP: 53.60, // Fallback
  });

  // Fetch live rates
  useEffect(() => {
    async function fetchRates() {
      try {
        const res = await fetch("/api/currency");
        if (res.ok) {
          const data = await res.json();
          // Ensure TRY is always 1 (base)
          setRates({ ...data, TRY: 1 });
        }
      } catch (err) {
        console.error("Failed to fetch rates:", err);
      }
    }
    fetchRates();
  }, []);

  // Calculate TRY equivalent of all items (must be after rates declaration)
  const tryEquivalentTotal = useMemo(() => {
    let total = 0;
    Object.entries(currencyTotals).forEach(([currencyId, amount]) => {
      const currencyLabel = options.paraBirimi.find(o => o.id === currencyId)?.label || "TRY";
      const rate = rates[currencyLabel] || 1;
      total += amount * rate;
    });
    return total;
  }, [currencyTotals, options.paraBirimi, rates]);

  const convertAmount = (amount: number, fromId: string, toId: string) => {
    if (fromId === toId) return amount;

    // Find labels (codes) for the IDs
    const fromLabel = options.paraBirimi.find(o => o.id === fromId)?.label || "TRY";
    const toLabel = options.paraBirimi.find(o => o.id === toId)?.label || "TRY";

    const rateFrom = rates[fromLabel] || 1;
    const rateTo = rates[toLabel] || 1;

    return amount * (rateFrom / rateTo);
  };

  useEffect(() => {
    setBudget(Number.isFinite(computedBudgetRaw) ? Number(computedBudgetRaw.toFixed(2)) : 0);
  }, [computedBudgetRaw]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (barcodeUnique !== "unique") {
      show({ title: "Barkod benzersiz olmalıdır", description: "Farklı bir barkod girin.", variant: "warning" });
      return;
    }
    if (!subject.trim()) {
      show({ title: "Konu zorunlu", description: "Lütfen talebin konusunu girin.", variant: "warning" });
      return;
    }
    if (subject.length > 500) {
      show({ title: "Konu çok uzun", description: "En fazla 500 karakter girin.", variant: "warning" });
      return;
    }
    if (computedBudgetRaw <= 0) {
      show({ title: "Geçersiz bütçe", description: "Toplam bütçe 0'dan büyük olmalı.", variant: "warning" });
      return;
    }
    if (products.length === 0 || products.some((p) => !p.name.trim() || p.quantity <= 0)) {
      show({ title: "Ürün bilgisi eksik", description: "En az bir ürün ve pozitif miktar girin.", variant: "warning" });
      return;
    }
    if (unitEmail && !/^\S+@\S+\.\S+$/.test(unitEmail)) {
      setUnitEmailError("Geçersiz e-posta formatı");
      show({ title: "E-posta geçersiz", description: "Birim e-posta adresini kontrol edin.", variant: "warning" });
      return;
    }
    try {
      const res = await fetch("/api/talep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          barcode,
          subject,
          budget: Number(computedBudgetRaw.toFixed(2)),
          relatedPersonId: selected.ilgiliKisi,
          unitId: selected.birim,
          statusId: selected.durum,
          currencyId: selected.paraBirimi,
          unitEmail: unitEmail || undefined,
          justification: justification || undefined,
          items: products.map((p) => ({ name: p.name, quantity: p.quantity, unitId: p.unit, unitPrice: p.unitPrice, extraCosts: p.extraCosts })),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "request_create_failed");
      }
      show({ title: "Kayıt başarıyla oluşturuldu", description: "Liste sayfasına yönlendiriliyorsunuz.", variant: "success" });
      setRedirectTo("/talep/liste");
      setTimeout(() => {
        try {
          router.push("/talep/liste");
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
          description: "Lütfen farklı bir barkod girin.",
          variant: "warning",
        });
        setBarcodeUnique("duplicate");
      } else {
        show({ title: "Talep oluşturulamadı", description: "Lütfen tekrar deneyin.", variant: "error" });
      }
    }
  };

  const handleReset = () => {
    setBarcode("");
    setBarcodeUnique("unknown");
    setRedirectTo(null);
    setSubject("");
    setJustification("");
    setBudget("");
    setProducts([{ id: genId(), name: "", quantity: 1, unit: "u1", unitPrice: 0, extraCosts: 0 }]);
    setBudgetLimit("");
    setRequestDateStr(new Date().toISOString().slice(0, 10));
    setUnitEmail("");
    setUnitEmailError(null);
    setSelected((s) => ({
      ilgiliKisi: options.ilgiliKisi[0]?.id ?? s.ilgiliKisi,
      birim: options.birim[0]?.id ?? s.birim,
      durum: options.durum[0]?.id ?? s.durum,
      paraBirimi: options.paraBirimi[0]?.id ?? s.paraBirimi,
    }));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Talep Oluştur"
        description="Yeni bir satınalma talebi oluşturun ve detaylarını girin."
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

      <Card variant="glass" className="p-6">
        <form onSubmit={handleSubmit} className="space-y-8">

          {/* Genel Bilgiler */}
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              Genel Bilgiler
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-1">
                <Input
                  label="Talep Barkodu"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="Manuel barkod giriniz"
                  description={
                    barcodeUnique === "checking" ? "Kontrol ediliyor..." :
                      barcodeUnique === "unique" ? "Benzersiz (demo)" :
                        barcodeUnique === "duplicate" ? "Barkod zaten mevcut!" :
                          "Benzersizlik kontrolü yapılacak"
                  }
                  error={barcodeUnique === "duplicate" ? "Bu barkod kullanılıyor" : undefined}
                  success={barcodeUnique === "unique" ? "Barkod uygun" : undefined}
                />
              </div>

              <div className="space-y-1">
                <Input
                  label="Talep Tarihi"
                  type="date"
                  value={requestDateStr}
                  onChange={(e) => setRequestDateStr(e.target.value)}
                  onKeyDown={(e) => { e.preventDefault(); }}
                  onInput={(e) => { (e as any).preventDefault?.(); }}
                  onFocus={(e) => { const el = e.target as HTMLInputElement & { showPicker?: () => void }; if (typeof el.showPicker === "function") el.showPicker(); }}
                />
              </div>

              <div className="space-y-1">
                <Select
                  label="Talep Durumu"
                  value={selected.durum}
                  disabled={optionsLoading || options.durum.length === 0}
                  onChange={(e) => setSelected((s) => ({ ...s, durum: e.target.value }))}
                >
                  {options.durum.map((o) => (
                    <option key={o.id} value={o.id}>{o.label}</option>
                  ))}
                </Select>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              </div>
              Birim ve Kişi Bilgileri
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Select
                  label="İlgili Kişi"
                  value={selected.ilgiliKisi}
                  onChange={(e) => setSelected((s) => ({ ...s, ilgiliKisi: e.target.value }))}
                >
                  {options.ilgiliKisi.map((o) => (
                    <option key={o.id} value={o.id}>{o.label}</option>
                  ))}
                </Select>

                <Select
                  label="Talep Eden Birim"
                  value={selected.birim}
                  disabled={optionsLoading || options.birim.length === 0}
                  onChange={(e) => setSelected((s) => ({ ...s, birim: e.target.value }))}
                >
                  {options.birim.map((o) => (
                    <option key={o.id} value={o.id}>{o.label}</option>
                  ))}
                </Select>
              </div>

              <div className="space-y-4">
                <Input
                  label="Birim E-posta"
                  type="email"
                  value={unitEmail}
                  onChange={(e) => { setUnitEmail(e.target.value); setUnitEmailError(null); }}
                  placeholder="ornek@birim.com"
                  error={unitEmailError || undefined}
                />
                {optionsError && <div className="text-xs text-red-600 bg-red-50 p-2 rounded">Seçenekler yüklenemedi: {optionsError}</div>}
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              Talep Detayları
            </h3>
            <div className="grid grid-cols-1 gap-6">
              <Input
                label="Talep Başlığı"
                multiline
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                rows={2}
                maxLength={500}
                placeholder="Talebin başlığını kısaca yazınız..."
                description={`${subject.length}/500 karakter`}
              />
              <Input
                label="Talep Gerekçesi"
                multiline
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                rows={3}
                maxLength={2000}
                placeholder="Bu alımın neden gerekli olduğunu detaylı açıklayınız..."
                description={`${justification.length}/2000 karakter`}
              />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6">
            <ItemsSection
              label="Talep Edilen Ürünler"
              addButtonLabel="Ürün Ekle"
              items={products}
              onItemsChange={setProducts}
              unitOptions={options.birimTipi}
              currencyOptions={options.paraBirimi}
              defaultCurrency={selected.paraBirimi}
              productCatalog={productCatalog}
            />
          </div>

          <div className="border-t border-slate-100 pt-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              Bütçe Özeti
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Para Birimi Bazında Toplamlar */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <h4 className="text-sm font-semibold text-slate-600 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                  Para Birimi Bazında Toplamlar
                </h4>
                <div className="space-y-2">
                  {Object.keys(currencyTotals).length > 0 ? (
                    Object.entries(currencyTotals).map(([currencyId, amount]) => {
                      const currency = options.paraBirimi.find(o => o.id === currencyId);
                      const label = currency?.label || "TRY";
                      return (
                        <div key={currencyId} className="flex items-center justify-between py-2 px-3 bg-white rounded-lg border border-slate-100">
                          <span className="font-medium text-slate-700">{label}</span>
                          <span className="text-lg font-bold text-slate-800">{formatNumberTR(amount)}</span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-sm text-slate-400 text-center py-4">Henüz ürün eklenmedi</div>
                  )}
                </div>
              </div>

              {/* TRY Karşılığı ve Limit */}
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-200">
                  <h4 className="text-sm font-semibold text-emerald-700 mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                    TRY Karşılığı (Genel Toplam)
                  </h4>
                  <div className="text-3xl font-bold text-emerald-800">
                    {formatNumberTR(tryEquivalentTotal)}
                    <span className="text-base font-normal text-emerald-600 ml-2">₺</span>
                  </div>
                  <p className="text-xs text-emerald-600 mt-1">Güncel döviz kurları ile hesaplanmıştır</p>
                </div>

                <Input
                  label="Bütçe Limiti (opsiyonel)"
                  type="text"
                  inputMode="decimal"
                  value={budgetLimit === "" ? "" : String(budgetLimit).replace(".", ",")}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === "") { setBudgetLimit(""); return; }
                    const parsed = parseDecimalFlexible(raw);
                    setBudgetLimit(parsed == null ? "" : parsed);
                  }}
                  placeholder="örn. 1.000,00 TRY"
                  error={budgetLimit !== "" && tryEquivalentTotal > Number(budgetLimit) ? "Bütçe limiti aşıldı!" : undefined}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={handleReset} type="button">
              Temizle
            </Button>
            <Button
              onClick={(e) => handleSubmit(e as any)}
              variant="gradient"
              size="lg"
              className="shadow-lg shadow-blue-500/20"
            >
              Talebi Kaydet
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
