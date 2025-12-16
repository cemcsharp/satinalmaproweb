"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Skeleton from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

interface ApprovalStep {
    id?: string;
    stepOrder: number;
    name: string;
    description?: string;
    approverRole?: string;
    approverUnit?: string;
    required: boolean;
    autoApprove: boolean;
    budgetLimit?: number;
}

interface ApprovalWorkflow {
    id: string;
    name: string;
    displayName: string;
    entityType: string;
    active: boolean;
    steps: ApprovalStep[];
    createdAt: string;
}

const ROLES = [
    { key: "birim_muduru", label: "Birim Müdürü" },
    { key: "genel_mudur", label: "Genel Müdür" },
    { key: "satinalma_muduru", label: "Satınalma Müdürü" },
    { key: "satinalma_personeli", label: "Satınalma Personeli" },
    { key: "admin", label: "Sistem Admini" },
];

const ENTITY_TYPES = [
    { key: "Request", label: "Talep" },
    { key: "Order", label: "Sipariş" },
    { key: "Contract", label: "Sözleşme" },
];

export default function OnayAkislariPage() {
    const { show } = useToast();
    const [workflows, setWorkflows] = useState<ApprovalWorkflow[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedWorkflow, setSelectedWorkflow] = useState<ApprovalWorkflow | null>(null);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    // Edit form state
    const [editSteps, setEditSteps] = useState<ApprovalStep[]>([]);
    const [editDisplayName, setEditDisplayName] = useState("");
    const [editActive, setEditActive] = useState(true);

    // Create form state
    const [newName, setNewName] = useState("");
    const [newDisplayName, setNewDisplayName] = useState("");
    const [newEntityType, setNewEntityType] = useState("Request");

    useEffect(() => {
        fetchWorkflows();
    }, []);

    const fetchWorkflows = async () => {
        try {
            const res = await fetch("/api/approval-workflows");
            if (!res.ok) throw new Error("Veri alınamadı");
            const data = await res.json();
            setWorkflows(data);
        } catch (e: any) {
            show({ title: "Hata", description: e.message, variant: "error" });
        } finally {
            setLoading(false);
        }
    };

    const openEditModal = (workflow: ApprovalWorkflow) => {
        setSelectedWorkflow(workflow);
        setEditDisplayName(workflow.displayName);
        setEditActive(workflow.active);
        setEditSteps([...workflow.steps]);
        setEditModalOpen(true);
    };

    const addStep = () => {
        setEditSteps([
            ...editSteps,
            {
                stepOrder: editSteps.length + 1,
                name: "",
                description: "",
                approverRole: "birim_muduru",
                required: true,
                autoApprove: false,
            },
        ]);
    };

    const removeStep = (index: number) => {
        const newSteps = editSteps.filter((_, i) => i !== index);
        // Reorder
        setEditSteps(newSteps.map((s, i) => ({ ...s, stepOrder: i + 1 })));
    };

    const updateStep = (index: number, field: string, value: any) => {
        const newSteps = [...editSteps];
        (newSteps[index] as any)[field] = value;
        setEditSteps(newSteps);
    };

    const moveStep = (index: number, direction: "up" | "down") => {
        if (direction === "up" && index === 0) return;
        if (direction === "down" && index === editSteps.length - 1) return;

        const newSteps = [...editSteps];
        const swapIndex = direction === "up" ? index - 1 : index + 1;
        [newSteps[index], newSteps[swapIndex]] = [newSteps[swapIndex], newSteps[index]];
        setEditSteps(newSteps.map((s, i) => ({ ...s, stepOrder: i + 1 })));
    };

    const saveWorkflow = async () => {
        if (!selectedWorkflow) return;

        // Validate steps
        for (const step of editSteps) {
            if (!step.name.trim()) {
                show({ title: "Hata", description: "Tüm adımların adı olmalı", variant: "error" });
                return;
            }
        }

        setSaving(true);
        try {
            const res = await fetch(`/api/approval-workflows/${selectedWorkflow.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    displayName: editDisplayName,
                    active: editActive,
                    steps: editSteps,
                }),
            });

            if (!res.ok) {
                const j = await res.json();
                throw new Error(j?.error || "Güncelleme başarısız");
            }

            show({ title: "Başarılı", description: "Akış güncellendi", variant: "success" });
            setEditModalOpen(false);
            fetchWorkflows();
        } catch (e: any) {
            show({ title: "Hata", description: e.message, variant: "error" });
        } finally {
            setSaving(false);
        }
    };

    const createWorkflow = async () => {
        if (!newName.trim() || !newDisplayName.trim()) {
            show({ title: "Hata", description: "İsim alanları zorunlu", variant: "error" });
            return;
        }

        setSaving(true);
        try {
            const res = await fetch("/api/approval-workflows", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newName.toLowerCase().replace(/\s+/g, "_"),
                    displayName: newDisplayName,
                    entityType: newEntityType,
                    steps: [
                        { name: "Birinci Onay", approverRole: "birim_muduru", required: true },
                    ],
                }),
            });

            if (!res.ok) {
                const j = await res.json();
                throw new Error(j?.error || "Oluşturma başarısız");
            }

            show({ title: "Başarılı", description: "Akış oluşturuldu", variant: "success" });
            setCreateModalOpen(false);
            setNewName("");
            setNewDisplayName("");
            setNewEntityType("Request");
            fetchWorkflows();
        } catch (e: any) {
            show({ title: "Hata", description: e.message, variant: "error" });
        } finally {
            setSaving(false);
        }
    };

    const deleteWorkflow = async (id: string) => {
        if (!confirm("Bu akışı silmek istediğinizden emin misiniz?")) return;

        try {
            const res = await fetch(`/api/approval-workflows/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Silme başarısız");
            show({ title: "Başarılı", description: "Akış silindi", variant: "success" });
            fetchWorkflows();
        } catch (e: any) {
            show({ title: "Hata", description: e.message, variant: "error" });
        }
    };

    if (loading) {
        return (
            <section className="space-y-6">
                <PageHeader title="Onay Akışları" />
                <div className="space-y-4">
                    {[1, 2].map(i => <Skeleton key={i} height={200} />)}
                </div>
            </section>
        );
    }

    return (
        <section className="space-y-6">
            <PageHeader
                title="Onay Akışları"
                subtitle="Talep, sipariş ve sözleşme onay süreçlerini yönetin"
                actions={
                    <Button variant="gradient" onClick={() => setCreateModalOpen(true)}>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Yeni Akış
                    </Button>
                }
            />

            {workflows.length === 0 ? (
                <Card className="p-8 text-center">
                    <div className="flex flex-col items-center">
                        <svg className="w-16 h-16 text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <h3 className="text-lg font-medium text-slate-700 mb-2">Henüz akış yok</h3>
                        <p className="text-sm text-slate-500 mb-4">İlk onay akışınızı oluşturun</p>
                        <Button variant="primary" onClick={() => setCreateModalOpen(true)}>
                            Akış Oluştur
                        </Button>
                    </div>
                </Card>
            ) : (
                <div className="space-y-4">
                    {workflows.map((workflow) => (
                        <Card key={workflow.id} className="p-5">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-lg font-semibold text-slate-900">{workflow.displayName}</h3>
                                        <Badge variant={workflow.active ? "success" : "default"}>
                                            {workflow.active ? "Aktif" : "Pasif"}
                                        </Badge>
                                        <Badge variant="info">{ENTITY_TYPES.find(e => e.key === workflow.entityType)?.label || workflow.entityType}</Badge>
                                    </div>
                                    <p className="text-sm text-slate-500 mt-1">Kod: {workflow.name}</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => openEditModal(workflow)}>
                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        Düzenle
                                    </Button>
                                    <Button variant="danger" size="sm" onClick={() => deleteWorkflow(workflow.id)}>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </Button>
                                </div>
                            </div>

                            {/* Steps */}
                            <div className="border rounded-lg overflow-hidden">
                                <div className="bg-slate-50 px-4 py-2 border-b">
                                    <span className="text-xs font-semibold text-slate-500 uppercase">Onay Adımları ({workflow.steps.length})</span>
                                </div>
                                <div className="divide-y">
                                    {workflow.steps.map((step, index) => (
                                        <div key={step.id || index} className="px-4 py-3 flex items-center gap-4">
                                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm">
                                                {step.stepOrder}
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-medium text-slate-800">{step.name}</div>
                                                {step.description && <div className="text-xs text-slate-500">{step.description}</div>}
                                            </div>
                                            <Badge variant="info">
                                                {ROLES.find(r => r.key === step.approverRole)?.label || step.approverRole}
                                            </Badge>
                                            {step.autoApprove && (
                                                <Badge variant="warning">Otomatik</Badge>
                                            )}
                                            {step.budgetLimit && (
                                                <span className="text-xs text-slate-500">
                                                    {Number(step.budgetLimit).toLocaleString("tr-TR")} ₺ limit
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Edit Modal */}
            <Modal
                isOpen={editModalOpen}
                title={`Akışı Düzenle: ${selectedWorkflow?.displayName}`}
                onClose={() => setEditModalOpen(false)}
                size="lg"
                footer={
                    <>
                        <Button variant="outline" onClick={() => setEditModalOpen(false)}>İptal</Button>
                        <Button variant="primary" onClick={saveWorkflow} disabled={saving}>
                            {saving ? "Kaydediliyor..." : "Kaydet"}
                        </Button>
                    </>
                }
            >
                <div className="space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Görünen Ad</label>
                            <Input
                                value={editDisplayName}
                                onChange={(e) => setEditDisplayName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Durum</label>
                            <Select value={editActive ? "true" : "false"} onChange={(e) => setEditActive(e.target.value === "true")}>
                                <option value="true">Aktif</option>
                                <option value="false">Pasif</option>
                            </Select>
                        </div>
                    </div>

                    {/* Steps */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-sm font-semibold text-slate-700">Onay Adımları</label>
                            <Button variant="outline" size="sm" onClick={addStep}>
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Adım Ekle
                            </Button>
                        </div>

                        <div className="space-y-3">
                            {editSteps.map((step, index) => (
                                <div key={index} className="border rounded-lg p-4 bg-slate-50">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">
                                            {index + 1}
                                        </div>
                                        <span className="font-medium text-slate-700">Adım {index + 1}</span>
                                        <div className="flex-1" />
                                        <button
                                            type="button"
                                            onClick={() => moveStep(index, "up")}
                                            disabled={index === 0}
                                            className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                            </svg>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => moveStep(index, "down")}
                                            disabled={index === editSteps.length - 1}
                                            className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => removeStep(index)}
                                            className="p-1 text-red-400 hover:text-red-600"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs text-slate-500 mb-1">Adım Adı</label>
                                            <Input
                                                value={step.name}
                                                onChange={(e) => updateStep(index, "name", e.target.value)}
                                                placeholder="Örn: Birim Müdürü Onayı"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-slate-500 mb-1">Onaylayan Rol</label>
                                            <Select
                                                value={step.approverRole || ""}
                                                onChange={(e) => updateStep(index, "approverRole", e.target.value)}
                                            >
                                                {ROLES.map(r => (
                                                    <option key={r.key} value={r.key}>{r.label}</option>
                                                ))}
                                            </Select>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-slate-500 mb-1">Bütçe Limiti (₺)</label>
                                            <Input
                                                type="number"
                                                value={step.budgetLimit || ""}
                                                onChange={(e) => updateStep(index, "budgetLimit", e.target.value)}
                                                placeholder="Boş = limit yok"
                                            />
                                        </div>
                                        <div className="flex items-end gap-4 pb-2">
                                            <label className="flex items-center gap-2 text-sm">
                                                <input
                                                    type="checkbox"
                                                    checked={step.autoApprove}
                                                    onChange={(e) => updateStep(index, "autoApprove", e.target.checked)}
                                                    className="rounded text-blue-600"
                                                />
                                                Otomatik Onayla
                                            </label>
                                            <label className="flex items-center gap-2 text-sm">
                                                <input
                                                    type="checkbox"
                                                    checked={step.required}
                                                    onChange={(e) => updateStep(index, "required", e.target.checked)}
                                                    className="rounded text-blue-600"
                                                />
                                                Zorunlu
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Create Modal */}
            <Modal
                isOpen={createModalOpen}
                title="Yeni Onay Akışı"
                onClose={() => setCreateModalOpen(false)}
                size="sm"
                footer={
                    <>
                        <Button variant="outline" onClick={() => setCreateModalOpen(false)}>İptal</Button>
                        <Button variant="primary" onClick={createWorkflow} disabled={saving}>
                            {saving ? "Oluşturuluyor..." : "Oluştur"}
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Akış Kodu (benzersiz)</label>
                        <Input
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="Örn: siparis_onay"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Görünen Ad</label>
                        <Input
                            value={newDisplayName}
                            onChange={(e) => setNewDisplayName(e.target.value)}
                            placeholder="Örn: Sipariş Onay Akışı"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Varlık Tipi</label>
                        <Select value={newEntityType} onChange={(e) => setNewEntityType(e.target.value)}>
                            {ENTITY_TYPES.map(t => (
                                <option key={t.key} value={t.key}>{t.label}</option>
                            ))}
                        </Select>
                    </div>
                </div>
            </Modal>
        </section>
    );
}
