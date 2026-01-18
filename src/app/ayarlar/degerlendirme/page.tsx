"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import IconButton from "@/components/ui/IconButton";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Badge from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { fetchJsonWithRetry } from "@/lib/http";

type ScoringType = {
    id: string; name: string; code: string; kind: string;
    scaleMin: number; scaleMax: number; step: number;
    active: boolean; description?: string | null;
    weightA: number; weightB: number; weightC: number;
};

type EvaluationQuestion = {
    id: string; text: string; type: string; active: boolean;
    required: boolean; sort: number;
    scoringTypeId?: string | null; section?: string | null;
    scoringType?: ScoringType | null;
};

export default function DegerlendirmePage() {
    const router = useRouter();
    const { show } = useToast();

    const [questions, setQuestions] = useState<EvaluationQuestion[]>([]);
    const [scoringTypes, setScoringTypes] = useState<ScoringType[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"questions" | "scoring">("questions");

    // Question Modal
    const [qModalOpen, setQModalOpen] = useState(false);
    const [qModalMode, setQModalMode] = useState<"add" | "edit">("add");
    const [currentQuestion, setCurrentQuestion] = useState<Partial<EvaluationQuestion>>({});

    // Scoring Type Modal
    const [stModalOpen, setStModalOpen] = useState(false);
    const [stModalMode, setStModalMode] = useState<"add" | "edit">("add");
    const [currentScoringType, setCurrentScoringType] = useState<Partial<ScoringType>>({});

    const loadData = async () => {
        setLoading(true);
        try {
            const [qRes, stRes] = await Promise.all([
                fetchJsonWithRetry<{ questions: EvaluationQuestion[]; scoringTypes: ScoringType[] }>("/api/ayarlar/degerlendirme"),
                fetchJsonWithRetry<{ items: ScoringType[] }>("/api/ayarlar/puanlama-tipleri")
            ]);
            setQuestions(qRes.questions || []);
            setScoringTypes(stRes.items || []);
        } catch (e) {
            show({ title: "Hata", description: "Veriler yüklenemedi", variant: "error" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Question handlers
    const handleSaveQuestion = async () => {
        try {
            const method = qModalMode === "add" ? "POST" : "PUT";
            await fetchJsonWithRetry("/api/ayarlar/degerlendirme", {
                method,
                body: JSON.stringify(currentQuestion),
            });
            show({ title: "Başarılı", variant: "success" });
            setQModalOpen(false);
            loadData();
        } catch (e: any) {
            show({ title: "Hata", description: e.message, variant: "error" });
        }
    };

    const handleDeleteQuestion = async (id: string) => {
        if (!confirm("Silmek istediğinize emin misiniz?")) return;
        try {
            await fetchJsonWithRetry(`/api/ayarlar/degerlendirme?id=${id}`, { method: "DELETE" });
            show({ title: "Silindi", variant: "success" });
            loadData();
        } catch (e) {
            show({ title: "Hata", variant: "error" });
        }
    };

    // Scoring Type handlers
    const handleSaveScoringType = async () => {
        try {
            const method = stModalMode === "add" ? "POST" : "PUT";
            await fetchJsonWithRetry("/api/ayarlar/puanlama-tipleri", {
                method,
                body: JSON.stringify(currentScoringType),
            });
            show({ title: "Başarılı", variant: "success" });
            setStModalOpen(false);
            loadData();
        } catch (e: any) {
            show({ title: "Hata", description: e.message, variant: "error" });
        }
    };

    const handleDeleteScoringType = async (id: string) => {
        if (!confirm("Silmek istediğinize emin misiniz?")) return;
        try {
            await fetchJsonWithRetry(`/api/ayarlar/puanlama-tipleri?id=${id}`, { method: "DELETE" });
            show({ title: "Silindi", variant: "success" });
            loadData();
        } catch (e) {
            show({ title: "Hata", variant: "error" });
        }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10 animate-in fade-in duration-500">
            <PageHeader
                title="Tedarikçi Değerlendirme"
                description="Değerlendirme soruları ve puanlama tiplerini yönetin."
                actions={
                    <Button variant="outline" onClick={() => router.push("/ayarlar")}>← Geri</Button>
                }
            />

            {/* Tab Navigation */}
            <div className="flex gap-2">
                <button
                    onClick={() => setActiveTab("questions")}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === "questions"
                        ? "bg-sky-600 text-white shadow-md"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                >
                    ⭐ Sorular ({questions.length})
                </button>
                <button
                    onClick={() => setActiveTab("scoring")}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === "scoring"
                        ? "bg-sky-600 text-white shadow-md"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                >
                    📊 Puanlama Tipleri ({scoringTypes.length})
                </button>
            </div>

            {loading ? (
                <Card className="p-10">
                    <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
                    </div>
                </Card>
            ) : activeTab === "questions" ? (
                <Card className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg text-slate-800">Değerlendirme Soruları</h3>
                        <Button onClick={() => { setQModalMode("add"); setCurrentQuestion({ active: true, required: true, sort: questions.length + 1, type: "rating" }); setQModalOpen(true); }}>
                            Yeni Soru Ekle
                        </Button>
                    </div>
                    {questions.length === 0 ? (
                        <div className="text-center py-10 text-slate-500">Henüz soru eklenmemiş.</div>
                    ) : (
                        <div className="space-y-3">
                            {questions.sort((a, b) => a.sort - b.sort).map((q) => (
                                <div key={q.id} className={`flex items-center justify-between p-4 rounded-lg border ${q.active ? "bg-white" : "bg-slate-100 opacity-60"}`}>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs text-slate-400">#{q.sort}</span>
                                            {q.section && <Badge variant="default" className="text-xs">{q.section}</Badge>}
                                            <Badge variant={q.active ? "success" : "default"} className="text-xs">{q.active ? "Aktif" : "Pasif"}</Badge>
                                            {q.required && <Badge variant="warning" className="text-xs">Zorunlu</Badge>}
                                        </div>
                                        <p className="font-medium text-slate-800">{q.text}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <IconButton variant="ghost" icon="edit" label="Düzenle" size="sm" onClick={() => { setQModalMode("edit"); setCurrentQuestion(q); setQModalOpen(true); }} />
                                        <IconButton variant="ghost" icon="trash" label="Sil" size="sm" tone="danger" onClick={() => handleDeleteQuestion(q.id)} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            ) : (
                <Card className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg text-slate-800">Puanlama Tipleri</h3>
                        <Button onClick={() => { setStModalMode("add"); setCurrentScoringType({ active: true, scaleMin: 1, scaleMax: 5, step: 1, kind: "rating", weightA: 0.4, weightB: 0.3, weightC: 0.3 }); setStModalOpen(true); }}>
                            Yeni Tip Ekle
                        </Button>
                    </div>
                    {scoringTypes.length === 0 ? (
                        <div className="text-center py-10 text-slate-500">Henüz puanlama tipi eklenmemiş.</div>
                    ) : (
                        <div className="space-y-3">
                            {scoringTypes.map((st) => (
                                <div key={st.id} className={`flex items-center justify-between p-4 rounded-lg border ${st.active ? "bg-white" : "bg-slate-100 opacity-60"}`}>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-mono text-sm text-slate-500">{st.code}</span>
                                            <Badge variant={st.active ? "success" : "default"} className="text-xs">{st.active ? "Aktif" : "Pasif"}</Badge>
                                        </div>
                                        <p className="font-medium text-slate-800">{st.name}</p>
                                        <p className="text-sm text-slate-500">Ölçek: {st.scaleMin}-{st.scaleMax} | Adım: {st.step}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <IconButton variant="ghost" icon="edit" label="Düzenle" size="sm" onClick={() => { setStModalMode("edit"); setCurrentScoringType(st); setStModalOpen(true); }} />
                                        <IconButton variant="ghost" icon="trash" label="Sil" size="sm" tone="danger" onClick={() => handleDeleteScoringType(st.id)} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            )}

            {/* Question Modal */}
            <Modal isOpen={qModalOpen} onClose={() => setQModalOpen(false)} title={qModalMode === "add" ? "Yeni Soru Ekle" : "Soruyu Düzenle"} size="md"
                footer={<><Button variant="outline" onClick={() => setQModalOpen(false)}>İptal</Button><Button onClick={handleSaveQuestion}>Kaydet</Button></>}>
                <div className="space-y-4">
                    <Input label="Soru Metni" value={currentQuestion.text || ""} onChange={(e) => setCurrentQuestion({ ...currentQuestion, text: e.target.value })} />
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Bölüm (A, B, C)" value={currentQuestion.section || ""} onChange={(e) => setCurrentQuestion({ ...currentQuestion, section: e.target.value })} />
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
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2"><input type="checkbox" checked={currentQuestion.required || false} onChange={(e) => setCurrentQuestion({ ...currentQuestion, required: e.target.checked })} /> Zorunlu</label>
                        <label className="flex items-center gap-2"><input type="checkbox" checked={currentQuestion.active !== false} onChange={(e) => setCurrentQuestion({ ...currentQuestion, active: e.target.checked })} /> Aktif</label>
                    </div>
                </div>
            </Modal>

            {/* Scoring Type Modal */}
            <Modal isOpen={stModalOpen} onClose={() => setStModalOpen(false)} title={stModalMode === "add" ? "Yeni Puanlama Tipi" : "Puanlama Tipini Düzenle"} size="md"
                footer={<><Button variant="outline" onClick={() => setStModalOpen(false)}>İptal</Button><Button onClick={handleSaveScoringType}>Kaydet</Button></>}>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Ad (Ör: 5'li Likert)" value={currentScoringType.name || ""} onChange={(e) => setCurrentScoringType({ ...currentScoringType, name: e.target.value })} />
                        <Input label="Kod (Ör: LIKERT_5)" value={currentScoringType.code || ""} onChange={(e) => setCurrentScoringType({ ...currentScoringType, code: e.target.value })} disabled={stModalMode === "edit"} />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <Input label="Min Değer" type="number" value={currentScoringType.scaleMin || 1} onChange={(e) => setCurrentScoringType({ ...currentScoringType, scaleMin: Number(e.target.value) })} />
                        <Input label="Max Değer" type="number" value={currentScoringType.scaleMax || 5} onChange={(e) => setCurrentScoringType({ ...currentScoringType, scaleMax: Number(e.target.value) })} />
                        <Input label="Adım (Step)" type="number" value={currentScoringType.step || 1} onChange={(e) => setCurrentScoringType({ ...currentScoringType, step: Number(e.target.value) })} />
                    </div>
                    <Input label="Açıklama" value={currentScoringType.description || ""} onChange={(e) => setCurrentScoringType({ ...currentScoringType, description: e.target.value })} />

                    {/* Kategori Ağırlık Katsayıları */}
                    <div className="border-t pt-4 mt-4">
                        <p className="text-sm font-medium text-slate-700 mb-3">Kategori Ağırlık Katsayıları (Toplam = 1.0)</p>
                        <div className="grid grid-cols-3 gap-4">
                            <Input
                                label="A Kategorisi Ağırlık"
                                type="number"
                                step="0.1"
                                value={currentScoringType.weightA ?? 0.4}
                                onChange={(e) => setCurrentScoringType({ ...currentScoringType, weightA: Number(e.target.value) })}
                            />
                            <Input
                                label="B Kategorisi Ağırlık"
                                type="number"
                                step="0.1"
                                value={currentScoringType.weightB ?? 0.3}
                                onChange={(e) => setCurrentScoringType({ ...currentScoringType, weightB: Number(e.target.value) })}
                            />
                            <Input
                                label="C Kategorisi Ağırlık"
                                type="number"
                                step="0.1"
                                value={currentScoringType.weightC ?? 0.3}
                                onChange={(e) => setCurrentScoringType({ ...currentScoringType, weightC: Number(e.target.value) })}
                            />
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                            Toplam: {((currentScoringType.weightA ?? 0.4) + (currentScoringType.weightB ?? 0.3) + (currentScoringType.weightC ?? 0.3)).toFixed(1)}
                        </p>
                    </div>

                    <label className="flex items-center gap-2"><input type="checkbox" checked={currentScoringType.active !== false} onChange={(e) => setCurrentScoringType({ ...currentScoringType, active: e.target.checked })} /> Aktif</label>
                </div>
            </Modal>
        </div>
    );
}
