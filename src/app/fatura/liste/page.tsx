"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
// dynamic import removed
import IconButton from "@/components/ui/IconButton";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import PageHeader from "@/components/ui/PageHeader";
import SearchInput from "@/components/ui/SearchInput";
import FilterInput from "@/components/ui/FilterInput";
import Pagination from "@/components/ui/Pagination";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { TableContainer, Table, THead, TBody, TR, TH, TD } from "@/components/ui/Table";
import Badge from "@/components/ui/Badge";
import Skeleton from "@/components/ui/Skeleton";
import { Invoice } from "@/types/fatura";
import ExportButtons, { ExportColumn } from "@/components/ui/ExportButtons";
import ImportExcel from "@/components/ui/ImportExcel";

// removed dynamic imports

function InvoiceListContent() {
  const { show } = useToast();
  const params = useSearchParams();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [items, setItems] = useState<Invoice[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState<null | { type: "view" | "edit" | "delete"; item: Invoice | null }>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [dueOnly, setDueOnly] = useState(false);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  // Fetch permissions
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

  const canCreate = isAdmin || permissions.includes("fatura:create");
  const canEdit = isAdmin || permissions.includes("fatura:edit");
  const canDelete = isAdmin || permissions.includes("fatura:delete");

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
    if (dueOnly) params.set("dueOnly", "1");
    setLoading(true);
    fetch(`/api/fatura?${params.toString()}`, { credentials: "include", cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        setItems((data?.items || []) as Invoice[]);
        setTotal(Number(data?.total || 0));
      })
      .finally(() => setLoading(false));
  }, [q, status, dateFrom, dateTo, sortBy, sortDir, page, pageSize, dueOnly]);

  const handleImport = async (data: any[]) => {
    // Bulk create logic would go here.
    show({ title: "Bilgi", description: "Toplu ekleme özelliği henüz backend tarafında aktif değil.", variant: "info" });
  };

  const exportColumns: ExportColumn[] = [
    { header: "Fatura No", accessor: "number" },
    { header: "Firma", accessor: (row) => row.companyName || "-" },
    { header: "Tedarikçi", accessor: (row) => row.supplierName || "-" },
    { header: "Tarih", accessor: (row) => row.date ? new Date(row.date).toLocaleDateString("tr-TR") : "-" },
    { header: "Tutar", accessor: (row) => typeof row.amount === 'number' ? row.amount.toLocaleString("tr-TR", { style: "currency", currency: row.currency || "TRY" }) : "-" },
    { header: "Durum", accessor: "status" },
  ];

  useEffect(() => {
    const openId = params.get("open");
    if (openId) {
      // We don't have the item object here, so we can't open the dialog properly with just ID if we expect 'item' to be populated.
      // However, InvoiceView fetches by ID. We can create a dummy item with just ID if needed, or fetch it.
      // For now, let's skip auto-open or implement a fetch if critical.
      // Assuming we need to fetch it to show in the list or just open view.
      // Let's fetch it.
      fetch(`/api/fatura/${openId}`)
        .then(r => r.json())
        .then(d => {
          if (d && d.id) {
            setDialog({ type: "view", item: d as Invoice });
          }
        })
        .catch(() => { });
    }
  }, [params]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Imports updated by previous edits, showing only relevant block changes but need to handle imports at top too
  // Actually I can't easily add useRouter import at top without seeing whole file but I will update functions.
  // I will check if useRouter is imported. It is not (based on line 3: import { useSearchParams } from "next/navigation";).
  // I will add useRouter to line 3.
  const router = useRouter(); // add this hook

  const openView = (item: Invoice) => router.push(`/fatura/detay/${item.id}`);
  const openEdit = (item: Invoice) => router.push(`/fatura/duzenle/${item.id}`);
  const openDelete = (item: Invoice) => setDialog({ type: "delete", item });
  const closeDialog = () => setDialog(null);

  // handleSave is no longer used for edit, but maybe for keeping refresh logic? 
  // well, saveEdit was used in InvoiceEdit. Now editing is on separate page.
  // Refresh happens when page reloads or returns.
  // I will just remove handleSave usage if I removed the modal usage.

  const confirmDelete = async () => {
    if (!dialog?.item) return;
    try {
      const r = await fetch(`/api/fatura/${encodeURIComponent(dialog.item.id)}`, { method: "DELETE", credentials: "include" });
      if (!r.ok) throw new Error("delete_failed");
      setDialog(null);
      // Refresh list
      const p = new URLSearchParams();
      if (q) p.set("q", q);
      if (status) p.set("status", status);
      if (dateFrom) p.set("dateFrom", dateFrom);
      if (dateTo) p.set("dateTo", dateTo);
      p.set("sortBy", sortBy);
      p.set("sortDir", sortDir);
      p.set("page", String(page));
      p.set("pageSize", String(pageSize));
      if (dueOnly) p.set("dueOnly", "1");
      setLoading(true);
      fetch(`/api/fatura?${p.toString()}`, { credentials: "include", cache: "no-store" })
        .then((r) => r.json())
        .then((data) => {
          setItems((data?.items || []) as Invoice[]);
          setTotal(Number(data?.total || 0));
        })
        .finally(() => setLoading(false));
      show({ title: "Başarılı", description: "Fatura silindi", variant: "success" });
    } catch (e) {
      show({ title: "Hata", description: "Fatura silinemedi", variant: "error" });
    }
  };

  return (
    <section className="space-y-4">
      <PageHeader
        title="Fatura Listesi"
        variant="default"
        actions={
          <div className="flex gap-2">
            <ImportExcel onDataReady={handleImport} />
            <ExportButtons
              data={items}
              columns={exportColumns}
              fileName={`fatura-listesi-${new Date().toISOString().split("T")[0]}`}
              title="Fatura Listesi"
            />
            {canCreate && (
              <Button onClick={() => router.push("/fatura/olustur")} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20">
                <span className="text-lg font-light leading-none">+</span>
                Fatura Ekle
              </Button>
            )}
          </div>
        }
      />
      {loading && <p className="text-sm text-muted-foreground" role="status" aria-live="polite">Yükleniyor...</p>}

      {/* Tab Buttons */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => { setDueOnly(false); setPage(1); }}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${!dueOnly
            ? "border-blue-600 text-blue-600"
            : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
        >
          Tüm Faturalar
        </button>
        <button
          onClick={() => { setDueOnly(true); setPage(1); }}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${dueOnly
            ? "border-amber-500 text-blue-600"
            : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Vadesi Gelenler
        </button>
      </div>

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

      <div id="filters-panel" className={filtersOpen ? "grid grid-cols-1 gap-1 md:grid-cols-3 lg:grid-cols-5" : "hidden"}>
        <SearchInput
          placeholder="Ara (no/sipariş no)"
          defaultValue={q}
          onSearch={(val) => { setQ(val); setPage(1); }}
        />
        <Select size="sm" value={status} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatus(e.target.value)}>
          <option value="">Durum (tümü)</option>
          <option value="Beklemede">Beklemede</option>
          <option value="Onaylandı">Onaylandı</option>
          <option value="Ödendi">Ödendi</option>
        </Select>
        <FilterInput type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        <FilterInput type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        <Select size="sm" value={sortBy} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSortBy((e.target.value === "amount" ? "amount" : "date"))}>
          <option value="date">Tarih</option>
          <option value="amount">Tutar</option>
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
              <TH>Sipariş No</TH>
              <TH>Durum</TH>
              <TH>Vade</TH>
              <TH>Tutar</TH>
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
                  <TD><Skeleton height={16} /></TD>
                  <TD><Skeleton height={16} /></TD>
                </TR>
              ))
            )}
            {!loading && items.length === 0 && (
              <TR><TD colSpan={7}>Kayıt yok</TD></TR>
            )}
            {!loading && items.map((c) => (
              <TR key={c.id} className="group hover:shadow-sm transition-shadow">
                <TD>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500/10 to-cyan-500/10 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                      </svg>
                    </div>
                    <span className="font-semibold text-slate-700">{c.number}</span>
                  </div>
                </TD>
                <TD>
                  <span className="text-sm text-slate-600">{c.orderNo}</span>
                </TD>
                <TD><Badge variant={statusVariant(c.status)} className="shadow-sm font-medium">{c.status}</Badge></TD>
                <TD>{(() => { const info = dueInfo(c); return (<Badge variant={info.variant}>{info.label}</Badge>); })()}</TD>
                <TD>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-green-50 to-sky-50 border border-green-200">
                    <span className="font-semibold text-green-700">
                      {Number(c.amount).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </TD>
                <TD>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm text-slate-600">
                      {new Date(c.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </TD>
                <TD className="text-right">
                  <div className="inline-flex items-center gap-1 sm:gap-2">
                    <IconButton icon="eye" label="Görüntüle" size="sm" onClick={() => openView(c)} />
                    <IconButton icon="edit" label="Düzenle" size="sm" onClick={() => openEdit(c)} />
                    <IconButton icon="trash" label="Sil" size="sm" tone="danger" onClick={() => openDelete(c)} />
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
        isOpen={!!dialog && !!dialog.item}
        title={dialog?.type === "view" ? "Fatura Detayı" : dialog?.type === "edit" ? "Fatura Düzenle" : dialog?.type === "delete" ? "Fatura Sil" : undefined}
        size={dialog?.type === "view" ? "md" : dialog?.type === "edit" ? "sm" : "sm"}
        onClose={closeDialog}
        footer={dialog?.type === "delete" ? (
          <>
            <Button variant="outline" size="sm" onClick={closeDialog}>Vazgeç</Button>
            <Button size="sm" className="bg-error border-error text-error-foreground hover:brightness-95" onClick={confirmDelete}>Sil</Button>
          </>
        ) : undefined}
      >
        {/* Modal Content - only for delete */}
        {dialog?.type === "delete" && (
          <div className="space-y-2 text-sm">
            <p>Bu fatura kaydını silmek istediğinizden emin misiniz?</p>
          </div>
        )}
      </Modal>
    </section>
  );
}
const statusVariant = (s: string): "default" | "success" | "warning" | "error" | "info" => {
  const v = String(s || "").toLowerCase();
  if (v.includes("ödendi") || v.includes("onaylandı")) return "success";
  if (v.includes("beklemede") || v.includes("vade")) return "warning";
  if (v.includes("iptal") || v.includes("hata")) return "error";
  if (v.includes("taslak")) return "info";
  return "default";
};
const dueInfo = (inv: Invoice): { label: string; variant: "default" | "success" | "warning" | "error" | "info" } => {
  const now = new Date();
  const dueRaw = inv.dueDate ? new Date(inv.dueDate) : null;
  if (!dueRaw || isNaN(dueRaw.getTime())) return { label: "Vade Yok", variant: "info" };
  const days = Math.ceil((dueRaw.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
  if (days < 0) return { label: "Gecikmiş", variant: "error" };
  if (days <= 7) return { label: `Yaklaşıyor (${days}g)`, variant: "warning" };
  return { label: inv.dueDate ? new Date(inv.dueDate).toLocaleDateString("tr-TR") : "-", variant: "default" };
};

// Wrapper with Suspense for useSearchParams
export default function InvoiceListPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Yükleniyor...</div>}>
      <InvoiceListContent />
    </Suspense>
  );
}
