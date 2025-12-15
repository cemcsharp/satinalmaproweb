"use client";
import { useEffect, useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Card from "@/components/ui/Card";

type SupplierOpt = { id: string; label: string };
type OrderResult = { id: string; barcode: string; date: string; status: string; method: string; total: number };

export default function CAPACreatePage() {
  const router = useRouter();
  const { show } = useToast();
  // Temel alanlar
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [corrective, setCorrective] = useState("");
  const [preventive, setPreventive] = useState("");
  const [status, setStatus] = useState<"open" | "in_progress" | "closed">("open");
  // Sorun tanımı ve doğrulama alanları
  const [problemWho, setProblemWho] = useState("");
  const [problemWhen, setProblemWhen] = useState("");
  const [problemWhere, setProblemWhere] = useState("");
  const [problemHow, setProblemHow] = useState("");
  const [effectivenessMethod, setEffectivenessMethod] = useState("");
  const [verificationResult, setVerificationResult] = useState("");
  const [sustainabilityNotes, setSustainabilityNotes] = useState("");
  const [approvalStatus, setApprovalStatus] = useState<string>("draft");
  // İlişkilendirme alanları
  const [supplierId, setSupplierId] = useState("");
  const [supplierQuery, setSupplierQuery] = useState("");
  const [suppliers, setSuppliers] = useState<SupplierOpt[]>([]);
  const supplierSuggestions = useMemo(() => suppliers.slice(0, 6), [suppliers]);
  const [supplierOpen, setSupplierOpen] = useState(false);

  const [orderId, setOrderId] = useState("");
  const [orderBarcode, setOrderBarcode] = useState("");
  const [orderResults, setOrderResults] = useState<OrderResult[]>([]);
  const [orderSearchOpen, setOrderSearchOpen] = useState(false);
  const [orderSearchLoading, setOrderSearchLoading] = useState(false);
  const [orderSearchError, setOrderSearchError] = useState("");

  const [evaluationId, setEvaluationId] = useState("");

  // Tedarikçi arama (server tarafında arama)
  useEffect(() => {
    const q = supplierQuery.trim();
    if (q.length < 2) { setSuppliers([]); return; }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/tedarikci?q=${encodeURIComponent(q)}&pageSize=6`);
        const data = await res.json();
        const items = Array.isArray(data.items) ? data.items : [];
        setSuppliers(items.map((it: { id: string; name: string }) => ({ id: it.id, label: it.name })));
      } catch { setSuppliers([]); }
    }, 300);
    return () => clearTimeout(t);
  }, [supplierQuery]);

  // Sipariş arama (barcode ile)
  useEffect(() => {
    const q = orderBarcode.trim();
    if (q.length < 3) {
      setOrderResults([]);
      setOrderSearchOpen(false);
      setOrderSearchError("");
      return;
    }
    setOrderSearchLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/siparis?q=${encodeURIComponent(q)}&pageSize=5`);
        if (!res.ok) throw new Error("search_failed");
        const data = await res.json();
        const items = (data?.items || []) as OrderResult[];
        setOrderResults(items);
        setOrderSearchOpen(true);
        setOrderSearchError(items.length === 0 ? "Sonuç bulunamadı" : "");
      } catch (err) {
        setOrderResults([]);
        setOrderSearchOpen(true);
        setOrderSearchError("Arama sırasında hata oluştu");
      } finally {
        setOrderSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [orderBarcode]);

  const doSubmit = async () => {
    try {
      if (!supplierId) {
        show({ title: "Tedarikçi gerekli", description: "Lütfen tedarikçi seçin.", variant: "warning" });
        return;
      }
      const payload = {
        title,
        description,
        corrective: corrective || undefined,
        preventive: preventive || undefined,
        supplierId,
        orderId: orderId || undefined,
        evaluationId: evaluationId || undefined,
        status,
        // Extended fields
        problemWho: problemWho || undefined,
        problemWhen: problemWhen || undefined,
        problemWhere: problemWhere || undefined,
        problemHow: problemHow || undefined,
        effectivenessMethod: effectivenessMethod || undefined,
        verificationResult: verificationResult || undefined,
        sustainabilityNotes: sustainabilityNotes || undefined,
        approvalStatus: approvalStatus || undefined,
      };
      const res = await fetch("/api/tedarikci/dof", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "capa_create_failed");
      }
      const data = await res.json();
      show({ title: "Kaydedildi", description: `DÖF oluşturuldu: ${data.title}`, variant: "success" });
      router.push(`/tedarikci/dof/${data.id}`);
      } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "DÖF kaydedilemedi";
      show({ title: "Hata", description: message, variant: "error" });
      }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await doSubmit();
  };

  return (
    <section className="space-y-4">
      <PageHeader title="DÖF Oluştur" description="Düzeltici/Önleyici faaliyet kaydı başlatın" />

      <Card compact>
        <form onSubmit={submit} className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <Input label="Başlık" value={title} onChange={(e) => setTitle((e.target as HTMLInputElement).value)} required placeholder="Örn: Gecikme sonrası düzeltici faaliyet" size="sm" />
          </div>
          <div className="md:col-span-2">
            <Input label="Açıklama" multiline rows={3} value={description} onChange={(e) => setDescription((e.target as HTMLTextAreaElement).value)} required placeholder="Problemi, etkisini ve kapsamı açıklayın" size="sm" />
          </div>
        <Card compact className="md:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <div className="text-sm font-medium">Sorun Tanımı</div>
              <div className="text-[12px] text-muted-foreground">Kim, ne zaman, nerede, nasıl oldu? Kapsam ve etkileri kısaca belirtin.</div>
            </div>
            <Input label="Kim" value={problemWho} onChange={(e) => setProblemWho((e.target as HTMLInputElement).value)} placeholder="Örn: Üretim ekibi / Tedarikçi A" size="sm" />
            <Input label="Ne Zaman" type="date" value={problemWhen} onChange={(e) => setProblemWhen((e.target as HTMLInputElement).value)} size="sm" />
            <Input label="Nerede" value={problemWhere} onChange={(e) => setProblemWhere((e.target as HTMLInputElement).value)} placeholder="Örn: Sevkiyat hattı / Depo" size="sm" />
            <Input label="Nasıl" value={problemHow} onChange={(e) => setProblemHow((e.target as HTMLInputElement).value)} placeholder="Örn: Etiketler yanlış basıldı, kontrol atlandı" size="sm" />
          </div>
        </Card>
        <Card compact className="md:col-span-2">
          <div className="text-sm font-medium">Kök Neden — 5 Neden</div>
          <div className="text-[12px] text-muted-foreground">Detay için kayıt sonrası DÖF sayfasında 5 Neden alanlarını kullanın.</div>
        </Card>

        <div className="relative">
          <Input
            label="Tedarikçi"
            placeholder="Tedarikçi ara"
            value={supplierQuery}
            onChange={(e) => { setSupplierQuery((e.target as HTMLInputElement).value); setSupplierOpen(true); }}
            onFocus={() => setSupplierOpen(true)}
            onBlur={() => setTimeout(() => setSupplierOpen(false), 150)}
            onKeyDown={(e) => {
              if (!supplierOpen) return;
              if (e.key === "ArrowDown") { e.preventDefault(); }
              else if (e.key === "ArrowUp") { e.preventDefault(); }
              else if (e.key === "Enter") {
                const sel = supplierSuggestions[0];
                if (sel) { setSupplierId(sel.id); setSupplierQuery(sel.label); setSupplierOpen(false); }
              } else if (e.key === "Escape") { setSupplierOpen(false); }
            }}
            required
            aria-label="Tedarikçi"
            size="sm"
          />
          {supplierOpen && (
            <div className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded border bg-white shadow">
              {supplierSuggestions.length === 0 ? (
                <div className="p-2 text-sm text-muted-foreground">Sonuç yok</div>
              ) : (
                supplierSuggestions.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className="block w-full text-left px-3 py-2 hover:bg-muted text-sm"
                    onClick={() => { setSupplierId(s.id); setSupplierQuery(s.label); setSupplierOpen(false); }}
                  >
                    {s.label}
                  </button>
                ))
              )}
            </div>
          )}
          {!!supplierId && (
            <p className="mt-1 text-xs text-muted-foreground">Seçili: {supplierQuery || supplierId}</p>
          )}
        </div>

        <div className="relative">
          <Input
            label="Sipariş (Barkod ile ara)"
            placeholder="Örn: SO-2025-0001"
            value={orderBarcode}
            onChange={(e) => setOrderBarcode((e.target as HTMLInputElement).value)}
            onFocus={() => setOrderSearchOpen(true)}
            onBlur={() => setTimeout(() => setOrderSearchOpen(false), 150)}
            size="sm"
          />
          {orderSearchOpen && (
            <div className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded border bg-white shadow">
              {orderSearchLoading ? (
                <div className="p-2 text-sm text-muted-foreground">Aranıyor…</div>
              ) : orderSearchError ? (
                <div className="p-2 text-sm text-red-600">{orderSearchError}</div>
              ) : orderResults.length === 0 ? (
                <div className="p-2 text-sm text-muted-foreground">Sonuç yok</div>
              ) : (
                orderResults.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    className="flex w-full items-center justify-between px-3 py-2 hover:bg-muted text-sm"
                    onClick={() => {
                      setOrderId(r.id);
                      setOrderBarcode(r.barcode);
                      setOrderSearchOpen(false);
                      show({ title: "Sipariş seçildi", description: `${r.barcode} seçildi.`, variant: "success" });
                    }}
                  >
                    <div className="flex-1">
                      <div className="font-medium">{r.barcode}</div>
                      <div className="text-xs text-gray-600">Tutar: {Number(r.total).toLocaleString("tr-TR")} {r.method ? `• ${r.method}` : ""} {r.status ? `• ${r.status}` : ""}</div>
                    </div>
                    <div className="text-xs text-gray-500">{new Date(r.date).toLocaleDateString()}</div>
                  </button>
                ))
              )}
            </div>
          )}
          {!!orderId && <p className="mt-1 text-xs text-muted-foreground">Seçili Sipariş: {orderBarcode || orderId}</p>}
        </div>

        <div>
            <Input label="Değerlendirme ID (opsiyonel)" value={evaluationId} onChange={(e) => setEvaluationId((e.target as HTMLInputElement).value)} placeholder="Opsiyonel" size="sm" />
        </div>

        <div>
          <Input label="Düzeltici Faaliyet" multiline rows={3} value={corrective} onChange={(e) => setCorrective((e.target as HTMLTextAreaElement).value)} placeholder="Örn: Süreç revizyonu, ek kontrol" size="sm" />
        </div>
        <div>
          <Input label="Önleyici Faaliyet" multiline rows={3} value={preventive} onChange={(e) => setPreventive((e.target as HTMLTextAreaElement).value)} placeholder="Örn: Eğitim, otomasyon" size="sm" />
        </div>

        <Card compact className="md:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <div className="text-sm font-medium">Takip ve Doğrulama</div>
              <div className="text-[12px] text-muted-foreground">Etkinlik metodunu ve doğrulama sonucunu kısaca belirtin.</div>
            </div>
            <Input label="Etkinlik Metodolojisi" value={effectivenessMethod} onChange={(e) => setEffectivenessMethod((e.target as HTMLInputElement).value)} placeholder="Örn: 3 hafta örneklem kontrolü" size="sm" />
            <Input label="Doğrulama Sonucu" value={verificationResult} onChange={(e) => setVerificationResult((e.target as HTMLInputElement).value)} placeholder="Örn: Hata oranı %0, teyit edildi" size="sm" />
            <Input label="Kalıcılık Notları" multiline rows={3} value={sustainabilityNotes} onChange={(e) => setSustainabilityNotes((e.target as HTMLTextAreaElement).value)} placeholder="Örn: Prosedür güncellendi, eğitim verildi" size="sm" />
          </div>
        </Card>

        <div className="grid gap-2">
          <Select label="Onay Durumu" value={approvalStatus} onChange={(e) => setApprovalStatus((e.target as HTMLSelectElement).value)} size="sm">
            <option value="draft">Taslak</option>
            <option value="pending">Onay bekliyor</option>
            <option value="approved">Onaylandı</option>
            <option value="rejected">Reddedildi</option>
          </Select>
          <div className="text-[12px] text-muted-foreground">İleride akış/dijital imza ile detay sayfasına taşınabilir.</div>
        </div>

        <div>
          <Select label="Durum" value={status} onChange={(e) => setStatus((e.target as HTMLSelectElement).value as "open" | "in_progress" | "closed")} size="sm">
            <option value="open">Açık</option>
            <option value="in_progress">Devam ediyor</option>
            <option value="closed">Kapalı</option>
          </Select>
        </div>

        <div className="md:col-span-2 flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setTitle(""); setDescription(""); setCorrective(""); setPreventive(""); setSupplierId(""); setSupplierQuery(""); setOrderId(""); setOrderBarcode(""); setEvaluationId(""); setStatus("open");
              setProblemWho(""); setProblemWhen(""); setProblemWhere(""); setProblemHow(""); setEffectivenessMethod(""); setVerificationResult(""); setSustainabilityNotes(""); setApprovalStatus("draft");
            }}
          >
            Temizle
          </Button>
          <Button onClick={doSubmit}>Kaydet</Button>
        </div>
        </form>
      </Card>
    </section>
  );
}
