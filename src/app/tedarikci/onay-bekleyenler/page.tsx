"use client";
import { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

type PendingSupplier = {
    id: string;
    name: string;
    email: string;
    phone: string;
    taxId: string;
    taxOffice: string;
    address: string;
    contactName: string;
    registrationStatus: string;
    createdAt: string;
    mersisNo: string;
    commercialRegistrationNo: string;
    bankName: string;
    bankBranch: string;
    bankIban: string;
    bankAccountNo: string;
    bankCurrency: string;
    category: { name: string } | null;
    users: { id: string; name: string; email: string }[];
};

export default function PendingApprovalsPage() {
    const [suppliers, setSuppliers] = useState<PendingSupplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [filter, setFilter] = useState<"pending" | "approved" | "rejected">("pending");

    const fetchSuppliers = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/admin/suppliers/pending?status=${filter}`);
            if (res.ok) {
                const data = await res.json();
                setSuppliers(data);
            } else {
                const data = await res.json();
                setError(data.error || "Liste yüklenirken bir hata oluştu");
            }
        } catch (error) {
            console.error("Fetch error:", error);
            setError("Sunucuya bağlanılamadı");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSuppliers();
    }, [filter]);

    const handleApprove = async (id: string) => {
        if (!confirm("Bu tedarikçiyi onaylamak istediğinize emin misiniz?")) return;

        setActionLoading(id);
        try {
            const res = await fetch(`/api/admin/suppliers/${id}/approve`, {
                method: "PUT",
            });
            if (res.ok) {
                fetchSuppliers();
            } else {
                const data = await res.json();
                alert(data.error || "Onay sırasında hata oluştu");
            }
        } catch {
            alert("Bir hata oluştu");
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (id: string) => {
        const reason = prompt("Red nedeni (opsiyonel):");
        if (reason === null) return; // cancelled

        setActionLoading(id);
        try {
            const res = await fetch(`/api/admin/suppliers/${id}/reject`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reason }),
            });
            if (res.ok) {
                fetchSuppliers();
            } else {
                const data = await res.json();
                alert(data.error || "Red sırasında hata oluştu");
            }
        } catch {
            alert("Bir hata oluştu");
        } finally {
            setActionLoading(null);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("tr-TR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            pending: "bg-sky-100 text-amber-700",
            approved: "bg-sky-100 text-blue-700",
            rejected: "bg-red-100 text-red-700",
        };
        const labels: Record<string, string> = {
            pending: "Bekliyor",
            approved: "Onaylı",
            rejected: "Reddedildi",
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-bold ${styles[status] || "bg-slate-100 text-slate-600"}`}>
                {labels[status] || status}
            </span>
        );
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Tedarikçi Kayıt Onayları</h1>
                <p className="text-sm text-slate-500 mt-1">
                    Bekleyen tedarikçi kayıt taleplerini inceleyin ve onaylayın
                </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6">
                {[
                    { key: "pending", label: "Bekleyenler", icon: "⏳" },
                    { key: "approved", label: "Onaylananlar", icon: "✅" },
                    { key: "rejected", label: "Reddedilenler", icon: "❌" },
                ].map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setFilter(tab.key as typeof filter)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${filter === tab.key
                            ? "bg-blue-600 text-white shadow-lg"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            {loading ? (
                <div className="text-center py-12 text-slate-500">Yükleniyor...</div>
            ) : suppliers.length === 0 ? (
                <Card className="p-12 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <p className="text-slate-500">
                        {filter === "pending" && "Bekleyen kayıt talebi bulunmuyor"}
                        {filter === "approved" && "Henüz onaylanan tedarikçi yok"}
                        {filter === "rejected" && "Reddedilen kayıt bulunmuyor"}
                    </p>
                </Card>
            ) : (
                <div className="space-y-4">
                    {suppliers.map((supplier) => (
                        <Card key={supplier.id} className="p-6">
                            <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                                {/* Info */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        <h3 className="text-lg font-bold text-slate-900">{supplier.name}</h3>
                                        {getStatusBadge(supplier.registrationStatus)}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
                                        <div>
                                            <p className="text-slate-500 mb-1 font-medium">Yetkili / Kategori</p>
                                            <p className="text-slate-900 font-semibold">{supplier.contactName}</p>
                                            <p className="text-blue-600 text-xs font-bold mt-1 bg-sky-50 px-2 py-0.5 rounded-full inline-block">
                                                {supplier.category?.name || "Kategori Belirtilmemiş"}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-slate-500 mb-1 font-medium">İletişim</p>
                                            <p className="text-slate-900">{supplier.email}</p>
                                            <p className="text-slate-600">{supplier.phone || "-"}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-500 mb-1 font-medium">Vergi / Sicil</p>
                                            <p className="text-slate-900 font-semibold">
                                                {supplier.taxId || "-"} / {supplier.taxOffice || "-"}
                                            </p>
                                            <div className="flex gap-2 mt-1">
                                                {supplier.mersisNo && <span className="text-[10px] bg-slate-100 px-1.5 rounded border border-slate-200" title="MERSİS">M: {supplier.mersisNo}</span>}
                                                {supplier.commercialRegistrationNo && <span className="text-[10px] bg-slate-100 px-1.5 rounded border border-slate-200" title="Ticaret Sicil No">S: {supplier.commercialRegistrationNo}</span>}
                                            </div>
                                        </div>
                                        <div className="md:col-span-2 lg:col-span-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                            <p className="text-slate-500 mb-2 font-bold text-[11px] uppercase tracking-wider">Banka ve Ödeme Bilgileri</p>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="col-span-1 md:col-span-2">
                                                    <p className="text-xs text-slate-500">IBAN</p>
                                                    <p className="text-sm font-mono font-bold text-indigo-700">{supplier.bankIban || "Belirtilmemiş"}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-500">Para Birimi</p>
                                                    <p className="text-sm font-bold text-slate-900">{supplier.bankCurrency}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-500">Banka / Şube</p>
                                                    <p className="text-sm text-slate-700">{supplier.bankName || "-"} / {supplier.bankBranch || "-"}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-500">Hesap No</p>
                                                    <p className="text-sm text-slate-700">{supplier.bankAccountNo || "-"}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="md:col-span-2 lg:col-span-3">
                                            <p className="text-slate-500 mb-1">Adres</p>
                                            <p className="text-slate-800 font-medium italic">&quot;{supplier.address || "-"}&quot;</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
                                        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <p className="text-xs text-slate-400">
                                            Kayıt Tarihi: {formatDate(supplier.createdAt)}
                                        </p>
                                    </div>
                                </div>

                                {/* Actions */}
                                {filter === "pending" && (
                                    <div className="flex gap-2 lg:flex-col">
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            loading={actionLoading === supplier.id}
                                            onClick={() => handleApprove(supplier.id)}
                                            className="bg-sky-600 hover:bg-sky-700"
                                        >
                                            ✓ Onayla
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            loading={actionLoading === supplier.id}
                                            onClick={() => handleReject(supplier.id)}
                                            className="text-red-600 border-red-200 hover:bg-red-50"
                                        >
                                            ✕ Reddet
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
