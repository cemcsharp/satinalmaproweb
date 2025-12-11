"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import IconButton from "@/components/ui/IconButton";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { fetchJsonWithRetry } from "@/lib/http";

// Types
type OptionItem = { id: string; label: string; active: boolean; email?: string | null; sort?: number };
type ScoringType = { id: string; name: string; code: string; kind: string; scaleMin: number; scaleMax: number; step: number; active: boolean; description?: string | null; weightA: number; weightB: number; weightC: number };
type EvaluationQuestion = { id: string; text: string; type: string; active: boolean; required: boolean; sort: number; scoringTypeId?: string | null; section?: string | null; scoringType?: ScoringType | null };
type SmtpSetting = { id: string; key: string; name: string; host: string; port: number; user: string; pass: string; secure: boolean; active: boolean; isDefault: boolean; from: string };

const dropdownCategories = [
  { key: "ilgiliKisi", name: "İlgili Kişi" },
  { key: "birim", name: "Talep Eden Birim" },
  { key: "durum", name: "Talep Durumu" },
  { key: "paraBirimi", name: "Para Birimi" },
  { key: "birimTipi", name: "Birim Tipi (Adet/Kg)" },
  { key: "siparisDurumu", name: "Sipariş Durumu" },
  { key: "alimYontemi", name: "Alım Yöntemi" },
  { key: "yonetmelikMaddesi", name: "Yönetmelik Maddesi" },
  { key: "tedarikci", name: "Tedarikçi Listesi" },
  { key: "firma", name: "Firma Listesi" },
];

