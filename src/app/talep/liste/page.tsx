"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import Button from "@/components/ui/Button";
import IconButton from "@/components/ui/IconButton";
import SearchInput from "@/components/ui/SearchInput";
import FilterInput from "@/components/ui/FilterInput";
import Pagination from "@/components/ui/Pagination";
import Select from "@/components/ui/Select";
import Skeleton from "@/components/ui/Skeleton";
import { TableContainer, Table, THead, TBody, TR, TH, TD } from "@/components/ui/Table";
import { useToast } from "@/components/ui/Toast";
import Modal from "@/components/ui/Modal";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import { fetchJsonWithRetry } from "@/lib/http";
import { useSession } from "next-auth/react";
import { Request } from "@/types/talep";
import ExportButtons, { ExportColumn } from "@/components/ui/ExportButtons";
import ImportExcel from "@/components/ui/ImportExcel";

// Removed TalepView dynamic import as it is no longer used


function TalepListeContent() {
  const { show } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status: sessionStatus } = useSession();
  const [initialized, setInitialized] = useState(false);
  const [query, setQuery] = useState("");
  const [unit, setUnit] = useState<string | "">("");
  const [status, setStatus] = useState<string | "">("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [sortBy, setSortBy] = useState<"date" | "budget">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [items, setItems] = useState<Request[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [dialog, setDialog] = useState<null | { type: "view" | "edit" | "delete"; item: Request | null }>(null);
  const [options, setOptions] = useState<any>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const canEditAdvanced = sessionStatus === "authenticated";

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

  const canCreate = isAdmin || permissions.includes("talep:create");
  const canEdit = isAdmin || permissions.includes("talep:edit");
  const canDelete = isAdmin || permissions.includes("talep:delete");

  const statusVariant = (s: string): "default" | "success" | "warning" | "error" | "info" => {
    const v = (s || "").toLowerCase();
    if (v.includes("onay")) return "success";
    if (v.includes("iptal") || v.includes("redd")) return "error";
    if (v.includes("taslak")) return "warning";
    if (v.includes("bekle") || v.includes("işlem") || v.includes("hazır")) return "info";
    return "default";
  };

  // İlk yüklemede URL'den durumu oku
  useEffect(() => {
    if (initialized) return;
    const q = searchParams.get("q") ?? "";
    const u = searchParams.get("unit") ?? "";
    const s = searchParams.get("status") ?? "";
    const df = searchParams.get("dateFrom") ?? "";
    const dt = searchParams.get("dateTo") ?? "";
    const sb = (searchParams.get("sortBy") as string) ?? "date";
    const sd = (searchParams.get("sortDir") as string) ?? "desc";
    const pg = Number(searchParams.get("page") ?? 1);
    const psz = Number(searchParams.get("pageSize") ?? 20);
    setQuery(q);
    setUnit(u);
    setStatus(s);
    setDateFrom(df);
    setDateTo(dt);
    setSortBy(sb === "budget" ? "budget" : "date");
    setSortDir(sd === "asc" ? "asc" : "desc");
    setPage(Number.isFinite(pg) && pg > 0 ? pg : 1);
    setPageSize([10, 20, 50, 100].includes(psz) ? psz : 20);
    setInitialized(true);
  }, [searchParams, initialized]);

  // Options for edit modal
  useEffect(() => {
    let active = true;
    const loadOptions = async () => {
      try {
        const data = await fetchJsonWithRetry<any>("/api/options", { cache: "no-store" }, { retries: 2, backoffMs: 250 });
        if (!active) return;
        setOptions(data);
      } catch (_) {
        // ignore
      }
    };
    loadOptions();
    return () => { active = false; };
  }, []);

  const listAbortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<number | null>(null);
  const buildParamsFromState = () => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (unit) params.set("unit", unit);
    if (status) params.set("status", status);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    params.set("sortBy", sortBy);
    params.set("sortDir", sortDir);
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    return params;
  };

  const loadList = async (params: URLSearchParams) => {
    setLoading(true);
    setError(null);
    if (listAbortRef.current) listAbortRef.current.abort();
    const controller = new AbortController();
    listAbortRef.current = controller;
    try {
      const data = await fetchJsonWithRetry<{ items: Request[]; total: number }>(
        `/api/talep?${params.toString()}`,
        { cache: "no-store", signal: controller.signal },
        { retries: 2, backoffMs: 250 }
      );
      setItems((data.items ?? []) as Request[]);
      setTotal(Number(data.total ?? 0));
    } catch (e: any) {
      if (e?.name !== "AbortError") {
        const raw = e?.message || "Hata";
        const friendly = /Transient server error/i.test(raw) || /\b500\b/.test(raw)
          ? "Sunucu geçici hata verdi (500). Lütfen tekrar deneyin."
          : raw;
        setError(friendly);
        show({ title: "Hata", description: friendly, variant: "error" });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const params = buildParamsFromState();
    if (typeof window !== "undefined") {
      const current = window.location.search.slice(1);
      const next = params.toString();
      if (current !== next) {
        window.history.replaceState(null, "", `${window.location.pathname}?${next}`);
      }
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(() => {
        loadList(params);
      }, 200);
    } else {
      loadList(params);
    }
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [initialized, page, pageSize, query, unit, status, dateFrom, dateTo, sortBy, sortDir]);

  useEffect(() => {
    return () => { listAbortRef.current?.abort(); };
  }, []);

  const handleImport = async (data: any[]) => {
    // Bulk create logic would go here. For now, we'll just log or show a message.
    // Ideally, iterate data and call POST /api/talep for each, or a bulk endpoint.
    show({ title: "Bilgi", description: "Toplu ekleme özelliği henüz backend tarafında aktif değil.", variant: "info" });
  };

  const exportColumns: ExportColumn[] = [
    { header: "Talep No", accessor: "barcode" }, // Changed from formattedId to barcode based on existing data
    { header: "Talep Eden", accessor: (row) => (row as any).requestorName || "-" }, // Assuming requestorName exists or can be derived
    { header: "Birim", accessor: (row: Request) => row.unit || "-" }, // Changed from department to unit
    { header: "Tarih", accessor: (row: Request) => row.date ? new Date(row.date).toLocaleDateString("tr-TR") : "-" },
    { header: "Konu", accessor: "subject" },
    { header: "Tutar", accessor: (row: Request) => typeof row.budget === 'number' ? row.budget.toLocaleString("tr-TR", { style: "currency", currency: row.currency || "TRY" }) : "-" }, // Changed from budgetEstimate to budget
    { header: "Durum", accessor: "status" },
  ];

  const exportCsv = () => {
    const header = "Barkod,Tarih,Konu,Bütçe,Birim,Durum,Para Birimi";
    const lines = items.map((r) => [r.barcode, new Date(r.date).toLocaleDateString(), r.subject, r.budget, r.unit, r.status, r.currency].join(","));
    const csv = [header, ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "talep_listesi.csv";
    a.click();
    URL.revokeObjectURL(url);
    show({ title: "CSV hazır", description: "Talep listesi indiriliyor", variant: "success" });
  };

  const openView = (item: Request) => router.push(`/talep/detay/${item.id}`);
  const openEdit = (item: Request) => {
    router.push(`/talep/duzenle/${item.id}`);
  };
  const openDelete = (item: Request) => setDialog({ type: "delete", item });

  const closeDialog = () => setDialog(null);

  const handleSave = async () => {
    await loadList(buildParamsFromState());
    closeDialog();
  };

  const confirmDelete = async () => {
    if (!dialog?.item) return;
    const id = dialog.item.id;
    try {
      setActionLoadingId(id);
      await fetchJsonWithRetry(`/api/talep/${id}`, { method: "DELETE" }, { retries: 1, backoffMs: 200 });
      show({ title: "Silindi", description: "Kayıt silindi", variant: "success" });
      await loadList(buildParamsFromState());
      closeDialog();
    } catch (e: any) {
      show({ title: "Hata", description: e.message || "Silme başarısız", variant: "error" });
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <section className="space-y-4">
      <PageHeader
        title="Talep Listesi"
        variant="default"
        actions={
          <div className="flex gap-2">
            {canCreate && (
              <>
                <ImportExcel onDataReady={handleImport} />
                <Button onClick={() => router.push("/talep/olustur")} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20">
                  <span className="text-lg font-light leading-none">+</span>
                  Yeni Oluştur
                </Button>
              </>
            )}
            <ExportButtons
              data={items}
              columns={exportColumns}
              fileName={`talep-listesi-${new Date().toISOString().split("T")[0]}`}
              title="Talep Listesi"
            />
          </div>
        }
      />
      {loading && <p className="text-sm text-muted-foreground" role="status" aria-live="polite">Yükleniyor...</p>}
      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Filtreler:</span>
        {query && (
          <button className="rounded-full bg-muted px-2 py-0.5 text-xs" onClick={() => { setQuery(""); setPage(1); }} aria-label="Arama filtresini temizle">q: {query} ✕</button>
        )}
        {unit && (
          <button className="rounded-full bg-muted px-2 py-0.5 text-xs" onClick={() => { setUnit(""); setPage(1); }} aria-label="Birim filtresini temizle">unit: {unit} ✕</button>
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
        <Button variant="outline" size="sm" onClick={() => { setQuery(""); setUnit(""); setStatus(""); setDateFrom(""); setDateTo(""); setPage(1); }}>Temizle</Button>
      </div>

      <div id="filters-panel" className={filtersOpen ? "grid grid-cols-1 gap-1 md:grid-cols-3 lg:grid-cols-5" : "hidden"}>
        <SearchInput
          aria-label="Barkod veya konu"
          placeholder="Barkod/Konu"
          defaultValue={query}
          onSearch={(val) => { setQuery(val); setPage(1); }}
        />
        <Select size="sm" value={unit} onChange={(e) => setUnit(e.target.value)}>
          <option value="">Birim (tümü)</option>
          <option>Satın Alma</option>
          <option>Üretim</option>
        </Select>
        <Select size="sm" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Durum (tümü)</option>
          <option>Taslak</option>
          <option>Onaylandı</option>
        </Select>
        <FilterInput aria-label="Başlangıç tarihi" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        <FilterInput aria-label="Bitiş tarihi" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
      </div>

      <Pagination
        currentPage={page}
        totalPages={Math.max(1, Math.ceil(total / pageSize))}
        onPageChange={setPage}
        pageSize={pageSize}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
        totalItems={total}
      />

      <TableContainer>
        <Table>
          <caption className="sr-only">Talep listesi tablo</caption>
          <THead>
            <TR>
              <TH>Barkod</TH>
              <TH>Tarih</TH>
              <TH>Konu</TH>
              <TH>Bütçe</TH>
              <TH>Birim</TH>
              <TH>Durum</TH>
              <TH>Para Birimi</TH>
              <TH className="w-[1%] whitespace-nowrap text-right">İşlemler</TH>
            </TR>
          </THead>
          <TBody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                <TR key={`skeleton-${i}`}>
                  <TD><Skeleton height={16} /></TD>
                  <TD><Skeleton height={16} /></TD>
                  <TD><Skeleton height={16} /></TD>
                  <TD><Skeleton height={16} /></TD>
                  <TD><Skeleton height={16} /></TD>
                  <TD><Skeleton height={16} /></TD>
                  <TD><Skeleton height={16} /></TD>
                  <TD><Skeleton height={16} /></TD>
                </TR>
              ))
              : items.map((r) => (
                <TR key={r.id} className="group hover:shadow-sm transition-shadow">
                  <TD>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500/10 to-red-500/10 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                      </div>
                      <span className="font-semibold text-slate-700">{r.barcode}</span>
                    </div>
                  </TD>
                  <TD>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm text-slate-600">
                        {new Date(r.date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </TD>
                  <TD>
                    <div className="flex items-center gap-2 max-w-xs">
                      <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                      <span className="text-sm text-slate-700 truncate">{r.subject}</span>
                    </div>
                  </TD>
                  <TD>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200">
                      <span className="font-semibold text-amber-700">
                        {r.budget.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </TD>
                  <TD>
                    <span className="text-sm text-slate-600">{r.unit}</span>
                  </TD>
                  <TD>
                    <Badge variant={statusVariant(r.status)} className="shadow-sm font-medium">
                      {r.status}
                    </Badge>
                  </TD>
                  <TD>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium border border-blue-200">
                      {r.currency}
                    </span>
                  </TD>
                  <TD className="text-right">
                    <div className="inline-flex items-center gap-1 sm:gap-2">
                      <IconButton icon="eye" label="Detay" size="sm" onClick={() => openView(r)} />
                      {canEdit && (
                        <IconButton icon="edit" label="Güncelle" size="sm" onClick={() => openEdit(r)} disabled={!!actionLoadingId} aria-busy={actionLoadingId === r.id} />
                      )}
                      {canDelete && (
                        <IconButton icon="trash" label="Sil" size="sm" tone="danger" onClick={() => openDelete(r)} disabled={!!actionLoadingId} aria-busy={actionLoadingId === r.id} />
                      )}
                      {actionLoadingId === r.id && (
                        <span className="inline-flex items-center text-xs text-muted-foreground">
                          <svg className="mr-1 h-3 w-3 animate-spin" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" /></svg>
                          İşlem yapılıyor
                        </span>
                      )}
                    </div>
                  </TD>
                </TR>
              ))}
          </TBody>
        </Table>
      </TableContainer>

      <Modal
        isOpen={!!dialog && !!dialog.item}
        title={dialog?.type === "view" ? "Talep Detayı" : dialog?.type === "edit" ? "Talep Düzenle" : dialog?.type === "delete" ? "Talep Sil" : undefined}
        onClose={closeDialog}
        size={dialog?.type === "view" ? "lg" : dialog?.type === "edit" ? "md" : "sm"}
        footer={
          dialog?.type === "delete" ? (
            <>
              <Button variant="outline" size="sm" onClick={closeDialog}>Vazgeç</Button>
              <Button size="sm" onClick={confirmDelete} variant="danger">Sil</Button>
            </>
          ) : undefined
        }
      >
        {/* View handled by navigation */}

        {dialog?.type === "delete" && (
          <div className="text-sm">
            <p>Bu kaydı silmek istediğinizden emin misiniz?</p>
          </div>
        )}
      </Modal>
    </section>
  );
}

// Wrapper with Suspense for useSearchParams
export default function TalepListePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Yükleniyor...</div>}>
      <TalepListeContent />
    </Suspense>
  );
}
