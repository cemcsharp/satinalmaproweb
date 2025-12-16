"use client";
import React, { useEffect, useState } from "react";
import Modal from "./ui/Modal";
import Badge from "./ui/Badge";

type Revision = {
    id: string;
    requestId: string;
    userId: string;
    user: { username: string; email: string };
    action: string;
    fieldName?: string;
    oldValue?: string;
    newValue?: string;
    comment?: string;
    createdAt: string;
};

interface RevisionHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    requestId: string;
}

export default function RevisionHistoryModal({ isOpen, onClose, requestId }: RevisionHistoryModalProps) {
    const [history, setHistory] = useState<Revision[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && requestId) {
            setLoading(true);
            fetch(`/api/talep/${requestId}/history`)
                .then((res) => res.json())
                .then((data) => {
                    if (Array.isArray(data)) setHistory(data);
                })
                .catch((err) => console.error("History load error:", err))
                .finally(() => setLoading(false));
        }
    }, [isOpen, requestId]);

    const getActionBadge = (action: string) => {
        switch (action) {
            case "create": return <Badge variant="info">Oluşturma</Badge>;
            case "update": return <Badge variant="warning">Güncelleme</Badge>;
            case "status_change": return <Badge variant="purple">Durum Değişimi</Badge>;
            case "approve": return <Badge variant="success">Onay</Badge>;
            case "reject": return <Badge variant="error">Ret</Badge>;
            case "cancel": return <Badge variant="error">İptal</Badge>;
            default: return <Badge variant="default">{action}</Badge>;
        }
    };

    const formatValue = (val?: string | null) => {
        if (val === null || val === undefined) return <span className="text-slate-400">-</span>;
        if (val.length > 50) return <span title={val}>{val.substring(0, 50)}...</span>;
        return val;
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Talep Değişiklik Geçmişi" size="lg">
            <div className="min-h-[300px] max-h-[60vh] overflow-y-auto">
                {loading ? (
                    <div className="flex justify-center p-8 text-slate-400">Yükleniyor...</div>
                ) : history.length === 0 ? (
                    <div className="text-center p-8 text-slate-400">Henüz kayıt yok.</div>
                ) : (
                    <div className="relative border-l border-slate-200 ml-3 space-y-6">
                        {history.map((item) => (
                            <div key={item.id} className="relative pl-6">
                                <div className="absolute -left-1.5 top-1.5 w-3 h-3 bg-slate-200 rounded-full border-2 border-white" />
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                                    <div className="text-sm font-medium text-slate-900">
                                        {item.user?.username || item.userId}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        {new Date(item.createdAt).toLocaleString("tr-TR")}
                                    </div>
                                </div>
                                <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 text-sm">
                                    <div className="flex items-center gap-2 mb-2">
                                        {getActionBadge(item.action)}
                                        {item.fieldName && <span className="font-semibold text-slate-700">{item.fieldName}</span>}
                                    </div>

                                    {(item.oldValue || item.newValue) ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1 bg-white p-2 rounded border border-slate-100">
                                            <div className="text-red-600 line-through text-xs break-all">
                                                {item.oldValue ? item.oldValue : <span className="opacity-50">Yok</span>}
                                            </div>
                                            <div className="text-green-600 text-xs break-all">
                                                {item.newValue ? item.newValue : <span className="opacity-50">Yok</span>}
                                            </div>
                                        </div>
                                    ) : item.comment ? (
                                        <div className="text-slate-600 italic">"{item.comment}"</div>
                                    ) : null}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Modal>
    );
}