export default function SettingsPage() {
  const { data: session } = useSession();
  const { show } = useToast();
  const [activeTab, setActiveTab] = useState("options");

  // --- Options State ---
  const [activeDropdownCat, setActiveDropdownCat] = useState("ilgiliKisi");
  const [options, setOptions] = useState<Record<string, OptionItem[]>>({});
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [optionModalOpen, setOptionModalOpen] = useState(false);
  const [optionModalMode, setOptionModalMode] = useState<"add" | "edit">("add");
  const [optionModalValue, setOptionModalValue] = useState("");
  const [optionModalEmail, setOptionModalEmail] = useState("");
  const [optionModalId, setOptionModalId] = useState<string | null>(null);

  // Firma fields
  const [companyFields, setCompanyFields] = useState({ taxId: "", address: "", taxOffice: "", phone: "", email: "" });

  // --- Evaluation State ---
  const [questions, setQuestions] = useState<EvaluationQuestion[]>([]);
  const [scoringTypes, setScoringTypes] = useState<ScoringType[]>([]);
  const [evalLoading, setEvalLoading] = useState(false);

  // Question Modal
  const [evalModalOpen, setEvalModalOpen] = useState(false);
  const [evalModalMode, setEvalModalMode] = useState<"add" | "edit">("add");
  const [currentQuestion, setCurrentQuestion] = useState<Partial<EvaluationQuestion>>({});

  // Scoring Type Modal
  const [scoringTypeModalOpen, setScoringTypeModalOpen] = useState(false);
  const [scoringTypeModalMode, setScoringTypeModalMode] = useState<"add" | "edit">("add");
  const [currentScoringType, setCurrentScoringType] = useState<Partial<ScoringType>>({});

  // --- SMTP State ---
  const [smtpSettings, setSmtpSettings] = useState<SmtpSetting[]>([]);
  const [smtpLoading, setSmtpLoading] = useState(false);
  const [smtpModalOpen, setSmtpModalOpen] = useState(false);
  const [smtpModalMode, setSmtpModalMode] = useState<"add" | "edit">("add");
  const [currentSmtp, setCurrentSmtp] = useState<Partial<SmtpSetting>>({});

  // --- Tevkifat State ---
  const [tevkifatItems, setTevkifatItems] = useState<{ code: string; label: string; ratio: string; active?: boolean }[]>([]);
  const [tevkifatLoading, setTevkifatLoading] = useState(false);
  const [tevkifatCode, setTevkifatCode] = useState("");
  const [tevkifatLabel, setTevkifatLabel] = useState("");
  const [tevkifatRatio, setTevkifatRatio] = useState("");

  useEffect(() => {
    const savedTab = localStorage.getItem("settings_active_tab");
    if (savedTab) setActiveTab(savedTab);
  }, []);

  useEffect(() => {
    localStorage.setItem("settings_active_tab", activeTab);
    if (activeTab === "options") loadOptions();
    if (activeTab === "evaluation") loadQuestions();
    if (activeTab === "tevkifat") loadTevkifat();
    if (activeTab === "notifications") loadSmtp();
  }, [activeTab]);

  // --- Options Logic ---
  const loadOptions = async () => {
    setOptionsLoading(true);
    try {
      const data = await fetchJsonWithRetry<any>("/api/options");
      setOptions(data);
    } catch (e) {
      console.error(e);
      show({ title: "Hata", description: "Seçenekler yüklenemedi", variant: "error" });
    } finally {
      setOptionsLoading(false);
    }
  };

  const handleSaveOption = async () => {
    if (!optionModalValue) return;
    try {
      const body: any = {
        action: optionModalMode === "add" ? "add" : "rename",
        key: activeDropdownCat,
        label: optionModalValue,
      };
      if (optionModalMode === "edit" && optionModalId) body.id = optionModalId;
      if (activeDropdownCat === "birim") body.email = optionModalEmail;
      if (activeDropdownCat === "firma") {
        body.name = optionModalValue;
        Object.assign(body, companyFields);
        if (optionModalMode === "edit") body.action = "update";
      }

      const method = optionModalMode === "add" ? "POST" : "PATCH";
      await fetchJsonWithRetry("/api/options", { method, body: JSON.stringify(body) });

      show({ title: "Başarılı", description: "Kaydedildi", variant: "success" });
      setOptionModalOpen(false);
      loadOptions();
    } catch (e: any) {
      show({ title: "Hata", description: e.message || "Kaydedilemedi", variant: "error" });
    }
  };

  const handleDeleteOption = async (id: string) => {
    if (!confirm("Silmek istediğinize emin misiniz?")) return;
    try {
      await fetchJsonWithRetry("/api/options", {
        method: "DELETE",
        body: JSON.stringify({ id }),
      });
      show({ title: "Silindi", description: "Kayıt silindi", variant: "success" });
      loadOptions();
    } catch (e: any) {
      show({ title: "Hata", description: e.message || "Silinemedi", variant: "error" });
    }
  };

  const handleToggleOption = async (id: string, current: boolean) => {
    try {
      await fetchJsonWithRetry("/api/options", {
        method: "PATCH",
        body: JSON.stringify({ action: "toggle", id, active: !current }),
      });
      loadOptions();
    } catch (e) {
      show({ title: "Hata", description: "Güncellenemedi", variant: "error" });
    }
  };

  // --- Evaluation Logic ---
  const loadQuestions = async () => {
    setEvalLoading(true);
    try {
      const [qData, tData] = await Promise.all([
        fetchJsonWithRetry<any>("/api/ayarlar/puanlama-sorulari"),
        fetchJsonWithRetry<any>("/api/ayarlar/puanlama-tipleri")
      ]);
      setQuestions(qData.questions || []);
      setScoringTypes(tData.items || []);
    } catch (e) {
      show({ title: "Hata", description: "Değerlendirme verileri yüklenemedi", variant: "error" });
    } finally {
      setEvalLoading(false);
    }
  };

  const handleSaveQuestion = async () => {
    try {
      const method = evalModalMode === "add" ? "POST" : "PUT";
      await fetchJsonWithRetry("/api/ayarlar/puanlama-sorulari", {
        method,
        body: JSON.stringify(currentQuestion),
      });
      show({ title: "Başarılı", description: "Soru kaydedildi", variant: "success" });
      setEvalModalOpen(false);
      loadQuestions();
    } catch (e) {
      show({ title: "Hata", description: "Kaydedilemedi", variant: "error" });
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm("Bu soruyu silmek istediğinize emin misiniz?")) return;
    try {
      await fetchJsonWithRetry(`/api/ayarlar/puanlama-sorulari?id=${id}`, { method: "DELETE" });
      show({ title: "Silindi", description: "Soru silindi", variant: "success" });
      loadQuestions();
    } catch (e) {
      show({ title: "Hata", description: "Silinemedi", variant: "error" });
    }
  };

  const handleSaveScoringType = async () => {
    try {
      const method = scoringTypeModalMode === "add" ? "POST" : "PUT";
      await fetchJsonWithRetry("/api/ayarlar/puanlama-tipleri", {
        method,
        body: JSON.stringify(currentScoringType),
      });
      show({ title: "Başarılı", description: "Puanlama tipi kaydedildi", variant: "success" });
      setScoringTypeModalOpen(false);
      loadQuestions(); // Reload to update lists
    } catch (e: any) {
      show({ title: "Hata", description: e.message || "Kaydedilemedi", variant: "error" });
    }
  };

  const handleDeleteScoringType = async (id: string) => {
    if (!confirm("Bu puanlama tipini silmek istediğinize emin misiniz?")) return;
    try {
      await fetchJsonWithRetry(`/api/ayarlar/puanlama-tipleri?id=${id}`, { method: "DELETE" });
      show({ title: "Silindi", description: "Puanlama tipi silindi", variant: "success" });
      loadQuestions();
    } catch (e: any) {
      show({ title: "Hata", description: e.message || "Silinemedi", variant: "error" });
    }
  };

  // --- SMTP Logic ---
  const loadSmtp = async () => {
    setSmtpLoading(true);
    try {
      const data = await fetchJsonWithRetry<SmtpSetting[]>("/api/ayarlar/smtp");
      setSmtpSettings(data || []);
    } catch (e) {
      show({ title: "Hata", description: "SMTP ayarları yüklenemedi", variant: "error" });
    } finally {
      setSmtpLoading(false);
    }
  };

  const handleSaveSmtp = async () => {
    try {
      const method = smtpModalMode === "add" ? "POST" : "PUT";
      await fetchJsonWithRetry("/api/ayarlar/smtp", {
        method,
        body: JSON.stringify(currentSmtp),
      });
      show({ title: "Başarılı", description: "SMTP ayarı kaydedildi", variant: "success" });
      setSmtpModalOpen(false);
      loadSmtp();
    } catch (e) {
      show({ title: "Hata", description: "Kaydedilemedi", variant: "error" });
    }
  };

  const handleDeleteSmtp = async (id: string) => {
    if (!confirm("Bu ayarı silmek istediğinize emin misiniz?")) return;
    try {
      await fetchJsonWithRetry(`/api/ayarlar/smtp?id=${id}`, { method: "DELETE" });
      show({ title: "Silindi", description: "Ayar silindi", variant: "success" });
      loadSmtp();
    } catch (e) {
      show({ title: "Hata", description: "Silinemedi", variant: "error" });
    }
  };

  // --- Tevkifat Logic ---
  const loadTevkifat = async () => {
    setTevkifatLoading(true);
    try {
      const data = await fetchJsonWithRetry<any>("/api/withholding/job-types");
      setTevkifatItems(data.items || []);
    } catch (e) {
      show({ title: "Hata", description: "Tevkifat oranları yüklenemedi", variant: "error" });
    } finally {
      setTevkifatLoading(false);
    }
  };

  const handleAddTevkifat = async () => {
    if (!tevkifatCode || !tevkifatLabel || !tevkifatRatio) return;
    setTevkifatLoading(true);
    try {
      await fetchJsonWithRetry("/api/withholding/job-types", {
        method: "POST",
        body: JSON.stringify({ code: tevkifatCode, label: tevkifatLabel, ratio: tevkifatRatio }),
      });
      show({ title: "Başarılı", description: "Tevkifat oranı eklendi", variant: "success" });
      setTevkifatCode("");
      setTevkifatLabel("");
      setTevkifatRatio("");
      loadTevkifat();
    } catch (e) {
      show({ title: "Hata", description: "Eklenemedi", variant: "error" });
    } finally {
      setTevkifatLoading(false);
    }
  };

  const handleToggleTevkifat = async (code: string, active: boolean) => {
    try {
      await fetchJsonWithRetry("/api/withholding/job-types", {
        method: "PATCH",
        body: JSON.stringify({ code, active }),
      });
      loadTevkifat();
    } catch (e) {
      show({ title: "Hata", description: "Güncellenemedi", variant: "error" });
    }
  };

  // Render Helpers
  const renderOptionsTab = () => {
    const list = options[activeDropdownCat] || [];
    return (
      <div className="flex flex-col lg:flex-row gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Card className="w-full lg:w-72 shrink-0 p-4 h-fit">
          <div className="space-y-1">
            {dropdownCategories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveDropdownCat(cat.key)}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-between group ${activeDropdownCat === cat.key
                  ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                  : "hover:bg-slate-100 text-slate-600 hover:text-slate-900"
                  }`}
              >
                {cat.name}
                {activeDropdownCat === cat.key && (
                  <svg className="w-4 h-4 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                )}
              </button>
            ))}
          </div>
        </Card>

        <div className="flex-1 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <span className="w-2 h-8 bg-blue-500 rounded-full"></span>
              {dropdownCategories.find(c => c.key === activeDropdownCat)?.name}
            </h3>
            {activeDropdownCat === "ilgiliKisi" ? (
              <div className="flex gap-3">
                <Button size="sm" variant="outline" onClick={async () => {
                  try {
                    const res = await fetchJsonWithRetry<any>("/api/options", { method: "POST", body: JSON.stringify({ action: "sync_users" }) });
                    show({ title: "Senkronize Edildi", description: `${res.added || 0} kullanıcı eklendi.`, variant: "success" });
                    loadOptions();
                  } catch { show({ title: "Hata", description: "Senkronizasyon başarısız", variant: "error" }); }
                }}>Senkronize Et</Button>
                <Button size="sm" variant="outline" onClick={() => window.location.href = "/ayarlar/kullanicilar"}>Kullanıcı Yönetimi</Button>
              </div>
            ) : (
              <Button onClick={() => {
                setOptionModalMode("add");
                setOptionModalValue("");
                setOptionModalEmail("");
                setCompanyFields({ taxId: "", address: "", taxOffice: "", phone: "", email: "" });
                setOptionModalOpen(true);
              }} className="bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20">
                Yeni Ekle
              </Button>
            )}
          </div>

          {activeDropdownCat === "ilgiliKisi" && (
            <div className="bg-blue-50/50 backdrop-blur-sm text-blue-800 p-4 rounded-xl text-sm border border-blue-100 flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <p><strong>Bilgi:</strong> İlgili Kişiler listesi, sistemdeki kullanıcılar ile senkronize çalışır. Yeni kişi eklemek için <strong>Kullanıcı Yönetimi</strong> sayfasını kullanın. Eski veya hatalı kayıtları buradan silebilirsiniz.</p>
            </div>
          )}

          <Card className="overflow-hidden p-0">
            {optionsLoading ? (
              <div className="p-12 text-center text-slate-400">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                Yükleniyor...
              </div>
            ) : list.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
                </div>
                Kayıt bulunamadı.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50/80 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-left font-semibold text-slate-700">Etiket</th>
                      {activeDropdownCat === "birim" && <th className="px-6 py-4 text-left font-semibold text-slate-700">E-posta</th>}
                      <th className="px-6 py-4 text-left font-semibold text-slate-700 w-32">Durum</th>
                      <th className="px-6 py-4 text-right font-semibold text-slate-700 w-32">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {list.map(item => (
                      <tr key={item.id} className="hover:bg-blue-50/30 transition-colors group">
                        <td className="px-6 py-4 font-medium text-slate-700">{item.label}</td>
                        {activeDropdownCat === "birim" && <td className="px-6 py-4 text-slate-500">{item.email || "-"}</td>}
                        <td className="px-6 py-4">
                          <button onClick={() => handleToggleOption(item.id, item.active)} className="focus:outline-none transition-transform active:scale-95">
                            <Badge variant={item.active ? "success" : "default"} className={item.active ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"}>
                              {item.active ? "Aktif" : "Pasif"}
                            </Badge>
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <IconButton variant="glass" icon="edit" label="Düzenle" size="sm" onClick={() => {
                              setOptionModalMode("edit");
                              setOptionModalId(item.id);
                              setOptionModalValue(item.label);
                              setOptionModalEmail(item.email || "");
                              setOptionModalOpen(true);
                            }} />
                            <IconButton variant="glass" icon="trash" label="Sil" size="sm" tone="danger" onClick={() => handleDeleteOption(item.id)} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>
    );
  };

  const renderEvaluationTab = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Scoring Types Section */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span className="w-2 h-8 bg-blue-500 rounded-full"></span>
            Puanlama Tipleri
          </h3>
          <Button size="sm" onClick={() => {
            setScoringTypeModalMode("add");
            setCurrentScoringType({ active: true, scaleMin: 1, scaleMax: 5, step: 1, kind: "rating" });
            setScoringTypeModalOpen(true);
          }} className="bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20 px-4 py-2 rounded-lg text-sm font-medium transition-colors">Yeni Tip Ekle</Button>
        </div>

        <Card className="overflow-hidden p-0">
          {evalLoading ? (
            <div className="p-12 text-center text-slate-400">Yükleniyor...</div>
          ) : scoringTypes.length === 0 ? (
            <div className="p-12 text-center text-slate-400">Puanlama tipi bulunamadı.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50/80 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold text-slate-700">Ad</th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-700">Kod</th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-700">Ölçek</th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-700">Durum</th>
                    <th className="px-6 py-4 text-right font-semibold text-slate-700 w-32">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {scoringTypes.map(t => (
                    <tr key={t.id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="px-6 py-4 font-medium text-slate-700">{t.name}</td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-500 bg-slate-100 rounded px-2 py-1 w-fit">{t.code}</td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-slate-500 mb-1 flex gap-2">
                          <span className="bg-blue-50 text-blue-700 px-1.5 rounded">A: %{(t.weightA * 100).toFixed(0)}</span>
                          <span className="bg-blue-50 text-blue-700 px-1.5 rounded">B: %{(t.weightB * 100).toFixed(0)}</span>
                          <span className="bg-blue-50 text-blue-700 px-1.5 rounded">C: %{(t.weightC * 100).toFixed(0)}</span>
                        </div>
                        <span className="font-medium">{t.scaleMin}-{t.scaleMax}</span> <span className="text-slate-400 text-xs">(Adım: {t.step})</span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={t.active ? "success" : "default"}>{t.active ? "Aktif" : "Pasif"}</Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <IconButton variant="glass" icon="edit" label="Düzenle" size="sm" onClick={() => {
                            setScoringTypeModalMode("edit");
                            setCurrentScoringType(t);
                            setScoringTypeModalOpen(true);
                          }} />
                          <IconButton variant="glass" icon="trash" label="Sil" size="sm" tone="danger" onClick={() => handleDeleteScoringType(t.id)} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Questions Section */}
      <div className="space-y-6 pt-6 border-t border-slate-200/60">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span className="w-2 h-8 bg-blue-500 rounded-full"></span>
            Değerlendirme Soruları
          </h3>
          <Button size="sm" onClick={() => {
            setEvalModalMode("add");
            setCurrentQuestion({ active: true, required: false, type: "rating", sort: questions.length + 1 });
            setEvalModalOpen(true);
          }} className="bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20 px-4 py-2 rounded-lg text-sm font-medium transition-colors">Yeni Soru Ekle</Button>
        </div>

        <Card className="overflow-hidden p-0">
          {evalLoading ? (
            <div className="p-12 text-center text-slate-400">Yükleniyor...</div>
          ) : questions.length === 0 ? (
            <div className="p-12 text-center text-slate-400">Soru bulunamadı.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50/80 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold text-slate-700 w-16">Sıra</th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-700">Bölüm</th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-700">Soru Metni</th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-700">Tip</th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-700">Zorunlu</th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-700">Durum</th>
                    <th className="px-6 py-4 text-right font-semibold text-slate-700 w-32">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {questions.map(q => (
                    <tr key={q.id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="px-6 py-4 font-medium text-slate-500">{q.sort}</td>
                      <td className="px-6 py-4"><Badge variant="default" className="bg-slate-50">{q.section || "-"}</Badge></td>
                      <td className="px-6 py-4 font-medium text-slate-700">{q.text}</td>
                      <td className="px-6 py-4 text-slate-600">
                        {q.type === "rating" ? (
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                            {q.scoringType?.name || "Puanlama"}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                            {q.type === "text" ? "Metin" : "Seçmeli"}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {q.required ? <span className="text-red-500 font-medium text-xs bg-red-50 px-2 py-1 rounded">Zorunlu</span> : <span className="text-slate-400 text-xs">Opsiyonel</span>}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={q.active ? "success" : "default"}>{q.active ? "Aktif" : "Pasif"}</Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <IconButton variant="glass" icon="edit" label="Düzenle" size="sm" onClick={() => {
                            setEvalModalMode("edit");
                            setCurrentQuestion(q);
                            setEvalModalOpen(true);
                          }} />
                          <IconButton variant="glass" icon="trash" label="Sil" size="sm" tone="danger" onClick={() => handleDeleteQuestion(q.id)} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );

  const renderSmtpTab = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <span className="w-2 h-8 bg-blue-500 rounded-full"></span>
          SMTP Sunucu Ayarları
        </h3>
        <Button size="sm" onClick={() => {
          setSmtpModalMode("add");
          setCurrentSmtp({ active: true, secure: true, port: 587, isDefault: false });
          setSmtpModalOpen(true);
        }} className="bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20">Yeni Sunucu Ekle</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {smtpSettings.map(s => (
          <Card key={s.id} className="relative group hover:border-blue-500/50 transition-all hover:-translate-y-1">
            {s.isDefault && <Badge variant="info" className="absolute top-4 right-4 bg-blue-100 text-blue-700 border-blue-200">Varsayılan</Badge>}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              </div>
              <h4 className="font-bold text-lg text-slate-800">{s.name || s.key}</h4>
            </div>

            <div className="space-y-2 text-sm text-slate-600 bg-slate-50/50 p-3 rounded-lg border border-slate-100">
              <div className="flex justify-between">
                <span className="text-slate-400">Host:</span>
                <span className="font-medium font-mono">{s.host}:{s.port}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">User:</span>
                <span className="font-medium">{s.user}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">From:</span>
                <span className="font-medium">{s.from}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Secure:</span>
                <span className={`font-medium ${s.secure ? "text-emerald-600" : "text-slate-600"}`}>{s.secure ? "SSL/TLS" : "None"}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-100">
              <IconButton variant="glass" icon="edit" label="Düzenle" size="sm" onClick={() => {
                setSmtpModalMode("edit");
                setCurrentSmtp(s);
                setSmtpModalOpen(true);
              }} />
              <IconButton variant="glass" icon="trash" label="Sil" size="sm" tone="danger" onClick={() => handleDeleteSmtp(s.id)} />
            </div>
          </Card>
        ))}
        {smtpSettings.length === 0 && !smtpLoading && (
          <div className="col-span-full p-12 text-center text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            </div>
            <p className="font-medium">Henüz SMTP ayarı eklenmemiş.</p>
            <p className="text-sm mt-1">E-posta bildirimleri için bir sunucu ekleyin.</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Genel Ayarlar"
        description="Sistem genelindeki seçenekleri, değerlendirme kriterlerini ve bildirim ayarlarını yönetin."
        variant="default"
      />

      <div className="flex flex-wrap p-1 bg-slate-100 rounded-xl border border-slate-200 w-fit gap-1">
        {[
          { id: "options", label: "Seçenekler" },
          { id: "evaluation", label: "Değerlendirme" },
          { id: "tevkifat", label: "Tevkifat Oranları" },
          { id: "notifications", label: "Bildirimler (SMTP)" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              px-6 py-2.5 text-sm font-medium rounded-lg transition-all duration-200
              ${activeTab === tab.id
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              }
            `}
          >
            {tab.label}
          </button>
        ))}
        {/* Yönetim sayfalarına linkler */}
        <a
          href="/ayarlar/kullanicilar"
          className="px-6 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 text-slate-600 hover:text-slate-900 hover:bg-white/50"
        >
          Kullanıcılar
        </a>
        <a
          href="/ayarlar/roller"
          className="px-6 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 text-slate-600 hover:text-slate-900 hover:bg-white/50"
        >
          Roller
        </a>
        <a
          href="/ayarlar/loglar"
          className="px-6 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 text-slate-600 hover:text-slate-900 hover:bg-white/50"
        >
          Sistem Logları
        </a>
      </div>

      <div className="min-h-[400px]">
        {activeTab === "options" && renderOptionsTab()}
        {activeTab === "evaluation" && renderEvaluationTab()}
        {activeTab === "tevkifat" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <span className="w-2 h-8 bg-blue-500 rounded-full"></span>
                Tevkifat Oranları
              </h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Add New Form */}
              <Card className="h-fit lg:sticky lg:top-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-800">Yeni İş Türü</h3>
                    <p className="text-xs text-slate-500">Yeni tevkifat oranı tanımlayın.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <Input
                    label="Kod"
                    placeholder="Ör: 601"
                    value={tevkifatCode}
                    onChange={(e) => setTevkifatCode(e.target.value)}
                  />
                  <Input
                    label="Ad"
                    placeholder="Ör: Yapım İşleri"
                    value={tevkifatLabel}
                    onChange={(e) => setTevkifatLabel(e.target.value)}
                  />
                  <Input
                    label="Oran"
                    placeholder="Ör: 4/10"
                    value={tevkifatRatio}
                    onChange={(e) => setTevkifatRatio(e.target.value)}
                    description="Örn: 9/10, 4/10"
                  />

                  <Button
                    className="w-full bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20"
                    onClick={handleAddTevkifat}
                    disabled={!tevkifatCode || !tevkifatLabel || !tevkifatRatio || tevkifatLoading}
                    loading={tevkifatLoading}
                  >
                    Ekle
                  </Button>
                </div>
              </Card>

              {/* List */}
              <div className="lg:col-span-2">
                <Card className="overflow-hidden p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50/80 border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-4 text-left font-semibold text-slate-700">Kod</th>
                          <th className="px-6 py-4 text-left font-semibold text-slate-700">Ad</th>
                          <th className="px-6 py-4 text-left font-semibold text-slate-700">Oran</th>
                          <th className="px-6 py-4 text-left font-semibold text-slate-700">Durum</th>
                          <th className="px-6 py-4 text-right font-semibold text-slate-700 w-32">İşlemler</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {tevkifatItems.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="text-center py-12 text-slate-400">
                              Kayıt bulunamadı.
                            </td>
                          </tr>
                        ) : tevkifatItems.map((it) => (
                          <tr key={it.code} className="group hover:bg-blue-50/30 transition-colors">
                            <td className="px-6 py-4 font-mono font-medium text-slate-700">{it.code}</td>
                            <td className="px-6 py-4 font-medium text-slate-800">{it.label}</td>
                            <td className="px-6 py-4">
                              <Badge variant="default" className="bg-slate-50 font-mono">{it.ratio}</Badge>
                            </td>
                            <td className="px-6 py-4">
                              <Badge variant={(it.active ?? true) ? "success" : "default"}>
                                {(it.active ?? true) ? "Aktif" : "Pasif"}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleTevkifat(it.code, !(it.active ?? true))}
                                className={(it.active ?? true) ? "text-red-600 hover:bg-red-50" : "text-emerald-600 hover:bg-emerald-50"}
                              >
                                {(it.active ?? true) ? "Pasif Yap" : "Aktif Yap"}
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        )}
        {activeTab === "notifications" && renderSmtpTab()}
      </div>

      {/* Option Modal */}
      <Modal
        isOpen={optionModalOpen}
        onClose={() => setOptionModalOpen(false)}
        title={optionModalMode === "add" ? "Yeni Seçenek Ekle" : "Seçeneği Düzenle"}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setOptionModalOpen(false)}>İptal</Button>
            <Button onClick={handleSaveOption}>Kaydet</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label={activeDropdownCat === "firma" ? "Firma Adı" : "Etiket / İsim"}
            value={optionModalValue}
            onChange={(e) => setOptionModalValue(e.target.value)}
            autoFocus
          />
          {activeDropdownCat === "birim" && (
            <Input label="E-posta (Opsiyonel)" value={optionModalEmail} onChange={(e) => setOptionModalEmail(e.target.value)} />
          )}
          {activeDropdownCat === "firma" && (
            <>
              <Input label="Vergi No" value={companyFields.taxId} onChange={(e) => setCompanyFields({ ...companyFields, taxId: e.target.value })} />
              <Input label="Vergi Dairesi" value={companyFields.taxOffice} onChange={(e) => setCompanyFields({ ...companyFields, taxOffice: e.target.value })} />
              <Input label="Adres" value={companyFields.address} onChange={(e) => setCompanyFields({ ...companyFields, address: e.target.value })} />
              <Input label="Telefon" value={companyFields.phone} onChange={(e) => setCompanyFields({ ...companyFields, phone: e.target.value })} />
              <Input label="E-posta" value={companyFields.email} onChange={(e) => setCompanyFields({ ...companyFields, email: e.target.value })} />
            </>
          )}
        </div>
      </Modal>

      {/* Evaluation Modal */}
      <Modal
        isOpen={evalModalOpen}
        onClose={() => setEvalModalOpen(false)}
        title={evalModalMode === "add" ? "Yeni Soru Ekle" : "Soruyu Düzenle"}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setEvalModalOpen(false)}>İptal</Button>
            <Button onClick={handleSaveQuestion}>Kaydet</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Soru Metni" value={currentQuestion.text || ""} onChange={(e) => setCurrentQuestion({ ...currentQuestion, text: e.target.value })} />

          <div className="grid grid-cols-2 gap-4">
            <Input label="Bölüm / Grup (Ör: A, B, C)" value={currentQuestion.section || ""} onChange={(e) => setCurrentQuestion({ ...currentQuestion, section: e.target.value })} />
            <Input label="Sıra No" type="number" value={currentQuestion.sort || 0} onChange={(e) => setCurrentQuestion({ ...currentQuestion, sort: Number(e.target.value) })} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select label="Tip" value={currentQuestion.type || "rating"} onChange={(e) => setCurrentQuestion({ ...currentQuestion, type: e.target.value })}>
              <option value="rating">Puanlama</option>
              <option value="text">Metin</option>
              <option value="dropdown">Seçmeli</option>
            </Select>

            {currentQuestion.type === "rating" && (
              <Select label="Puanlama Tipi" value={currentQuestion.scoringTypeId || ""} onChange={(e) => setCurrentQuestion({ ...currentQuestion, scoringTypeId: e.target.value || null })}>
                <option value="">Varsayılan (1-5)</option>
                {scoringTypes.filter(t => t.active).map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.scaleMin}-{t.scaleMax})</option>
                ))}
              </Select>
            )}
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={currentQuestion.required || false} onChange={(e) => setCurrentQuestion({ ...currentQuestion, required: e.target.checked })} />
              <span>Zorunlu</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={currentQuestion.active !== false} onChange={(e) => setCurrentQuestion({ ...currentQuestion, active: e.target.checked })} />
              <span>Aktif</span>
            </label>
          </div>
        </div>
      </Modal>

      {/* Scoring Type Modal */}
      <Modal
        isOpen={scoringTypeModalOpen}
        onClose={() => setScoringTypeModalOpen(false)}
        title={scoringTypeModalMode === "add" ? "Yeni Puanlama Tipi" : "Puanlama Tipini Düzenle"}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setScoringTypeModalOpen(false)}>İptal</Button>
            <Button onClick={handleSaveScoringType}>Kaydet</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Ad (Ör: 5'li Likert)" value={currentScoringType.name || ""} onChange={(e) => setCurrentScoringType({ ...currentScoringType, name: e.target.value })} />
            <Input label="Kod (Ör: LIKERT_5)" value={currentScoringType.code || ""} onChange={(e) => setCurrentScoringType({ ...currentScoringType, code: e.target.value })} disabled={scoringTypeModalMode === "edit"} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input label="Min Değer" type="number" value={currentScoringType.scaleMin || 1} onChange={(e) => setCurrentScoringType({ ...currentScoringType, scaleMin: Number(e.target.value) })} />
            <Input label="Max Değer" type="number" value={currentScoringType.scaleMax || 5} onChange={(e) => setCurrentScoringType({ ...currentScoringType, scaleMax: Number(e.target.value) })} />
            <Input label="Adım (Step)" type="number" value={currentScoringType.step || 1} onChange={(e) => setCurrentScoringType({ ...currentScoringType, step: Number(e.target.value) })} />
          </div>

          <div className="grid grid-cols-3 gap-4 bg-muted/30 p-3 rounded-md border border-dashed">
            <div className="col-span-3 text-xs font-medium text-muted-foreground mb-1">Grup Ağırlıkları (Toplam 1.00 olmalı)</div>
            <Input label="A Grubu" type="number" step="0.01" value={currentScoringType.weightA ?? 0.40} onChange={(e) => setCurrentScoringType({ ...currentScoringType, weightA: Number(e.target.value) })} />
            <Input label="B Grubu" type="number" step="0.01" value={currentScoringType.weightB ?? 0.30} onChange={(e) => setCurrentScoringType({ ...currentScoringType, weightB: Number(e.target.value) })} />
            <Input label="C Grubu" type="number" step="0.01" value={currentScoringType.weightC ?? 0.30} onChange={(e) => setCurrentScoringType({ ...currentScoringType, weightC: Number(e.target.value) })} />
          </div>

          <Input label="Açıklama" value={currentScoringType.description || ""} onChange={(e) => setCurrentScoringType({ ...currentScoringType, description: e.target.value })} />

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={currentScoringType.active !== false} onChange={(e) => setCurrentScoringType({ ...currentScoringType, active: e.target.checked })} />
              <span>Aktif</span>
            </label>
          </div>
        </div>
      </Modal>

      {/* SMTP Modal */}
      <Modal
        isOpen={smtpModalOpen}
        onClose={() => setSmtpModalOpen(false)}
        title={smtpModalMode === "add" ? "Yeni SMTP Sunucusu" : "SMTP Ayarını Düzenle"}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setSmtpModalOpen(false)}>İptal</Button>
            <Button onClick={handleSaveSmtp}>Kaydet</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Tanım (Ör: Gmail)" value={currentSmtp.name || ""} onChange={(e) => setCurrentSmtp({ ...currentSmtp, name: e.target.value })} />
            <Input label="Key (Benzersiz Kod)" value={currentSmtp.key || ""} onChange={(e) => setCurrentSmtp({ ...currentSmtp, key: e.target.value })} disabled={smtpModalMode === "edit"} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <Input label="Host (Ör: smtp.gmail.com)" value={currentSmtp.host || ""} onChange={(e) => setCurrentSmtp({ ...currentSmtp, host: e.target.value })} />
            </div>
            <Input label="Port" type="number" value={currentSmtp.port || 587} onChange={(e) => setCurrentSmtp({ ...currentSmtp, port: Number(e.target.value) })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Kullanıcı (E-posta)" value={currentSmtp.user || ""} onChange={(e) => setCurrentSmtp({ ...currentSmtp, user: e.target.value })} />
            <Input label="Şifre" type="password" value={currentSmtp.pass || ""} onChange={(e) => setCurrentSmtp({ ...currentSmtp, pass: e.target.value })} placeholder={smtpModalMode === "edit" ? "********" : ""} />
          </div>
          <Input label="Gönderen (From)" value={currentSmtp.from || ""} onChange={(e) => setCurrentSmtp({ ...currentSmtp, from: e.target.value })} />

          <div className="flex items-center gap-4 pt-2">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={currentSmtp.secure || false} onChange={(e) => setCurrentSmtp({ ...currentSmtp, secure: e.target.checked })} />
              <span>SSL/TLS (Secure)</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={currentSmtp.isDefault || false} onChange={(e) => setCurrentSmtp({ ...currentSmtp, isDefault: e.target.checked })} />
              <span>Varsayılan Sunucu</span>
            </label>
          </div>

          <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
            Popüler Ayarlar:<br />
            Gmail: smtp.gmail.com | 587 | Secure: On<br />
            Outlook: smtp.office365.com | 587 | Secure: On<br />
            Yahoo: smtp.mail.yahoo.com | 465 | Secure: On
          </div>
        </div>
      </Modal>
    </div>
  );
}
