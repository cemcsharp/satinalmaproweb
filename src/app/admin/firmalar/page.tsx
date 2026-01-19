"use client";
import { useState, useEffect, useCallback } from "react";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Table, THead, TBody, TR, TH, TD, TableContainer } from "@/components/ui/Table";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

interface Company {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    taxId: string | null;
    isActive: boolean;
    plan: string;
    planExpiresAt: string | null;
    _count: {
        orders: number;
    };
}

export default function AdminCompaniesPage() {
    const { show } = useToast();
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [updateLoading, setUpdateLoading] = useState(false);

    // Modal states
    const [planModalOpen, setPlanModalOpen] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

    // Selection states
    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
    const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);

    // Edit states for plan
    const [editPlan, setEditPlan] = useState("free");
    const [editExpiry, setEditExpiry] = useState("");

    const fetchCompanies = useCallback(async () => {
        try {
            const res = await fetch("/api/admin/companies");
            const data = await res.json();
            setCompanies(data.companies || []);
        } catch (error) {
            console.error(error);
            show({ title: "Hata", description: "Firma listesi alınamadı.", variant: "error" });
        } finally {
            setLoading(false);
        }
    }, [show]);

    useEffect(() => {
        fetchCompanies();
    }, [fetchCompanies]);

    const handleToggleActive = async (id: string) => {
        setActionLoading(id);
        try {
            const res = await fetch(`/api/admin/companies/${id}/toggle-active`, {
                method: "POST"
            });
            if (res.ok) {
                show({ title: "Başarılı", description: "Firma durumu güncellendi", variant: "success" });
                fetchCompanies();
            } else {
                show({ title: "Hata", description: "İşlem başarısız", variant: "error" });
            }
        } catch (error) {
            console.error(error);
            show({ title: "Hata", description: "Bir hata oluştu", variant: "error" });
        } finally {
            setActionLoading(null);
        }
    };

    const handleUpdatePlan = async () => {
        if (!selectedCompany) return;
        setUpdateLoading(true);
        try {
            const res = await fetch(`/api/admin/companies/${selectedCompany.id}/plan`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    plan: editPlan,
                    planExpiresAt: editExpiry || null
                })
            });
            if (res.ok) {
                show({ title: "Başarılı", description: "Paket güncellendi", variant: "success" });
                setPlanModalOpen(false);
                fetchCompanies();
            } else {
                show({ title: "Hata", description: "Güncelleme başarısız", variant: "error" });
            }
        } catch (error) {
            console.error(error);
            show({ title: "Hata", description: "Bir hata oluştu", variant: "error" });
        } finally {
            setUpdateLoading(false);
        }
    };

    const handleDeleteCompany = async () => {
        if (!companyToDelete) return;
        setUpdateLoading(true);
        try {
            const res = await fetch(`/api/admin/companies/${companyToDelete.id}`, {
                method: "DELETE"
            });
            if (res.ok) {
                setDeleteConfirmOpen(false);
                setCompanyToDelete(null);
                show({ title: "Başarılı", description: "Firma başarıyla silindi", variant: "success" });
                fetchCompanies();
            } else {
                const data = await res.json();
                show({ title: "Hata", description: data.message || "Silme işlemi başarısız", variant: "error" });
            }
        } catch (error) {
            console.error("Failed to delete company:", error);
            show({ title: "Hata", description: "Bir hata oluştu", variant: "error" });
        } finally {
            setUpdateLoading(false);
        }
    };

    const openPlanModal = (company: Company) => {
        setSelectedCompany(company);
        setEditPlan(company.plan || "free");
        setEditExpiry(company.planExpiresAt ? new Date(company.planExpiresAt).toISOString().split('T')[0] : "");
        setPlanModalOpen(true);
    };

    const getRemainingDays = (expiry: string | null) => {
        if (!expiry) return null;
        const diff = new Date(expiry).getTime() - new Date().getTime();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        return days;
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Alıcı Firmalar"
                description="Platformdaki alıcı firmaları ve abonelik durumlarını yönetin"
            />

            <Card className="p-0 overflow-hidden">
                <TableContainer>
                    <Table>
                        <THead>
                            <TR>
                                <TH>Firma Adı</TH>
                                <TH>E-posta</TH>
                                <TH>Paket</TH>
                                <TH>Bitiş Tarihi</TH>
                                <TH>Durum</TH>
                                <TH className="text-right">İşlemler</TH>
                            </TR>
                        </THead>
                        <TBody>
                            {loading ? (
                                <TR>
                                    <TD colSpan={6} className="text-center py-8">
                                        <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                                    </TD>
                                </TR>
                            ) : companies.length === 0 ? (
                                <TR>
                                    <TD colSpan={6} className="text-center py-8 text-slate-400">
                                        Henüz kayıtlı firma bulunmuyor.
                                    </TD>
                                </TR>
                            ) : (
                                companies.map((company) => {
                                    const days = getRemainingDays(company.planExpiresAt);
                                    return (
                                        <TR key={company.id}>
                                            <TD className="font-medium">
                                                <div>{company.name}</div>
                                                <div className="text-xs text-slate-400 font-mono">{company.taxId || "-"}</div>
                                            </TD>
                                            <TD>{company.email || "-"}</TD>
                                            <TD>
                                                <Badge variant={company.plan === 'pro' ? 'success' : 'default'} className="uppercase">
                                                    {company.plan}
                                                </Badge>
                                            </TD>
                                            <TD>
                                                {company.planExpiresAt ? (
                                                    <div className="space-y-1">
                                                        <div className="text-sm">{new Date(company.planExpiresAt).toLocaleDateString('tr-TR')}</div>
                                                        {days !== null && (
                                                            <div className={`text-xs font-medium ${days < 0 ? 'text-red-500' : days < 30 ? 'text-amber-500' : 'text-slate-400'}`}>
                                                                {days < 0 ? 'Süresi Doldu' : `${days} gün kaldı`}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : "-"}
                                            </TD>
                                            <TD>
                                                <Badge variant={company.isActive ? "success" : "error"}>
                                                    {company.isActive ? "Aktif" : "Pasif"}
                                                </Badge>
                                            </TD>
                                            <TD className="text-right">
                                                <div className="flex gap-2 justify-end">
                                                    <Button size="sm" variant="outline" onClick={() => openPlanModal(company)}>
                                                        Yönet
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleToggleActive(company.id)}
                                                        loading={actionLoading === company.id}
                                                        className={company.isActive ? "text-red-600 border-red-200 hover:bg-red-50" : "text-emerald-600 border-emerald-200 hover:bg-emerald-50"}
                                                    >
                                                        {company.isActive ? "Pasif Yap" : "Aktif Yap"}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => {
                                                            setCompanyToDelete(company);
                                                            setDeleteConfirmOpen(true);
                                                        }}
                                                        className="text-red-600 border-red-200 hover:bg-red-50"
                                                    >
                                                        Sil
                                                    </Button>
                                                </div>
                                            </TD>
                                        </TR>
                                    );
                                })
                            )}
                        </TBody>
                    </Table>
                </TableContainer>
            </Card>

            {/* Management Modal */}
            <Modal
                isOpen={planModalOpen}
                onClose={() => setPlanModalOpen(false)}
                title="Firma Yönetimi"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Firma Adı</label>
                        <div className="p-2 bg-slate-50 rounded border border-slate-100 text-slate-600">{selectedCompany?.name}</div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Paket Tipi</label>
                        <select
                            className="w-full p-2 border rounded-md"
                            value={editPlan}
                            onChange={(e) => setEditPlan(e.target.value)}
                        >
                            <option value="free">Free</option>
                            <option value="starter">Starter</option>
                            <option value="pro">Pro</option>
                            <option value="enterprise">Enterprise</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Bitiş Tarihi</label>
                        <input
                            type="date"
                            className="w-full p-2 border rounded-md"
                            value={editExpiry}
                            onChange={(e) => setEditExpiry(e.target.value)}
                        />
                        <p className="text-xs text-slate-400 mt-1 italic">Sınırsız paket için boş bırakın.</p>
                    </div>

                    <div className="flex gap-3 pt-4 border-t mt-6">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => setPlanModalOpen(false)}
                        >
                            İptal
                        </Button>
                        <Button
                            variant="primary"
                            className="flex-1"
                            onClick={handleUpdatePlan}
                            loading={updateLoading}
                        >
                            Kaydet
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={deleteConfirmOpen}
                onClose={() => setDeleteConfirmOpen(false)}
                title="Firmayı Sil"
            >
                <div className="space-y-4">
                    <p className="text-slate-600">
                        <span className="font-bold text-slate-900">{companyToDelete?.name}</span> adlı firmayı ve bağlı olan tüm kullanıcı hesaplarını silmek istediğinize emin misiniz?
                    </p>
                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-800 text-sm">
                        ⚠️ Bu işlem geri alınamaz. Eğer firmanın aktif sipariş veya ihale kayıtları varsa silme işlemi engellenecektir.
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
                            İptal
                        </Button>
                        <Button
                            variant="primary"
                            className="bg-red-600 hover:bg-red-700 text-white"
                            onClick={handleDeleteCompany}
                            loading={updateLoading}
                        >
                            Sil Onayla
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
