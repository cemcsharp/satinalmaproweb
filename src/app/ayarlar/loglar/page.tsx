"use client";
import { useEffect, useState, useCallback } from "react";
import { useApiRequest } from "@/hooks/useApiRequest";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import { TableContainer, Table, THead, TBody, TR, TH, TD } from "@/components/ui/Table";
import { useToast } from "@/components/ui/Toast";
import Pagination from "@/components/ui/Pagination";

type AuditLogEntry = {
    id: string;
    userId: string | null;
    user: { id: string; username: string; email: string | null } | null;
    action: string;
    entityType: string;
    entityId: string | null;
    oldData: any;
    newData: any;
    ipAddress: string | null;
    createdAt: string;
};

const ACTION_COLORS: Record<string, "success" | "error" | "warning" | "info" | "default"> = {
    CREATE: "success",
    UPDATE: "info",
    DELETE: "error",
    LOGIN: "success",
    LOGOUT: "warning",
    APPROVE: "success",
    REJECT: "error",
    VIEW: "default",
    EXPORT: "info",
};

const ACTION_LABELS: Record<string, string> = {
    CREATE: "Oluşturma",
    UPDATE: "Güncelleme",
    DELETE: "Silme",
    LOGIN: "Giriş",
    LOGOUT: "Çıkış",
    APPROVE: "Onay",
    REJECT: "Red",
    VIEW: "Görüntüleme",
    EXPORT: "Dışa Aktarma",
};

export default function AuditLogPage() {
    const router = useRouter();
    const { show } = useToast();
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filterAction, setFilterAction] = useState("");
    const [filterEntity, setFilterEntity] = useState("");

    // API request hook
    const { execute, loading } = useApiRequest<{ items: AuditLogEntry[], pagination: { totalPages: number } }>();

    const load = useCallback(() => {
        const params = new URLSearchParams({ page: String(page), limit: "30" });
        if (filterAction) params.set("action", filterAction);
        if (filterEntity) params.set("entityType", filterEntity);

        execute({
            url: `/api/audit?${params}`,
            onSuccess: (data) => {
                setLogs(data.items || []);
                setTotalPages(data.pagination?.totalPages || 1);
            },
            showErrorToast: true,
            successMessage: undefined // Opsiyonel, sadece hata göster
        });
    }, [page, filterAction, filterEntity, execute]);

    useEffect(() => { load(); }, [load]);

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString("tr-TR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <PageHeader
                title="Sistem Logları"
                description="Kullanıcı işlemlerini ve sistem olaylarını görüntüleyin"
                actions={
                    <Button variant="outline" onClick={() => router.push("/ayarlar")}>
                        ← Geri
                    </Button>
                }
            />

            {/* Filters */}
            <Card className="flex flex-wrap gap-4 items-end">
                <div className="w-48">
                    <Select
                        label="İşlem Tipi"
                        value={filterAction}
                        onChange={(e) => { setFilterAction(e.target.value); setPage(1); }}
                    >
                        <option value="">Tümü</option>
                        {Object.entries(ACTION_LABELS).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                    </Select>
                </div>
                <div className="w-48">
                    <Select
                        label="Varlık Tipi"
                        value={filterEntity}
                        onChange={(e) => { setFilterEntity(e.target.value); setPage(1); }}
                    >
                        <option value="">Tümü</option>
                        <option value="User">Kullanıcı</option>
                        <option value="Role">Rol</option>
                        <option value="Request">Talep</option>
                        <option value="Order">Sipariş</option>
                        <option value="Delivery">Teslimat</option>
                        <option value="Invoice">Fatura</option>
                        <option value="Contract">Sözleşme</option>
                        <option value="Session">Oturum</option>
                    </Select>
                </div>
                <Button variant="outline" onClick={() => { setFilterAction(""); setFilterEntity(""); setPage(1); }}>
                    Filtreleri Temizle
                </Button>
            </Card>

            {/* Table */}
            <Card className="p-0 overflow-hidden">
                <TableContainer>
                    <Table>
                        <THead>
                            <TR>
                                <TH>Tarih</TH>
                                <TH>Kullanıcı</TH>
                                <TH>İşlem</TH>
                                <TH>Varlık</TH>
                                <TH>IP Adresi</TH>
                            </TR>
                        </THead>
                        <TBody>
                            {loading ? (
                                <TR><TD colSpan={5} className="text-center py-8 text-slate-500">Yükleniyor...</TD></TR>
                            ) : logs.length === 0 ? (
                                <TR><TD colSpan={5} className="text-center py-8 text-slate-500">Kayıt bulunamadı</TD></TR>
                            ) : (
                                logs.map((log) => (
                                    <TR key={log.id}>
                                        <TD className="text-sm text-slate-600">{formatDate(log.createdAt)}</TD>
                                        <TD>
                                            {log.user ? (
                                                <span className="font-medium text-slate-700">{log.user.username}</span>
                                            ) : (
                                                <span className="text-slate-400 italic">Sistem</span>
                                            )}
                                        </TD>
                                        <TD>
                                            <Badge variant={ACTION_COLORS[log.action] || "default"}>
                                                {ACTION_LABELS[log.action] || log.action}
                                            </Badge>
                                        </TD>
                                        <TD>
                                            <span className="text-sm">
                                                {log.entityType}
                                                {log.entityId && (
                                                    <span className="text-slate-400 ml-1">#{log.entityId.slice(-6)}</span>
                                                )}
                                            </span>
                                        </TD>
                                        <TD className="text-sm text-slate-500 font-mono">{log.ipAddress || "-"}</TD>
                                    </TR>
                                ))
                            )}
                        </TBody>
                    </Table>
                </TableContainer>
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
                <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                />
            )}
        </div>
    );
}
