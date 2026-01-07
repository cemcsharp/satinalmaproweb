"use client";
import React, { useState, useEffect } from "react";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import Skeleton from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

type ApprovalStep = {
    id: string;
    stepOrder: number;
    name: string;
    description?: string;
    approverRole?: string;
    required: boolean;
    autoApprove: boolean;
    budgetLimit?: number;
};

type ApprovalWorkflow = {
    id: string;
    name: string;
    displayName: string;
    entityType: string;
    active: boolean;
    steps: ApprovalStep[];
};

const ENTITY_TYPES = [
    { value: "Request", label: "Talep" },
    { value: "Order", label: "Sipariş" },
    { value: "Contract", label: "Sözleşme" },
    { value: "Invoice", label: "Fatura" },
];

const APPROVER_ROLES = [
    { value: "unit_manager", label: "Birim Yöneticisi" },
    { value: "purchasing", label: "Satınalma" },
    { value: "finance", label: "Finans" },
    { value: "admin", label: "Yönetici" },
];

export default function WorkflowsPage() {
    const { show } = useToast();
    const [workflows, setWorkflows] = useState<ApprovalWorkflow[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showCreate, setShowCreate] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        displayName: "",
        entityType: "Request",
        steps: [] as { name: string; approverRole: string; required: boolean; autoApprove: boolean; budgetLimit: string }[],
    });

    const loadWorkflows = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/workflows");
            if (res.ok) {
                const data = await res.json();
                setWorkflows(data.workflows || []);
            }
        } catch (e) {
            console.error("Failed to load workflows:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadWorkflows();
    }, []);

    const addStep = () => {
        setFormData({
            ...formData,
            steps: [
                ...formData.steps,
                { name: "", approverRole: "", required: true, autoApprove: false, budgetLimit: "" },
            ],
        });
    };

    const removeStep = (index: number) => {
        setFormData({
            ...formData,
            steps: formData.steps.filter((_, i) => i !== index),
        });
    };

    const updateStep = (index: number, field: string, value: any) => {
        const newSteps = [...formData.steps];
        newSteps[index] = { ...newSteps[index], [field]: value };
        setFormData({ ...formData, steps: newSteps });
    };

    const handleCreate = async () => {
        if (!formData.name || !formData.displayName) {
            show({ title: "Hata", description: "Ad ve görünen ad zorunludur", variant: "error" });
            return;
        }

        try {
            const res = await fetch("/api/workflows", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                show({ title: "Başarılı", description: "İş akışı oluşturuldu", variant: "success" });
                setShowCreate(false);
                setFormData({ name: "", displayName: "", entityType: "Request", steps: [] });
                loadWorkflows();
            } else {
                const data = await res.json();
                show({ title: "Hata", description: data.message || "Oluşturulamadı", variant: "error" });
            }
        } catch (e) {
            show({ title: "Hata", description: "Bağlantı hatası", variant: "error" });
        }
    };

    const handleToggleActive = async (workflow: ApprovalWorkflow) => {
        try {
            const res = await fetch(`/api/workflows/${workflow.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ active: !workflow.active }),
            });

            if (res.ok) {
                show({ title: "Başarılı", description: `İş akışı ${workflow.active ? "pasif" : "aktif"} yapıldı`, variant: "success" });
                loadWorkflows();
            }
        } catch (e) {
            show({ title: "Hata", description: "Güncellenemedi", variant: "error" });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Bu iş akışını silmek istediğinizden emin misiniz?")) return;

        try {
            const res = await fetch(`/api/workflows/${id}`, { method: "DELETE" });
            if (res.ok) {
                show({ title: "Başarılı", description: "İş akışı silindi", variant: "success" });
                loadWorkflows();
            }
        } catch (e) {
            show({ title: "Hata", description: "Silinemedi", variant: "error" });
        }
    };

    if (loading) {
        return (
            <section className="space-y-6">
                <PageHeader title="İş Akışları" description="Onay süreçlerini yönetin" />
                <Skeleton height={300} />
            </section>
        );
    }

    return (
        <section className="space-y-6 max-w-5xl mx-auto">
            <PageHeader
                title="İş Akışları"
                description="Talep, sipariş ve sözleşme onay süreçlerini yapılandırın"
                variant="gradient"
                actions={
                    <Button variant="gradient" onClick={() => setShowCreate(!showCreate)}>
                        {showCreate ? "İptal" : "Yeni İş Akışı"}
                    </Button>
                }
            />

            {/* Create Form */}
            {showCreate && (
                <Card title="Yeni İş Akışı Oluştur" className="p-6">
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Input
                                label="Kod Adı"
                                placeholder="talep_onay"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                description="Benzersiz tanımlayıcı (boşluksuz)"
                            />
                            <Input
                                label="Görünen Ad"
                                placeholder="Talep Onay Akışı"
                                value={formData.displayName}
                                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                            />
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-700">Varlık Türü</label>
                                <select
                                    className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
                                    value={formData.entityType}
                                    onChange={(e) => setFormData({ ...formData, entityType: e.target.value })}
                                >
                                    {ENTITY_TYPES.map((t) => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Steps */}
                        <div className="border-t pt-4 mt-4">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="font-medium text-slate-900">Onay Adımları</h4>
                                <Button variant="outline" size="sm" onClick={addStep}>+ Adım Ekle</Button>
                            </div>

                            {formData.steps.length === 0 ? (
                                <div className="text-center py-8 text-slate-500">
                                    Henüz adım eklenmedi. "Adım Ekle" butonuna tıklayın.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {formData.steps.map((step, index) => (
                                        <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border">
                                            <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold">
                                                {index + 1}
                                            </span>
                                            <Input
                                                className="flex-1"
                                                placeholder="Adım adı"
                                                value={step.name}
                                                onChange={(e) => updateStep(index, "name", e.target.value)}
                                            />
                                            <select
                                                className="h-10 px-3 rounded-lg border border-slate-300 text-sm"
                                                value={step.approverRole}
                                                onChange={(e) => updateStep(index, "approverRole", e.target.value)}
                                            >
                                                <option value="">Onaylayıcı Rol</option>
                                                {APPROVER_ROLES.map((r) => (
                                                    <option key={r.value} value={r.value}>{r.label}</option>
                                                ))}
                                            </select>
                                            <label className="flex items-center gap-2 text-sm">
                                                <input
                                                    type="checkbox"
                                                    checked={step.required}
                                                    onChange={(e) => updateStep(index, "required", e.target.checked)}
                                                    className="rounded"
                                                />
                                                Zorunlu
                                            </label>
                                            <Button variant="secondary" size="sm" onClick={() => removeStep(index)}>
                                                ✕
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button variant="outline" onClick={() => setShowCreate(false)}>İptal</Button>
                            <Button variant="gradient" onClick={handleCreate}>Oluştur</Button>
                        </div>
                    </div>
                </Card>
            )}

            {/* Workflows List */}
            <div className="space-y-4">
                {workflows.length === 0 ? (
                    <Card className="p-8 text-center">
                        <div className="text-slate-500">Henüz iş akışı tanımlanmamış.</div>
                    </Card>
                ) : (
                    workflows.map((workflow) => (
                        <Card key={workflow.id} className="p-0 overflow-hidden">
                            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                                        {workflow.displayName.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-900">{workflow.displayName}</h3>
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <span className="font-mono">{workflow.name}</span>
                                            <span>•</span>
                                            <span>{ENTITY_TYPES.find((t) => t.value === workflow.entityType)?.label || workflow.entityType}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Badge variant={workflow.active ? "success" : "warning"}>
                                        {workflow.active ? "Aktif" : "Pasif"}
                                    </Badge>
                                    <Button variant="outline" size="sm" onClick={() => handleToggleActive(workflow)}>
                                        {workflow.active ? "Pasifleştir" : "Aktifleştir"}
                                    </Button>
                                    <Button variant="secondary" size="sm" onClick={() => handleDelete(workflow.id)}>
                                        Sil
                                    </Button>
                                </div>
                            </div>

                            {/* Steps */}
                            <div className="p-4">
                                {workflow.steps.length === 0 ? (
                                    <div className="text-sm text-slate-500 italic">Adım tanımlanmamış</div>
                                ) : (
                                    <div className="flex items-center gap-2 overflow-x-auto pb-2">
                                        {workflow.steps.map((step, index) => (
                                            <React.Fragment key={step.id}>
                                                <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg">
                                                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                                                        {step.stepOrder}
                                                    </span>
                                                    <div>
                                                        <div className="text-sm font-medium text-slate-800">{step.name}</div>
                                                        <div className="text-xs text-slate-500">
                                                            {APPROVER_ROLES.find((r) => r.value === step.approverRole)?.label || step.approverRole || "Belirtilmemiş"}
                                                        </div>
                                                    </div>
                                                </div>
                                                {index < workflow.steps.length - 1 && (
                                                    <svg className="w-5 h-5 text-slate-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </section>
    );
}
