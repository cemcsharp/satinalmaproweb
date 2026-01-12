"use client";
import { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Table, THead, TBody, TR, TH, TD, TableContainer } from "@/components/ui/Table";

interface Supplier {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    contactName: string | null;
    registrationStatus: string;
    registrationSource: string | null;
    createdAt: string;
    category: { name: string } | null;
}

export default function AdminSuppliersPage() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchSuppliers = async () => {
        try {
            const res = await fetch(`/api/admin/suppliers?status=${filter}`);
            const data = await res.json();
            setSuppliers(data.suppliers || []);
        } catch (error) {
            console.error("Failed to fetch suppliers:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSuppliers();
    }, [filter]);

    const handleAction = async (supplierId: string, action: "approve" | "reject") => {
        setActionLoading(supplierId);
        try {
            const res = await fetch(`/api/admin/suppliers/${supplierId}/${action}`, {
                method: "POST"
            });
            if (res.ok) {
                fetchSuppliers();
            }
        } catch (error) {
            console.error(`Failed to ${action} supplier:`, error);
        } finally {
            setActionLoading(null);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "pending": return <Badge variant="warning">Beklemede</Badge>;
            case "approved": return <Badge variant="success">Onaylı</Badge>;
            case "rejected": return <Badge variant="error">Reddedildi</Badge>;
            default: return <Badge variant="default">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Tedarikçi Yönetimi"
                description="Kayıtlı tedarikçileri görüntüleyin ve yönetin"
            />

            {/* Filters */}
            <div className="flex gap-2">
                {[
                    { key: "pending", label: "Bekleyenler" },
                    { key: "approved", label: "Onaylananlar" },
                    { key: "rejected", label: "Reddedilenler" },
                    { key: "all", label: "Tümü" }
                ].map((f) => (
                    <button
                        key={f.key}
                        onClick={() => setFilter(f.key as any)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f.key
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            <Card className="p-0 overflow-hidden">
                <TableContainer>
                    <Table>
                        <THead>
                            <TR>
                                <TH>Firma Adı</TH>
                                <TH>Yetkili</TH>
                                <TH>E-posta</TH>
                                <TH>Kategori</TH>
                                <TH>Kayıt Tarihi</TH>
                                <TH>Durum</TH>
                                <TH className="text-right">İşlemler</TH>
                            </TR>
                        </THead>
                        <TBody>
                            {loading ? (
                                <TR>
                                    <TD colSpan={7} className="text-center py-8">
                                        <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                                    </TD>
                                </TR>
                            ) : suppliers.length === 0 ? (
                                <TR>
                                    <TD colSpan={7} className="text-center py-8 text-slate-400">
                                        Bu kategoride tedarikçi bulunamadı.
                                    </TD>
                                </TR>
                            ) : (
                                suppliers.map((supplier) => (
                                    <TR key={supplier.id}>
                                        <TD className="font-medium">{supplier.name}</TD>
                                        <TD>{supplier.contactName || "-"}</TD>
                                        <TD>{supplier.email || "-"}</TD>
                                        <TD>
                                            {supplier.category ? (
                                                <Badge variant="default">{supplier.category.name}</Badge>
                                            ) : "-"}
                                        </TD>
                                        <TD>
                                            {new Date(supplier.createdAt).toLocaleDateString("tr-TR")}
                                        </TD>
                                        <TD>{getStatusBadge(supplier.registrationStatus)}</TD>
                                        <TD className="text-right">
                                            {supplier.registrationStatus === "pending" && (
                                                <div className="flex gap-2 justify-end">
                                                    <Button
                                                        size="sm"
                                                        variant="primary"
                                                        onClick={() => handleAction(supplier.id, "approve")}
                                                        loading={actionLoading === supplier.id}
                                                        className="bg-emerald-600 hover:bg-emerald-700"
                                                    >
                                                        Onayla
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleAction(supplier.id, "reject")}
                                                        loading={actionLoading === supplier.id}
                                                        className="text-red-600 border-red-200 hover:bg-red-50"
                                                    >
                                                        Reddet
                                                    </Button>
                                                </div>
                                            )}
                                            {supplier.registrationStatus !== "pending" && (
                                                <span className="text-slate-400 text-sm">-</span>
                                            )}
                                        </TD>
                                    </TR>
                                ))
                            )}
                        </TBody>
                    </Table>
                </TableContainer>
            </Card>
        </div>
    );
}
