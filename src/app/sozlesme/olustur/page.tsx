"use client";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import FileUpload from "@/components/ui/FileUpload";
import { render, contractTemplates } from "@/lib/template";

function SozlesmeOlusturForm() {
  const { show } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Permission check removed as requested
  // users can access this page without restrictions

  const [title, setTitle] = useState(searchParams.get("title") ?? "");
  const [parties, setParties] = useState(searchParams.get("parties") ?? "");
  const [startDate, setStartDate] = useState(searchParams.get("startDate") ?? "");
  const [endDate, setEndDate] = useState(searchParams.get("endDate") ?? "");
  const [template, setTemplate] = useState(searchParams.get("template") ?? "");
  const [terms, setTerms] = useState(searchParams.get("terms") ?? "");
  const [renewal, setRenewal] = useState(searchParams.get("renewal") ?? "");
  const [termination, setTermination] = useState(searchParams.get("termination") ?? "");
  const [contractType, setContractType] = useState(searchParams.get("contractType") ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [orderBarcode, setOrderBarcode] = useState(searchParams.get("orderBarcode") ?? "");
  const [orderResults, setOrderResults] = useState<Array<{ id: string; barcode: string; date: string; status: string; method: string; total: number }>>([]);
  const [orderSearchOpen, setOrderSearchOpen] = useState(false);
  const [orderActiveIndex, setOrderActiveIndex] = useState(-1);
  const [orderSelected, setOrderSelected] = useState<null | { id: string; barcode: string }>(null);
  const [orderSearchLoading, setOrderSearchLoading] = useState(false);
  const [orderSearchError, setOrderSearchError] = useState<string>("");
  const [suppliers, setSuppliers] = useState<Array<{ id: string; label: string }>>([]);
  const [companies, setCompanies] = useState<Array<{ id: string; label: string }>>([]);
  const [partyInput, setPartyInput] = useState("");
  const [partyOpen, setPartyOpen] = useState(false);
  const [partySuggestions, setPartySuggestions] = useState<Array<{ id: string; type: "supplier" | "company"; label: string }>>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [autofillInfo, setAutofillInfo] = useState<{ orderTotal?: number; currency?: string; method?: string } | null>(null);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const templateText = useMemo(() => {
    const tpl = (template && (contractTemplates as any)[template]) || contractTemplates.standart;
    return render(tpl, {
      parties,
      startDate,
      endDate,
      orderBarcode: orderSelected?.barcode || "",
      summary: terms,
      method: autofillInfo?.method || "",
      orderTotal: autofillInfo?.orderTotal || 0,
      currency: autofillInfo?.currency || "",
    });
  }, [template, parties, startDate, endDate, orderSelected, terms, autofillInfo]);

  const applyTemplate = () => {
    setTerms(templateText);
    show({ title: "Şablon uygulandı", description: "Metin alanı şablondan dolduruldu", variant: "success" });
  };
  const [confirmDeleteLabel, setConfirmDeleteLabel] = useState<string | null>(null);
  const cancelBtnRef = useRef<HTMLButtonElement | null>(null);
  const confirmBtnRef = useRef<HTMLButtonElement | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!confirmDeleteLabel) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setConfirmDeleteLabel(null);
      } else if (e.key === "Enter") {
        removeParty(confirmDeleteLabel);
        setConfirmDeleteLabel(null);
      }
    };
    document.addEventListener("keydown", onKey);
    const focusT = setTimeout(() => {
      (confirmBtnRef.current ?? cancelBtnRef.current)?.focus();
    }, 0);
    return () => {
      document.removeEventListener("keydown", onKey);
      clearTimeout(focusT);
    };
  }, [confirmDeleteLabel]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/options");
        const data = await res.json();
        setSuppliers(data.tedarikci || []);
        const firms = data.firma || [];
        setCompanies(firms);
        if (firms.length > 0) {
          const defaultCompany = firms[0];
          setSelectedCompanyId((prev) => prev || defaultCompany.id);
          setParties((prev) => {
            const p = (prev || "").trim();
            const name = defaultCompany.label;
            if (!p) return name;
            const tokens = p.split(";").map((s) => s.trim().toLowerCase()).filter(Boolean);
            if (tokens.includes(name.trim().toLowerCase())) return prev;
            return `${name}; ${prev}`;
          });
        }
      } catch { }
    })();
  }, []);

  useEffect(() => {
    const q = partyInput.trim();
    if (q.length < 2) { setPartySuggestions([]); setPartyOpen(false); return; }
    setPartyOpen(true);
    const t = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q, pageSize: "6", sortBy: "name", sortDir: "asc" });
        const res = await fetch(`/api/tedarikci?${params.toString()}`);
        if (!res.ok) throw new Error("remote_search_failed");
        const data = await res.json();
        const sup = (data?.items || []).map((s: any) => ({ id: s.id, type: "supplier" as const, label: s.name }));
        const list = sup.slice(0, 6);
        setPartySuggestions(list);
      } catch (e) {
        setPartySuggestions([]);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [partyInput]);

  useEffect(() => {
    (async () => {
      try {
        const qs = new URLSearchParams();
        qs.set("type", "contract");
        if (selectedSupplierId) qs.set("supplierId", selectedSupplierId);
        if (selectedCompanyId) qs.set("companyId", selectedCompanyId);
        if (orderSelected?.id) qs.set("orderId", orderSelected.id);
        if ([...qs.keys()].length === 0) { setAutofillInfo(null); return; }
        const res = await fetch(`/api/autofill?${qs.toString()}`);
        const data = await res.json();
        const info = {
          orderTotal: data?.lastOrder?.total,
          currency: data?.lastOrder?.currency,
          method: data?.lastOrder?.method,
        };
        setAutofillInfo(info);
        if (!title) {
          if (orderSelected?.barcode) setTitle(`Sipariş ${orderSelected.barcode} Sözleşmesi`);
          else if (parties) setTitle(`${parties} Sözleşmesi`);
        }
      } catch { }
    })();
  }, [selectedSupplierId, selectedCompanyId, orderSelected, parties, title]);

  useEffect(() => {
    const q = orderBarcode.trim();
    if (q.length < 3) {
      setOrderResults([]);
      setOrderSearchOpen(false);
      setOrderActiveIndex(-1);
      setOrderSearchError("");
      return;
    }
    setOrderSearchLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/siparis?q=${encodeURIComponent(q)}&pageSize=5`);
        if (!res.ok) throw new Error("search_failed");
        const data = await res.json();
        const items = (data?.items || []) as Array<{ id: string; barcode: string; date: string; status: string; method: string; total: number }>;
        setOrderResults(items);
        setOrderSearchOpen(true);
        setOrderActiveIndex(items.length > 0 ? 0 : -1);
        setOrderSearchError(items.length === 0 ? "Sonuç bulunamadı" : "");
        const exact = items.find((it) => it.barcode.toLowerCase() === q.toLowerCase());
        if (exact) setOrderSelected({ id: exact.id, barcode: exact.barcode });
      } catch (err) {
        console.error(err);
        setOrderResults([]);
        setOrderSearchOpen(true);
        setOrderActiveIndex(-1);
        setOrderSearchError("Arama sırasında hata oluştu");
      } finally {
        setOrderSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [orderBarcode]);

  useEffect(() => {
    (async () => {
      try {
        if (!orderSelected?.id) return;
        const res = await fetch(`/api/siparis/${encodeURIComponent(orderSelected.id)}`);
        if (!res.ok) return;
        const d = await res.json();
        const tokens = (parties || "").split(";").map((s) => s.trim().toLowerCase()).filter(Boolean);
        const nextParts: string[] = (parties || "").split(";").map((s) => s.trim()).filter(Boolean);
        const maybePush = (name?: string | null) => {
          const label = (name || "").trim();
          if (!label) return;
          const lower = label.toLowerCase();
          if (!tokens.includes(lower)) nextParts.push(label);
        };
        maybePush(d.companyName);
        maybePush(d.supplierName);
        setParties(nextParts.join("; "));
        if (!startDate && d.date) setStartDate(String(d.date).slice(0, 10));
        if (d.supplierId) setSelectedSupplierId(String(d.supplierId));
        if (d.companyId) setSelectedCompanyId(String(d.companyId));
      } catch { }
    })();
  }, [orderSelected]);

  const submit = () => {
    (async () => {
      try {
        setSubmitting(true);
        const nextErrors: Record<string, string> = {};
        if (!title.trim()) nextErrors.title = "Başlık zorunludur";
        if (!contractType.trim()) nextErrors.contractType = "Sözleşme türü zorunludur";
        if (!startDate) nextErrors.startDate = "Başlangıç tarihi zorunludur";
        if (!parties.trim()) nextErrors.parties = "Taraf bilgileri eklenmelidir";
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) {
          show({ title: "Eksik alanlar", description: "Lütfen zorunlu alanları doldurun.", variant: "error" });
          setSubmitting(false);
          return;
        }

        let uploadedFiles: Array<{ fileName: string; url: string; mimeType: string }> = [];
        if (uploadFiles.length > 0) {
          try {
            setUploading(true);
            const formData = new FormData();
            uploadFiles.forEach((file) => formData.append("files", file));

            const uploadRes = await fetch("/api/upload", {
              method: "POST",
              body: formData,
            });

            if (!uploadRes.ok) {
              throw new Error("Upload failed");
            }

            const uploadData = await uploadRes.json();
            uploadedFiles = uploadData.files || [];
          } catch (uploadError) {
            show({ title: "Dosya yükleme hatası", description: "Dosyalar yüklenirken bir hata oluştu", variant: "error" });
            setSubmitting(false);
            setUploading(false);
            return;
          } finally {
            setUploading(false);
          }
        }

        const res = await fetch("/api/sozlesme", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            type: contractType,
            template: template || undefined,
            parties,
            startDate,
            endDate,
            status: "Taslak",
            orderId: orderSelected?.id ?? null,
            attachments: uploadedFiles.map((f) => ({
              title: f.fileName,
              url: f.url,
              mimeType: f.mimeType,
            })),
          }),
        });
        if (!res.ok) {
          if (res.status === 409) {
            const err = await res.json().catch(() => ({ code: "duplicate" }));
            const code = err?.code || "duplicate";
            if (code === "duplicate_contract") {
              show({
                title: "Çakışan sözleşme",
                description: "Aynı başlık ve tarih aralığına sahip bir sözleşme zaten mevcut.",
                variant: "warning",
              });
              setSubmitting(false);
              return;
            }
            if (code === "duplicate_number") {
              show({
                title: "Numara çakışması",
                description: "Bu sözleşme numarası zaten mevcut. Lütfen tekrar deneyin.",
                variant: "warning",
              });
              setSubmitting(false);
              return;
            }
          }
          throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();
        show({ title: "Sözleşme oluşturuldu", description: `${data.number} başarıyla kaydedildi`, variant: "success" });
        router.push("/sozlesme/liste");
      } catch (e) {
        show({ title: "Hata", description: "Sözleşme kaydedilemedi", variant: "error" });
      } finally {
        setSubmitting(false);
      }
    })();
  };

  const removeParty = (label: string) => {
    try {
      const current = (parties || "").split(";").map((s) => s.trim()).filter(Boolean);
      const next = current.filter((s) => s.toLowerCase() !== label.trim().toLowerCase());
      if (next.length === current.length) {
        show({ title: "Hata", description: "Firma bulunamadı", variant: "error" });
        return;
      }
      setParties(next.join("; "));
      show({ title: "İşlem başarılı", description: "Firma başarıyla silindi", variant: "success" });
    } catch (e) {
      show({ title: "Hata", description: "Firma silinirken bir hata oluştu", variant: "error" });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Sözleşme Oluştur"
        description="Yeni bir sözleşme oluşturun, şablon kullanın veya dosya yükleyin."
        variant="gradient"
      />

      {Object.keys(errors).length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 flex items-center gap-3">
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          <span>Lütfen formdaki işaretli alanları düzeltin.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol Kolon: Temel Bilgiler */}
        <div className="lg:col-span-2 space-y-6">
          {/* Sipariş İlişkilendirme */}
          <Card variant="glass" className="p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
              </div>
              Sipariş İlişkilendirme
            </h3>
            <div className="relative">
              <div className="flex gap-2">
                <Input
                  value={orderBarcode}
                  onChange={(e) => { setOrderBarcode(e.target.value); setOrderSelected(null); }}
                  placeholder="Sipariş barkodu ile ara..."
                  className="flex-1"
                />
                <Button variant="outline" onClick={() => setOrderBarcode("")} disabled={!orderBarcode}>Temizle</Button>
              </div>

              {orderSearchOpen && (
                <div className="absolute z-10 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-xl max-h-48 overflow-auto">
                  {orderSearchLoading && <div className="p-3 text-sm text-slate-500">Aranıyor…</div>}
                  {!orderSearchLoading && orderResults.length === 0 && (
                    <div className="p-3 text-sm text-slate-500">{orderSearchError || "Sonuç bulunamadı"}</div>
                  )}
                  {!orderSearchLoading && orderResults.length > 0 && (
                    <div>
                      {orderResults.map((r, idx) => (
                        <button
                          key={r.id}
                          className={`flex w-full items-center justify-between p-3 text-left hover:bg-blue-50 transition-colors border-b border-slate-50 last:border-0 ${idx === orderActiveIndex ? "bg-blue-50" : ""}`}
                          onClick={() => { setOrderSelected({ id: r.id, barcode: r.barcode }); setOrderSearchOpen(false); }}
                          type="button"
                        >
                          <div>
                            <div className="font-medium text-slate-800">{r.barcode}</div>
                            <div className="text-xs text-slate-500">{new Date(r.date).toLocaleDateString("tr-TR")} • {r.status}</div>
                          </div>
                          <div className="text-sm font-semibold text-slate-700">{new Intl.NumberFormat("tr-TR").format(r.total)} ₺</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {orderSelected && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100 text-sm text-blue-800 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  <span>Seçili sipariş: <strong>{orderSelected.barcode}</strong></span>
                </div>
              )}
            </div>
          </Card>

          {/* Sözleşme Detayları */}
          <Card variant="glass" className="p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-sky-100 text-blue-600 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              Sözleşme Detayları
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <Input label="Başlık" placeholder="Örn. Hizmet Alım Sözleşmesi" value={title} onChange={(e) => setTitle(e.target.value)} error={errors.title} />
              </div>

              <Select label="Sözleşme Türü" value={contractType} onChange={(e) => setContractType(e.target.value)} error={errors.contractType}>
                <option value="">Seçiniz</option>
                <option>Satın Alma</option>
                <option>Hizmet</option>
                <option>Gizlilik (NDA)</option>
                <option>Çerçeve</option>
              </Select>

              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Select label="Şablon" value={template} onChange={(e) => setTemplate(e.target.value)}>
                    <option value="">Şablon seçin</option>
                    <option value="standart">Standart Şablon</option>
                    <option value="kurumsal">Kurumsal Şablon</option>
                  </Select>
                </div>
                <Button variant="secondary" onClick={applyTemplate} disabled={!template}>Uygula</Button>
              </div>

              <Input label="Başlangıç Tarihi" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} error={errors.startDate} />
              <Input label="Bitiş Tarihi" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </Card>

          {/* Taraflar */}
          <Card variant="glass" className="p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-sky-100 text-blue-600 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              </div>
              Taraflar
            </h3>
            <div className="space-y-4">
              <div className="relative">
                <Input
                  label="Taraf Ekle"
                  placeholder="Tedarikçi veya firma adı yazın..."
                  value={partyInput}
                  onChange={(e) => setPartyInput(e.target.value)}
                />
                {partyOpen && (
                  <div className="absolute z-10 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-xl max-h-48 overflow-auto">
                    {partySuggestions.length === 0 ? (
                      <div className="p-3 text-sm text-slate-500">Sonuç yok</div>
                    ) : (
                      partySuggestions.map((p) => (
                        <button
                          key={`${p.type}-${p.id}`}
                          className="flex w-full items-center justify-between p-3 text-left hover:bg-blue-50 transition-colors border-b border-slate-50 last:border-0"
                          type="button"
                          onClick={() => {
                            const name = p.label.trim();
                            setParties((prev) => {
                              const base = (prev || "");
                              const tokens = base.split(";").map((s) => s.trim().toLowerCase()).filter(Boolean);
                              if (tokens.includes(name.toLowerCase())) return base;
                              return base ? `${base}; ${name}` : name;
                            });
                            setPartyInput("");
                            setPartyOpen(false);
                            if (p.type === "supplier") setSelectedSupplierId(p.id);
                            if (p.type === "company") setSelectedCompanyId(p.id);
                          }}
                        >
                          <span className="font-medium text-slate-800">{p.label}</span>
                          <span className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-600">{p.type === "supplier" ? "Tedarikçi" : "Şirket"}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {parties.trim() && (
                <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  {parties.split(";").map((s) => s.trim()).filter(Boolean).map((s, idx) => (
                    <div key={`${s}-${idx}`} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                      <span className="text-sm font-medium text-slate-700">{s}</span>
                      <button
                        type="button"
                        className="text-slate-400 hover:text-red-500 transition-colors"
                        onClick={() => setConfirmDeleteLabel(s)}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {errors.parties && <div className="text-sm text-red-600">{errors.parties}</div>}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <Input label="Yenileme Prosedürü" placeholder="Örn. Otomatik 1 yıl uzatma" value={renewal} onChange={(e) => setRenewal(e.target.value)} />
                <Input label="Fesih Prosedürü" placeholder="Örn. 30 gün önceden bildirim" value={termination} onChange={(e) => setTermination(e.target.value)} />
              </div>

              <Input
                label="Hükümler ve Özel Koşullar"
                multiline
                rows={6}
                placeholder="Özel hükümleri buraya girin..."
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
              />
            </div>
          </Card>
        </div>

        {/* Sağ Kolon: Dosyalar ve İşlemler */}
        <div className="lg:col-span-1 space-y-6">
          <Card variant="glass" className="p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-sky-100 text-blue-600 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
              </div>
              Dosya Ekleri
            </h3>
            <FileUpload onFilesChange={setUploadFiles} />
          </Card>

          <Card variant="glass" className="p-6 bg-slate-50/50">
            <h3 className="text-sm font-semibold text-slate-800 mb-3">Şablon Önizleme</h3>
            <div className="text-xs text-slate-500 bg-white p-3 rounded border border-slate-200 max-h-60 overflow-y-auto whitespace-pre-wrap font-mono leading-relaxed">
              {templateText || "Şablon seçildiğinde önizleme burada görünecektir."}
            </div>
          </Card>

          <div className="flex flex-col gap-3 sticky top-6">
            <Button
              onClick={submit}
              disabled={submitting || uploading}
              variant="gradient"
              size="lg"
              className="w-full shadow-lg shadow-blue-500/20"
              loading={submitting || uploading}
            >
              {uploading ? "Dosyalar yükleniyor..." : submitting ? "Kaydediliyor..." : "Sözleşmeyi Oluştur"}
            </Button>
            <Button variant="outline" disabled={submitting || uploading} className="w-full" onClick={() => router.back()}>
              İptal
            </Button>
          </div>
        </div>
      </div>

      {/* Silme Onayı Modalı */}
      {confirmDeleteLabel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 scale-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </div>
              <h3 className="text-lg font-semibold">Tarafı Sil</h3>
            </div>
            <p className="text-slate-600">
              <span className="font-semibold text-slate-900">{confirmDeleteLabel}</span> kaydını listeden çıkarmak istediğinize emin misiniz?
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setConfirmDeleteLabel(null)} ref={cancelBtnRef}>İptal</Button>
              <Button variant="danger" onClick={() => { if (confirmDeleteLabel) removeParty(confirmDeleteLabel); setConfirmDeleteLabel(null); }} ref={confirmBtnRef}>Evet, Sil</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SozlesmeOlusturPage() {
  return (
    <Suspense fallback={null}>
      <SozlesmeOlusturForm />
    </Suspense>
  );
}
