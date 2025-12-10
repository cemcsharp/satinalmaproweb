"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
// dynamic import removed
import PageHeader from "@/components/ui/PageHeader";
import SearchInput from "@/components/ui/SearchInput";
import FilterInput from "@/components/ui/FilterInput";
import Pagination from "@/components/ui/Pagination";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { TableContainer, Table, THead, TBody, TR, TH, TD } from "@/components/ui/Table";
import Badge from "@/components/ui/Badge";
import IconButton from "@/components/ui/IconButton";
import { useToast } from "@/components/ui/Toast";
import Modal from "@/components/ui/Modal";
import Skeleton from "@/components/ui/Skeleton";
import { Contract } from "@/types/sozlesme";
import ExportButtons, { ExportColumn } from "@/components/ui/ExportButtons";
import ImportExcel from "@/components/ui/ImportExcel";

// removed dynamic imports

export default function ContractListPage() {
  const router = useRouter();
  const { show } = useToast();
  const searchParams = useSearchParams();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "number">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [items, setItems] = useState<Contract[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [expiry, setExpiry] = useState<string>("");

  const [dialog, setDialog] = useState<null | { type: "view" | "edit" | "delete"; id: string }>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          setPermissions(data.permissions || []);
          setIsAdmin(data.role === "admin" || data.roleRef?.key === "admin");
        }
      })
      .catch(() => { });
  }, []);

  const canCreate = isAdmin || permissions.includes("sozlesme:create");
  const canEdit = isAdmin || permissions.includes("sozlesme:edit");
  const canDelete = isAdmin || permissions.includes("sozlesme:delete");

  useEffect(() => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    params.set("sortBy", sortBy);
    params.set("sortDir", sortDir);
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    if (expiry) params.set("expiry", expiry);
    setLoading(true);
    setError("");
    fetch(`/api/sozlesme?${params.toString()}`, { credentials: "include", cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          throw new Error(body?.code || `HTTP ${r.status}`);
        }
        return r.json();
      })
      .then((data) => {
        setItems((data?.items || []) as Contract[]);
        setTotal(Number(data?.total || 0));
      })
      .catch((e) => {
        console.error("contracts_list_fetch_failed", e);
        setError("Liste yüklenemedi. Lütfen daha sonra tekrar deneyin.");
        setItems([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [q, status, dateFrom, dateTo, sortBy, sortDir, page, pageSize, expiry]);

  const handleImport = async (data: any[]) => {
    // Bulk create logic would go here.
    show({ title: "Bilgi", description: "Toplu ekleme özelliği henüz backend tarafında aktif değil.", variant: "info" });
    console.log("Imported Data:", data);
  };

  const exportColumns: ExportColumn[] = [
    { header: "No", accessor: "contractNumber" },
    { header: "Konu", accessor: "subject" },
    { header: "Tedarikçi", accessor: (row) => row.supplierName || "-" },
    { header: "Başlangıç", accessor: (row) => row.startDate ? new Date(row.startDate).toLocaleDateString("tr-TR") : "-" },
    { header: "Bitiş", accessor: (row) => row.endDate ? new Date(row.endDate).toLocaleDateString("tr-TR") : "Süresiz" },
    { header: "Durum", accessor: "status" },
  ];

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const statusVariant = (s: string): "default" | "success" | "warning" | "error" | "info" => {
    const v = String(s || "").toLowerCase();
    if (v.includes("aktif")) return "success";
    if (v.includes("taslak")) return "info";
    if (v.includes("askıda")) return "warning";
    if (v.includes("sona erdi") || v.includes("bitti") || v.includes("sonlandı")) return "error";
    return "default";
  };

  const expiryInfo = (c: Contract): { label: string; variant: "default" | "success" | "warning" | "error" | "info" } => {
    const now = new Date();
    const sd = c.startDate ? new Date(c.startDate as any) : null;
    const ed = c.endDate ? new Date(c.endDate as any) : null;
    if (!ed) return { label: "Süresiz", variant: "info" };
    const days = Math.ceil((ed.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    if (days < 0) return { label: "Süresi Dolmuş", variant: "error" };
    if (days <= 30) return { label: `Bitişi Yaklaşıyor (${days} gün)`, variant: "warning" };
    if (sd && sd <= now && ed > now) return { label: "Aktif", variant: "success" };
    return { label: "Planlı", variant: "default" };
  };

  const openView = (id: string) => router.push(`/sozlesme/detay/${id}`);
  const openEdit = (id: string) => router.push(`/sozlesme/duzenle/${id}`);
  const openDelete = (id: string) => setDialog({ type: "delete", id });
  const closeDialog = () => setDialog(null);

  const handleSave = () => {
    // Refetch list
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    params.set("sortBy", sortBy);
    params.set("sortDir", sortDir);
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    if (expiry) params.set("expiry", expiry);
    setLoading(true);
    fetch(`/api/sozlesme?${params.toString()}`, { credentials: "include", cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        setItems((data?.items || []) as Contract[]);
        setTotal(Number(data?.total || 0));
      })
      .finally(() => setLoading(false));
    closeDialog();
  };

  const doDelete = async () => {
    if (!dialog?.id) return;
    try {
      const res = await fetch(`/api/sozlesme/${dialog.id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      closeDialog();
      // Refetch list
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (status) params.set("status", status);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      params.set("sortBy", sortBy);
      params.set("sortDir", sortDir);
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));
      if (expiry) params.set("expiry", expiry);
      const data = await fetch(`/api/sozlesme?${params.toString()}`, { credentials: "include", cache: "no-store" }).then((r) => r.json());
      setItems((data?.items || []) as Contract[]);
      setTotal(Number(data?.total || 0));
      show({ title: "Sözleşme arşive taşındı", description: "İşlem başarılı", variant: "success" });
    } catch (e) {
      show({ title: "Hata", description: "Sözleşme silinemedi", variant: "error" });
    }
  };

  return (
    <section className="space-y-4">
      <PageHeader
        title="Sözleşme Listesi"
        description="Şirket genelindeki sözleşmeleri takip edin."
        variant="default"
        actions={
          <div className="flex gap-2">
            <ImportExcel onDataReady={handleImport} />
            <ExportButtons
              data={items}
              columns={exportColumns}
              fileName={`sozlesme-listesi-${new Date().toISOString().split("T")[0]}`}
              title="Sözleşme Listesi"
            />
            {canCreate && (
              <Button onClick={() => router.push("/sozlesme/olustur")} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20">
                <span className="text-lg font-light leading-none">+</span>
                Yeni Oluştur
              </Button>
            )}
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Filtreler:</span>
        {q && (
          <button className="rounded-full bg-muted px-2 py-0.5 text-xs" onClick={() => { setQ(""); setPage(1); }} aria-label="Arama filtresini temizle">q: {q} ✕</button>
        )}
        {status && (
          <button className="rounded-full bg-muted px-2 py-0.5 text-xs" onClick={() => { setStatus(""); setPage(1); }} aria-label="Durum filtresini temizle">status: {status} ✕</button>
        )}
        {(dateFrom || dateTo) && (
          <button className="rounded-full bg-muted px-2 py-0.5 text-xs" onClick={() => { setDateFrom(""); setDateTo(""); setPage(1); }} aria-label="Tarih filtresini temizle">tarih: {dateFrom || "?"} → {dateTo || "?"} ✕</button>
        )}
        <Button className="ml-auto" variant="outline" size="sm" onClick={() => setFiltersOpen((v) => !v)} aria-expanded={filtersOpen} aria-controls="filters-panel">
          {filtersOpen ? "Filtreleri Gizle" : "Filtreleri Göster"}
        </Button>
        <Button variant="outline" size="sm" onClick={() => { setQ(""); setStatus(""); setDateFrom(""); setDateTo(""); setPage(1); }}>Temizle</Button>
      </div>

      <div id="filters-panel" className={filtersOpen ? "grid grid-cols-1 gap-1 md:grid-cols-3 lg:grid-cols-6" : "hidden"}>
        <SearchInput
          placeholder="Ara (no/başlık)"
          defaultValue={q}
          onSearch={(val) => { setQ(val); setPage(1); }}
        />
        <Select size="sm" value={status} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatus(e.target.value)}>
          <option value="">Durum (tümü)</option>
          <option value="Taslak">Taslak</option>
          <option value="Aktif">Aktif</option>
          <option value="Askıda">Askıda</option>
          <option value="Sona Erdi">Sona Erdi</option>
        </Select>
        <FilterInput type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        <FilterInput type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        <Select size="sm" value={expiry} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setExpiry(e.target.value); setPage(1); }}>
          <option value="">Sonlanma (tümü)</option>
          <option value="active">Aktif</option>
          <option value="expiring">Bitişi Yaklaşan (30g)</option>
          <option value="expired">Süresi Dolmuş</option>
          <option value="perpetual">Süresiz</option>
        </Select>
        <Select size="sm" value={sortBy} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSortBy((e.target.value === "number" ? "number" : "date"))}>
          <option value="date">Tarih</option>
          <option value="number">Numara</option>
        </Select>
        <Select size="sm" value={sortDir} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSortDir((e.target.value === "asc" ? "asc" : "desc"))}>
          <option value="asc">Artan</option>
          <option value="desc">Azalan</option>
        </Select>
        <Select size="sm" value={String(pageSize)} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}>
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="50">50</option>
          <option value="100">100</option>
        </Select>
      </div>

      <TableContainer>
        <Table>
          <THead>
            <TR>
              <TH>No</TH>
              <TH>Başlık</TH>
              <TH>Durum</TH>
              <TH>Sonlanma</TH>
              <TH>Oluşturma</TH>
              <TH className="w-[1%] whitespace-nowrap text-right">İşlemler</TH>
            </TR>
          </THead>
          <TBody>
            {loading && (
              Array.from({ length: 5 }).map((_, i) => (
                <TR key={`skeleton-${i}`}>
                  <TD><Skeleton height={16} /></TD>
                  <TD><Skeleton height={16} /></TD>
                  <TD><Skeleton height={16} /></TD>
                  <TD><Skeleton height={16} /></TD>
                  <TD><Skeleton height={16} /></TD>
                </TR>
              ))
            )}
            {!loading && error && (
              <TR><TD colSpan={6} className="text-red-600">{error}</TD></TR>
            )}
            {!loading && !error && items.length === 0 && (
              <TR><TD colSpan={6}>Kayıt yok</TD></TR>
            )}
            {!loading && items.map((c) => (
              <TR key={c.id} className="group hover:shadow-sm transition-shadow">
                <TD>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/10 to-indigo-500/10 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <span className="font-semibold text-slate-700">{c.number}</span>
                  </div>
                </TD>
                <TD>
                  <div className="flex items-center gap-2 max-w-xs">
                    <span className="text-sm text-slate-700 truncate font-medium">{c.title}</span>
                  </div>
                </TD>
                <TD>
                  <Badge variant={statusVariant(c.status)} className="shadow-sm font-medium">
                    {c.status}
                  </Badge>
                </TD>
                <TD>
                  {(() => { const info = expiryInfo(c); return (<Badge variant={info.variant}>{info.label}</Badge>); })()}
                </TD>
                <TD>{new Date(c.createdAt).toLocaleDateString()}</TD>
                <TD className="text-right">
                  <div className="inline-flex items-center gap-1 sm:gap-2">
                    <IconButton icon="eye" label="Görüntüle" size="sm" title="Sözleşmeyi görüntüle" onClick={() => openView(c.id)} />
                    {canEdit && (
                      <IconButton icon="edit" label="Düzenle" size="sm" title="Sözleşmeyi düzenle" onClick={() => openEdit(c.id)} />
                    )}
                    <IconButton icon="clipboard" label="İncele" size="sm" title="Sözleşmeyi incele ve rapor oluştur" onClick={() => router.push(`/sozlesme/incele/${c.id}`)} />
                    {canDelete && (
                      <IconButton icon="trash" label="Sil" size="sm" tone="danger" title="Sözleşmeyi arşive taşı" onClick={() => openDelete(c.id)} />
                    )}
                  </div>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </TableContainer>

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        pageSize={pageSize}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
        totalItems={total}
      />

      <Modal
        isOpen={!!dialog && !!dialog.id}
        onClose={closeDialog}
        title={dialog?.type === "view" ? "Sözleşme Detayı" : dialog?.type === "edit" ? "Sözleşmeyi Güncelle" : dialog?.type === "delete" ? "Sözleşmeyi Arşivle" : undefined}
        size={dialog?.type === "view" || dialog?.type === "edit" ? "md" : "sm"}
        footer={
          dialog?.type === "delete" ? (
            <>
              <Button variant="outline" size="sm" onClick={closeDialog}>Vazgeç</Button>
              <Button size="sm" className="bg-error border-error text-error-foreground hover:brightness-95" onClick={doDelete}>Arşive Taşı</Button>
            </>
          ) : undefined
        }
      >
        {/* Modal Content - only for delete */}
        {dialog?.type === "delete" && (
          <div className="text-sm">
            <p>Bu kaydı arşive taşıyacağınızdan emin misiniz?</p>
          </div>
        )}
      </Modal>
    </section>
  );
}