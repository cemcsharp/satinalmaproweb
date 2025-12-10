"use client";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Badge from "@/components/ui/Badge";

type EvalOption = { id: string; label: string };
type EvalQuestion = { id: string; text: string; type: "dropdown" | "text" | "rating"; options?: EvalOption[]; active: boolean; section?: "A" | "B" | "C" };
type ScoringType = { id: string; name: string; code: string; active: boolean };

function EvaluationFormContent() {
  const { show } = useToast();
  const router = useRouter();

  // Sipariş ilişkilendirme (barkod arama/scan)
  const [orderBarcode, setOrderBarcode] = useState("");
  const [orderResults, setOrderResults] = useState<Array<{ id: string; barcode: string; date: string; status: string; method: string; total: number }>>([]);
  const [orderSearchOpen, setOrderSearchOpen] = useState(false);
  const [orderSearchLoading, setOrderSearchLoading] = useState(false);
  const [orderSearchError, setOrderSearchError] = useState<string>("");
  const [orderActiveIndex, setOrderActiveIndex] = useState<number>(-1);
  const orderCache = useRef<Map<string, Array<{ id: string; barcode: string; date: string; status: string; method: string; total: number }>>>(new Map());
  const [orderId, setOrderId] = useState("");
  const [orderSummary, setOrderSummary] = useState<null | { barcode: string; date?: string | null; status?: string | null; method?: string | null; total?: number | null; currency?: string | null }>(null);
  const [supplierId, setSupplierId] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [evaluationDate, setEvaluationDate] = useState("");
  const [consultingArea, setConsultingArea] = useState("");
  const [evaluatingUnit, setEvaluatingUnit] = useState("");
  const [scoringType, setScoringType] = useState<string>("malzeme");
  const [scoringTypes, setScoringTypes] = useState<ScoringType[]>([]);
  const [questions, setQuestions] = useState<EvalQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [questionsSource, setQuestionsSource] = useState<"db" | "static">("db");
  const [activeStep, setActiveStep] = useState<number>(0);

  const sections = useMemo(() => {
    const s = Array.from(new Set(questions.map((q) => q.section).filter(Boolean))) as ("A" | "B" | "C")[];
    return s;
  }, [questions]);

  const steps = useMemo(() => ["genel", ...sections, "ozet"], [sections]);

  // Puanlama tiplerini yükle
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/ayarlar/puanlama-tipleri");
        const data = await res.json();
        setScoringTypes((data.items || []).filter((t: ScoringType) => t.active));
        if (data.items && data.items.length > 0 && !scoringType) {
          setScoringType(data.items[0].code);
        }
      } catch (e) {
        console.error("Puanlama tipleri yüklenemedi:", e);
      }
    })();
  }, []);

  // Talep Eden Birim listesini yükle
  const [evaluatingUnits, setEvaluatingUnits] = useState<Array<{ id: string; label: string }>>([]);
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/options?mode=public");
        const data = await res.json();
        const units = data.birim || [];
        setEvaluatingUnits(units.map((u: any) => ({ id: u.id, label: u.label })));
      } catch (e) {
        console.error("Talep eden birim listesi yüklenemedi:", e);
      }
    })();
  }, []);

  const evaluatingUnitOptions = useMemo(() => evaluatingUnits, [evaluatingUnits]);

  // Prefill from query params
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const qOrderId = url.searchParams.get("orderId") || "";
      const qSupplierId = url.searchParams.get("supplierId") || "";
      const qScoringType = (url.searchParams.get("scoringType") || "").trim().toLowerCase();
      if (qOrderId) setOrderId(qOrderId);
      if (qSupplierId) setSupplierId(qSupplierId);
      if (qScoringType) setScoringType(qScoringType);
    } catch { }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/tedarikci/sorular?type=${encodeURIComponent(scoringType)}`);
        const data = await res.json();
        setQuestions((data.items ?? []) as EvalQuestion[]);
        setQuestionsSource((data.source === "static") ? "static" : "db");
        setAnswers({});
        setComments({});
        setActiveStep(0);
      } catch (e) {
        show({ title: "Hata", description: "Sorular yüklenemedi", variant: "error" });
      }
    })();
  }, [scoringType, show]);

  // Debounced barkod arama
  useEffect(() => {
    const q = orderBarcode.trim();
    if (q.length < 3) {
      setOrderResults([]);
      setOrderSearchError("");
      setOrderSearchLoading(false);
      setOrderSearchOpen(false);
      setOrderActiveIndex(-1);
      return;
    }
    setOrderSearchLoading(true);
    setOrderSearchError("");
    const t = setTimeout(async () => {
      try {
        if (orderCache.current.has(q)) {
          const items = orderCache.current.get(q) || [];
          setOrderResults(items);
          setOrderSearchOpen(true);
          setOrderActiveIndex(items.length > 0 ? 0 : -1);
          setOrderSearchError(items.length === 0 ? "Sonuç bulunamadı" : "");
        } else {
          const res = await fetch(`/api/siparis?q=${encodeURIComponent(q)}&pageSize=5`);
          if (!res.ok) throw new Error("search_failed");
          const data = await res.json();
          const items: Array<{ id: string; barcode: string; date: string; status: string; method: string; total: number }> = (data?.items || []);
          setOrderResults(items);
          setOrderSearchOpen(true);
          setOrderActiveIndex(items.length > 0 ? 0 : -1);
          setOrderSearchError(items.length === 0 ? "Sonuç bulunamadı" : "");
          orderCache.current.set(q, items);
        }
        const exact = orderResults.find((it) => it.barcode.toLowerCase() === q.toLowerCase());
        if (exact) {
          setOrderId(exact.id);
        }
      } catch (err) {
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

  // Seçili sipariş değiştiğinde supplier bilgilerini otomatik doldur
  useEffect(() => {
    (async () => {
      try {
        if (!orderId) return;
        const res = await fetch(`/api/siparis/${encodeURIComponent(orderId)}`);
        if (!res.ok) return;
        const data = await res.json();
        const sId = String(data?.supplierId || "");
        const sName = String(data?.supplierName || "");
        if (sId) setSupplierId(sId);
        if (sName) setSupplierName(sName);
        setOrderSummary({
          barcode: String(data?.barcode || ""),
          date: String(data?.date || ""),
          status: String(data?.status || ""),
          method: String(data?.method || ""),
          total: data?.total == null ? null : Number(data.total),
          currency: String(data?.currency || ""),
        });
      } catch (e) {
        console.warn("supplier_autofill_failed", e);
      }
    })();
  }, [orderId]);

  const doSubmit = async () => {
    try {
      const payload = {
        orderId,
        supplierId,
        supplierName,
        evaluationDate,
        consultingArea,
        evaluatingUnit,
        scoringType,
        answers: questions.map((q) => ({ questionId: q.id, section: q.section, value: answers[q.id] ?? "", comment: comments[q.id] ?? "" })),
      };
      const res = await fetch("/api/tedarikci/degerlendirme", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        let msg = data?.message || data?.error || `evaluation_failed_${res.status}`;
        if (msg === "unknown_question_ids" && Array.isArray(data?.unknownIds) && data.unknownIds.length) {
          msg = `unknown_question_ids: ${data.unknownIds.join(", ")}`;
        }
        throw new Error(msg);
      }
      const data = await res.json();
      show({ title: "Kaydedildi", description: `(${data.scoringType}) Değerlendirme ID: ${data.id} Skor: ${data.score}`, variant: "success" });
      router.push("/tedarikci/degerlendirmeler");
      setOrderId(""); setSupplierId(""); setSupplierName(""); setEvaluationDate(""); setConsultingArea(""); setEvaluatingUnit(""); setAnswers({}); setComments({}); setScoringType("malzeme");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Değerlendirme kaydedilemedi";
      show({ title: "Hata", description: message, variant: "error" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await doSubmit();
  };

  const ratingChoices = useMemo(() => [
    { id: "5", label: "5 - Mükemmel" },
    { id: "4", label: "4 - İyi" },
    { id: "3", label: "3 - Orta" },
    { id: "2", label: "2 - Zayıf" },
    { id: "1", label: "1 - Çok Zayıf" },
  ], []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Tedarikçi Değerlendirmesi"
        description="ISO 9001 standartlarına uygun tedarikçi performans değerlendirmesi."
        variant="gradient"
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {questionsSource === "static" && (
          <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800 flex items-start gap-3 shadow-sm">
            <svg className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <div>
              <p className="font-semibold">Uyarı</p>
              <p>Sorular veritabanında tanımlı değil. Ayarlar → Değerlendirme Yönetimi bölümünden soruları ekleyin. Statik sorularla kayıt yapılamaz.</p>
            </div>
          </div>
        )}

        {/* Stepper */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {steps.map((s, i) => (
            <button
              key={`${s}-${i}`}
              type="button"
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all whitespace-nowrap ${i === activeStep
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              onClick={() => setActiveStep(i)}
            >
              <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs ${i === activeStep ? "bg-white/20" : "bg-slate-100"}`}>{i + 1}</span>
              <span>
                {s === "genel" && "Genel Bilgiler"}
                {s === "A" && "Bölüm A"}
                {s === "B" && "Bölüm B"}
                {s === "C" && "Bölüm C"}
                {s === "ozet" && "Özet"}
              </span>
            </button>
          ))}
        </div>

        <Card variant="glass" className="min-h-[400px]">
          {steps[activeStep] === "genel" && (
            <div className="space-y-6">
              {!orderId ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800">Sipariş İlişkilendirme</h3>
                  </div>

                  <div className="relative">
                    <Input
                      label="İlişkilendirilecek Sipariş"
                      placeholder="Sipariş barkodu (örn. ORD-2025-001)"
                      value={orderBarcode}
                      onChange={(e) => { setOrderBarcode(e.target.value); setOrderId(""); setOrderSummary(null); }}
                      onKeyDown={(e) => { if (e.key === "Enter") { setOrderSearchOpen(true); } }}
                    />
                    {orderBarcode && (
                      <button
                        type="button"
                        onClick={() => { setOrderBarcode(""); setOrderResults([]); setOrderSearchOpen(false); setOrderActiveIndex(-1); }}
                        className="absolute right-3 top-[34px] text-slate-400 hover:text-slate-600"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    )}
                  </div>

                  {orderSearchOpen && (
                    <div className="mt-2 rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden z-10 relative">
                      {orderSearchLoading && <div className="p-4 text-sm text-slate-500 flex items-center gap-2"><div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div> Aranıyor…</div>}
                      {!orderSearchLoading && orderResults.length === 0 && (
                        <div className="p-4 text-sm text-slate-500">{orderSearchError || "Sonuç bulunamadı"}</div>
                      )}
                      {!orderSearchLoading && orderResults.length > 0 && (
                        <div className="max-h-60 overflow-auto">
                          {orderResults.map((r, idx) => (
                            <button
                              key={r.id}
                              type="button"
                              className={`flex w-full items-center gap-4 border-b border-slate-50 p-3 text-left hover:bg-blue-50/50 transition-colors ${idx === orderActiveIndex ? "bg-blue-50" : ""}`}
                              onMouseEnter={() => setOrderActiveIndex(idx)}
                              onClick={() => { setOrderId(r.id); setOrderBarcode(r.barcode); setOrderSearchOpen(false); show({ title: "Sipariş seçildi", description: `${r.barcode} seçildi.`, variant: "success" }); }}
                            >
                              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                              </div>
                              <div className="flex-1">
                                <div className="font-medium text-slate-800">{r.barcode}</div>
                                <div className="text-xs text-slate-500 flex gap-2 mt-0.5">
                                  <span>{new Date(r.date).toLocaleDateString()}</span>
                                  <span>•</span>
                                  <span>{Number(r.total).toLocaleString("tr-TR")} ₺</span>
                                  {r.status && <><span>•</span><Badge variant="default" size="sm">{r.status}</Badge></>}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      </div>
                      <div className="text-base font-semibold text-blue-900">Seçili Sipariş</div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => { setOrderId(""); setOrderBarcode(""); setOrderSummary(null); }}>Değiştir</Button>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="bg-white p-3 rounded-lg border border-blue-100 shadow-sm">
                      <div className="text-xs text-slate-500 mb-1">Barkod</div>
                      <div className="font-medium text-blue-700">{orderSummary?.barcode || orderBarcode}</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-blue-100 shadow-sm">
                      <div className="text-xs text-slate-500 mb-1">Tarih</div>
                      <div className="font-medium text-slate-700">{orderSummary?.date ? new Date(orderSummary.date).toLocaleDateString() : "—"}</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-blue-100 shadow-sm">
                      <div className="text-xs text-slate-500 mb-1">Tedarikçi</div>
                      <div className="font-medium text-slate-700">{supplierName || "—"}</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-blue-100 shadow-sm">
                      <div className="text-xs text-slate-500 mb-1">Durum</div>
                      <div className="font-medium text-slate-700">{orderSummary?.status || "—"}</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-blue-100 shadow-sm">
                      <div className="text-xs text-slate-500 mb-1">Toplam</div>
                      <div className="font-medium text-slate-700">{orderSummary?.total != null ? Number(orderSummary.total).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"} {orderSummary?.currency || ""}</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 pt-4 border-t border-slate-100">
                {!orderId && (
                  <>
                    <Input label="Sipariş ID" value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="Otomatik dolar" />
                    <Input label="Tedarikçi ID" value={supplierId} onChange={(e) => setSupplierId(e.target.value)} placeholder="Otomatik dolar" />
                    <Input label="Tedarikçi Firma Adı" value={supplierName} onChange={(e) => setSupplierName(e.target.value)} placeholder="Otomatik dolar" />
                  </>
                )}

                <Select label="Puanlama Tipi" value={scoringType} onChange={(e) => setScoringType(e.target.value)} required>
                  {scoringTypes.length === 0 && <option value="">Yükleniyor...</option>}
                  {scoringTypes.map((type) => (
                    <option key={type.id} value={type.code}>{type.name}</option>
                  ))}
                </Select>

                <Input label="Değerlendirme Tarihi" type="date" value={evaluationDate} onChange={(e) => setEvaluationDate(e.target.value)} />

                <Input
                  label={scoringType === "danismanlik" ? "Danışmanlık Alanı" : scoringType === "bakim" ? "Hizmet Alanı" : scoringType === "insaat" ? "Proje Türü" : "Alan"}
                  value={consultingArea}
                  onChange={(e) => setConsultingArea(e.target.value)}
                  placeholder={
                    scoringType === "danismanlik" ? "Stratejik, Hukuki, Bilişim vb." :
                      scoringType === "bakim" ? "HVAC, Elektrik vb." :
                        scoringType === "insaat" ? "Yeni Yapım, Tadilat vb." : "Alan"
                  }
                  description="Değerlendirilen işin kapsamı."
                />

                <Select label="Değerlendiren Birim" value={evaluatingUnit} onChange={(e) => setEvaluatingUnit(e.target.value)}>
                  <option value="">Seçiniz</option>
                  {evaluatingUnitOptions.map((o) => (
                    <option key={o.id} value={o.label}>{o.label}</option>
                  ))}
                </Select>
              </div>
            </div>
          )}

          {steps[activeStep] !== "genel" && steps[activeStep] !== "ozet" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="font-semibold text-slate-800">
                  {steps[activeStep] === "A" && (scoringType === "malzeme" ? "A. Ürün Kalitesi ve Teknik Uygunluk" : scoringType === "hizmet" ? "A. Hizmet Kalitesi ve Uygunluk" : scoringType === "danismanlik" ? "A. Uzmanlık ve Yetkinlik" : scoringType === "bakim" ? "A. Teknik Yeterlilik ve Kalite" : "A. Teknik Kapasite ve Kalite")}
                  {steps[activeStep] === "B" && (scoringType === "malzeme" ? "B. Fiyat ve Finansal Koşullar" : scoringType === "hizmet" ? "B. Operasyonel Performans ve Zaman Yönetimi" : scoringType === "danismanlik" ? "B. Yönetim ve İşbirliği" : scoringType === "bakim" ? "B. Operasyonel Performans ve Acil Durum Yönetimi" : "B. Proje ve Risk Yönetimi")}
                  {steps[activeStep] === "C" && (scoringType === "malzeme" ? "C. Lojistik ve Teslimat Performansı" : scoringType === "hizmet" ? "C. Fiyat, Finansal Yeterlilik ve Firma Özellikleri" : scoringType === "danismanlik" ? "C. Maliyet ve Finansal Koşullar" : scoringType === "bakim" ? "C. Maliyet ve Kurumsal Yeterlilik" : "C. Finansal Güç ve Hukuki Yeterlilik")}
                </div>
                <Badge variant="info">
                  {(() => {
                    const qs = questions.filter((q) => q.section === steps[activeStep]);
                    const answered = qs.filter((q) => Boolean(answers[q.id])).length;
                    return `${answered}/${qs.length} yanıtlandı`;
                  })()}
                </Badge>
              </div>

              <div className="grid gap-6">
                {questions
                  .filter((q) => q.section === steps[activeStep])
                  .sort((a, b) => a.id.localeCompare(b.id))
                  .map((q) => (
                    <div key={q.id} className="p-5 rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
                      <div className="text-base font-medium text-slate-800 mb-3">{q.text}</div>

                      <div className="space-y-3">
                        {q.type === "rating" && (
                          <div className="flex flex-wrap gap-2">
                            {ratingChoices.map((o) => (
                              <button
                                key={o.id}
                                type="button"
                                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${answers[q.id] === o.id
                                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20 scale-105"
                                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                                  }`}
                                onClick={() => setAnswers((a) => ({ ...a, [q.id]: o.id }))}
                              >
                                {o.label}
                              </button>
                            ))}
                          </div>
                        )}

                        {q.type === "dropdown" && (
                          <Select value={answers[q.id] ?? ""} onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))} required>
                            <option value="">Seçiniz</option>
                            {(q.options ?? []).map((o) => (
                              <option key={o.id} value={o.id}>{o.label}</option>
                            ))}
                          </Select>
                        )}

                        {q.type === "text" && (
                          <Input multiline rows={2} value={answers[q.id] ?? ""} onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))} placeholder="Yanıtınız..." required />
                        )}

                        <Input
                          multiline
                          rows={1}
                          value={comments[q.id] ?? ""}
                          onChange={(e) => setComments((c) => ({ ...c, [q.id]: e.target.value }))}
                          placeholder="Açıklama / Gerekçe (opsiyonel)"
                          className="text-sm"
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {steps[activeStep] === "ozet" && (
            <div className="space-y-6">
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                <h3 className="font-semibold text-slate-800 mb-4">Genel Bilgiler</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500">Sipariş</span>
                    <span className="font-medium text-slate-800">{orderSummary?.barcode || orderBarcode || "—"}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500">Tedarikçi</span>
                    <span className="font-medium text-slate-800">{supplierName || supplierId || "—"}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500">Puanlama Tipi</span>
                    <span className="font-medium text-slate-800">{scoringType}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500">Tarih</span>
                    <span className="font-medium text-slate-800">{evaluationDate || "—"}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="font-semibold text-slate-800 mb-4">Puanlama Özeti</h3>
                <div className="space-y-4">
                  {sections.map((s) => {
                    const qs = questions.filter((q) => q.section === s);
                    const answered = qs.filter((q) => Boolean(answers[q.id])).length;
                    const toNumeric = (val: string | undefined) => {
                      const sVal = String(val ?? "").trim();
                      const n = Number(sVal);
                      if (Number.isFinite(n) && n >= 0) return n;
                      if (sVal === "o1") return 5;
                      if (sVal === "o2") return 4;
                      if (sVal === "o3") return 3;
                      if (sVal === "o4") return 2;
                      return 0;
                    };
                    const values = qs.map((q) => toNumeric(answers[q.id]));
                    const avg = values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : 0;
                    const score = Math.round((avg / 5) * 100);

                    return (
                      <div key={`sum-${s}`} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div>
                          <div className="font-medium text-slate-800">{s === "A" ? "Bölüm A" : s === "B" ? "Bölüm B" : "Bölüm C"}</div>
                          <div className="text-xs text-slate-500">{answered}/{qs.length} soru yanıtlandı</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-sm font-bold text-blue-600">{values.length ? `${score}/100` : "—"}</div>
                            <div className="text-xs text-slate-400">Puan</div>
                          </div>
                          <div className="w-12 h-12 rounded-full border-4 border-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">
                            {score}%
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </Card>

        <div className="flex justify-between gap-4 pt-4">
          <Button variant="outline" onClick={() => { setOrderId(""); setSupplierId(""); setSupplierName(""); setEvaluationDate(""); setConsultingArea(""); setEvaluatingUnit(""); setAnswers({}); setComments({}); setActiveStep(0); }}>
            Temizle
          </Button>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setActiveStep((s) => Math.max(0, s - 1))} disabled={activeStep === 0}>
              Geri
            </Button>

            {steps[activeStep] === "ozet" ? (
              <Button
                onClick={doSubmit}
                variant="gradient"
                disabled={questionsSource === "static"}
                title={questionsSource === "static" ? "Veritabanı soruları eklenmeden kayıt yapılamaz" : undefined}
                className="shadow-lg shadow-blue-500/20"
              >
                Değerlendirmeyi Kaydet
              </Button>
            ) : (
              <Button onClick={() => setActiveStep((s) => Math.min(steps.length - 1, s + 1))}>
                İleri
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

export default function EvaluationFormPage() {
  return (
    <Suspense fallback={<div className="p-8 flex justify-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>}>
      <EvaluationFormContent />
    </Suspense>
  );
}