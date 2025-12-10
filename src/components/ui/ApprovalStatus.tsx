"use client";

import { useState, useEffect } from "react";
import Badge from "./Badge";
import Button from "./Button";
import { useToast } from "./Toast";

type ApprovalStep = {
    stepOrder: number;
    name: string;
    description?: string;
    approverRole?: string;
    required: boolean;
    status: "pending" | "approved" | "rejected" | "skipped";
    approver?: { id: string; username: string; email?: string } | null;
    comment?: string | null;
    processedAt?: string | null;
};

type ApprovalData = {
    hasWorkflow: boolean;
    entityId: string;
    entityType: string;
    workflow?: { id: string; name: string; displayName: string };
    steps: ApprovalStep[];
    currentStep: ApprovalStep | null;
    overallStatus: "pending" | "approved" | "rejected";
    canApprove: boolean;
};

interface ApprovalStatusProps {
    entityType: "Request" | "Order";
    entityId: string;
    onStatusChange?: (status: string) => void;
    compact?: boolean;
}

export default function ApprovalStatus({ entityType, entityId, onStatusChange, compact = false }: ApprovalStatusProps) {
    const { show } = useToast();
    const [data, setData] = useState<ApprovalData | null>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [comment, setComment] = useState("");
    const [showActions, setShowActions] = useState(false);

    const fetchStatus = async () => {
        try {
            const res = await fetch(`/api/approval/${entityType}/${entityId}`);
            if (!res.ok) throw new Error("Failed to fetch");
            const json = await res.json();
            setData(json);
        } catch (e) {
            console.error("Approval status fetch error:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
    }, [entityType, entityId]);

    const handleAction = async (action: "approve" | "reject") => {
        if (!data?.currentStep) return;

        setProcessing(true);
        try {
            const res = await fetch(`/api/approval/${entityType}/${entityId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action,
                    comment: comment.trim() || undefined,
                    stepOrder: data.currentStep.stepOrder
                })
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err?.error || "İşlem başarısız");
            }

            const result = await res.json();
            show({
                title: action === "approve" ? "Onaylandı" : "Reddedildi",
                description: `${data.currentStep.name} ${action === "approve" ? "onaylandı" : "reddedildi"}.`,
                variant: action === "approve" ? "success" : "error"
            });

            setComment("");
            setShowActions(false);
            onStatusChange?.(result.overallStatus);
            fetchStatus();
        } catch (e: any) {
            show({ title: "Hata", description: e?.message || "İşlem başarısız", variant: "error" });
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="animate-pulse bg-slate-100 rounded-lg p-4">
                <div className="h-4 bg-slate-200 rounded w-1/3 mb-2"></div>
                <div className="h-8 bg-slate-200 rounded w-full"></div>
            </div>
        );
    }

    if (!data?.hasWorkflow) {
        return null; // No workflow defined
    }

    const statusColors = {
        pending: "bg-amber-100 text-amber-700 border-amber-200",
        approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
        rejected: "bg-red-100 text-red-700 border-red-200",
        skipped: "bg-slate-100 text-slate-500 border-slate-200"
    };

    const statusIcons = {
        pending: "⏳",
        approved: "✅",
        rejected: "❌",
        skipped: "⏭️"
    };

    if (compact) {
        return (
            <div className="flex items-center gap-2">
                <Badge variant={
                    data.overallStatus === "approved" ? "success" :
                        data.overallStatus === "rejected" ? "error" : "warning"
                }>
                    {data.overallStatus === "approved" ? "Onaylandı" :
                        data.overallStatus === "rejected" ? "Reddedildi" : "Onay Bekliyor"}
                </Badge>
                {data.canApprove && (
                    <Button size="sm" variant="gradient" onClick={() => setShowActions(true)}>
                        Onayla
                    </Button>
                )}
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="font-semibold text-slate-800">Onay Durumu</h3>
                    </div>
                    <Badge variant={
                        data.overallStatus === "approved" ? "success" :
                            data.overallStatus === "rejected" ? "error" : "warning"
                    }>
                        {data.overallStatus === "approved" ? "Tamamlandı" :
                            data.overallStatus === "rejected" ? "Reddedildi" : "Devam Ediyor"}
                    </Badge>
                </div>
            </div>

            {/* Steps Progress */}
            <div className="p-5">
                <div className="flex items-center gap-2 mb-4">
                    {data.steps.map((step, index) => (
                        <div key={step.stepOrder} className="flex items-center">
                            <div className={`
                w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                border-2 transition-all
                ${step.status === "approved" ? "bg-emerald-500 border-emerald-500 text-white" :
                                    step.status === "rejected" ? "bg-red-500 border-red-500 text-white" :
                                        step.status === "pending" && data.currentStep?.stepOrder === step.stepOrder
                                            ? "bg-blue-500 border-blue-500 text-white animate-pulse" :
                                            "bg-slate-100 border-slate-200 text-slate-400"}
              `}>
                                {step.status === "approved" ? "✓" :
                                    step.status === "rejected" ? "✕" : step.stepOrder}
                            </div>
                            {index < data.steps.length - 1 && (
                                <div className={`w-8 h-1 mx-1 rounded-full transition-all ${step.status === "approved" ? "bg-emerald-300" : "bg-slate-200"
                                    }`}></div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Step Details */}
                <div className="space-y-3">
                    {data.steps.map((step) => (
                        <div
                            key={step.stepOrder}
                            className={`p-3 rounded-lg border ${statusColors[step.status]} transition-all ${data.currentStep?.stepOrder === step.stepOrder ? "ring-2 ring-blue-500 ring-offset-1" : ""
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">{statusIcons[step.status]}</span>
                                    <div>
                                        <div className="font-medium text-sm">{step.name}</div>
                                        {step.description && (
                                            <div className="text-xs opacity-75">{step.description}</div>
                                        )}
                                    </div>
                                </div>
                                {step.approver && (
                                    <div className="text-xs text-right">
                                        <div className="font-medium">{step.approver.username}</div>
                                        {step.processedAt && (
                                            <div className="opacity-75">
                                                {new Date(step.processedAt).toLocaleDateString("tr-TR")}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            {step.comment && (
                                <div className="mt-2 pt-2 border-t border-current/10 text-xs italic">
                                    "{step.comment}"
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Actions */}
                {data.canApprove && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                        {!showActions ? (
                            <Button onClick={() => setShowActions(true)} variant="gradient" className="w-full">
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {data.currentStep?.name} - İşlem Yap
                            </Button>
                        ) : (
                            <div className="space-y-3">
                                <textarea
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Yorum (opsiyonel)"
                                    rows={2}
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                />
                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => handleAction("approve")}
                                        variant="primary"
                                        disabled={processing}
                                        className="flex-1 bg-emerald-500 hover:bg-emerald-600"
                                    >
                                        {processing ? "İşleniyor..." : "✓ Onayla"}
                                    </Button>
                                    <Button
                                        onClick={() => handleAction("reject")}
                                        variant="outline"
                                        disabled={processing}
                                        className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                                    >
                                        {processing ? "İşleniyor..." : "✕ Reddet"}
                                    </Button>
                                    <Button
                                        onClick={() => { setShowActions(false); setComment(""); }}
                                        variant="ghost"
                                        disabled={processing}
                                    >
                                        İptal
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
