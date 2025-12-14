"use client";
import { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Button from "@/components/ui/Button";
import IconButton from "@/components/ui/IconButton";
// İşlemler sütununu metinli butonlarla göstereceğiz
import SearchInput from "@/components/ui/SearchInput";
import Input from "@/components/ui/Input";
import FilterInput from "@/components/ui/FilterInput";
import Select from "@/components/ui/Select";
import Pagination from "@/components/ui/Pagination";
import Skeleton from "@/components/ui/Skeleton";
import { TableContainer, Table, THead, TBody, TR, TH, TD } from "@/components/ui/Table";
import { useToast } from "@/components/ui/Toast";
import Modal from "@/components/ui/Modal";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import ExportButtons, { ExportColumn } from "@/components/ui/ExportButtons";
import ImportExcel from "@/components/ui/ImportExcel";

type Order = {
  id: string;
  barcode: string;
  refNumber?: string;
  date: string;
  status: string;
  method: string;
  total: number;
  currency: string;
  hasEvaluation?: boolean;
  reviewPending?: boolean;
};

type OrderDetail = {
  id: string;
  barcode: string;
  date: string | null;
  estimatedDelivery?: string | null;
  status?: string | null;
  method?: string | null;
  total?: number | null;
  currency?: string | null;
  regulation?: string | null;
  supplierName?: string | null;
  companyName?: string | null;
  statusId?: string | null;
  methodId?: string | null;
  regulationId?: string | null;
  currencyId?: string | null;
  supplierId?: string | null;
  companyId?: string | null;
  requestBarcode?: string | null;
  items?: Array<{ id?: string; name: string; quantity: number; unitPrice: number }>;
};

const fetchList = async (params: URLSearchParams): Promise<Order[]> => {
  const res = await fetch(`/api/siparis?${params.toString()}`);
  if (!res.ok) throw new Error("Liste alınamadı");
  const data = await res.json();
  return (data.items ?? []) as Order[];
};

function SiparisListeContent() {
  const { show } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [initialized, setInitialized] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string | "">("");
  const [method, setMethod] = useState<string | "">("");
  const [unit, setUnit] = useState<string | "">("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "total">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [items, setItems] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [reviewOnly, setReviewOnly] = useState(false);
  const [dialog, setDialog] = useState<null | { type: "view" | "edit" | "delete" | "review"; item: Order | null }>(null);
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

  const canCreate = isAdmin || permissions.includes("siparis:create");
  const canEdit = isAdmin || permissions.includes("siparis:edit");
  const canDelete = isAdmin || permissions.includes("siparis:delete");

  // Edit modal states (IDs)
  type Option = { id: string; label: string };
  type OptionsPayload = {
    siparisDurumu: Option[];
    alimYontemi: Option[];
    yonetmelikMaddesi: Option[];
    paraBirimi: Option[];
    tedarikci: Option[];
    firma: Option[];
    birim: Option[];
  };
  const [options, setOptions] = useState<OptionsPayload>({ siparisDurumu: [], alimYontemi: [], yonetmelikMaddesi: [], paraBirimi: [], tedarikci: [], firma: [], birim: [] });
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<OrderDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Load options
  useEffect(() => {
    const loadOpts = async () => {
      try {
        const res = await fetch("/api/options?include=suppliers,companies,units");
        if (res.ok) {
          setOptions(await res.json());
        }
      } catch { }
    };
    loadOpts();
  }, []);

  // Sync with URL params
  useEffect(() => {
    if (initialized) return;
    setQuery(searchParams.get("q") || "");
    setStatus(searchParams.get("status") || "");
    setMethod(searchParams.get("method") || "");
    setUnit(searchParams.get("unit") || "");
    setDateFrom(searchParams.get("dateFrom") || "");
    setDateTo(searchParams.get("dateTo") || "");
    setSortBy((searchParams.get("sortBy") as any) || "date");
    setSortDir((searchParams.get("sortDir") as any) || "desc");
    setPage(Number(searchParams.get("page") || 1));
    setPageSize(Number(searchParams.get("pageSize") || 20));
    setReviewOnly(searchParams.get("review") === "1");
    setInitialized(true);
  }, [searchParams, initialized]);

  const refreshList = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (status) params.set("status", status);
      if (method) params.set("method", method);
      if (unit) params.set("unit", unit);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      params.set("sortBy", sortBy);
      params.set("sortDir", sortDir);
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));
      if (reviewOnly) params.set("review", "1"); // Only orders needing review

      // Let's call API directly here to get total
      const res = await fetch(`/api/siparis?${params.toString()}`);
      const data = await res.json();
      setItems(data.items || []);
      setTotal(data.total || 0);

      // URL update
      if (initialized) {
        const url = `${pathname}?${params.toString()}`;
        router.replace(url, { scroll: false });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialized) refreshList();
  }, [initialized, query, status, method, unit, dateFrom, dateTo, sortBy, sortDir, page, pageSize, reviewOnly]);

  const statusVariant = (s: string): "default" | "success" | "warning" | "error" | "info" => {
    const v = (s || "").toLowerCase();
    if (v.includes("onay")) return "success";
    if (v.includes("iptal") || v.includes("redd")) return "error";
    if (v.includes("taslak")) return "warning";
    if (v.includes("bekle") || v.includes("işlem") || v.includes("hazır")) return "info";
    return "default";
  };

  const handleImport = async (data: any[]) => {
    show({ title: "Bilgi", description: "Toplu ekleme henüz aktif değil", variant: "info" });
  };

  const exportColumns: ExportColumn[] = [
    { header: "Sipariş No", accessor: "barcode" },
    { header: "Sipariş Barkodu", accessor: (row) => row.refNumber || "-" },
    { header: "Tarih", accessor: (row) => row.date ? new Date(row.date).toLocaleDateString("tr-TR") : "-" },
    { header: "Yöntem", accessor: (row) => row.method || "-" },
    { header: "Durum", accessor: "status" },
    { header: "Tutar", accessor: (row) => typeof row.total === 'number' ? row.total.toLocaleString("tr-TR", { style: "currency", currency: row.currency || "TRY" }) : "-" },
  ];

  // Simplified openView
  const openView = (item: Order) => {
    router.push(`/siparis/detay/${item.id}`);
  };

  const openEdit = (item: Order) => {
    router.push(`/siparis/duzenle/${item.id}`);
  };

  const openDelete = (item: Order) => {
    setDialog({ type: "delete", item });
  };

  const openReview = (item: Order) => {
    // Direct navigation to evaluation page
    router.push(`/birim/degerlendirmeler?highlight=${item.barcode}`);
  };

  const closeDialog = () => {
    setDialog(null);
    setDetailData(null);
    setDetailError(null);
    setDetailLoading(false);
  };

  // removed saveEdit as it is now handled in page

  const confirmDelete = async () => {
    if (!dialog?.item) return;
    const id = dialog.item.id;
    try {
      setActionLoadingId(id);
      const res = await fetch(`/api/siparis/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Silme başarısız");
      show({ title: "Silindi", description: "Sipariş silindi", variant: "success" });
      setDialog(null);
      refreshList();
    } catch (e: any) {
      show({ title: "Hata", description: e.message, variant: "error" });
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <section className="space-y-4">
      <PageHeader
        title={reviewOnly ? "Değerlendirme Bekleyenler" : "Sipariş Listesi"}
        description={reviewOnly ? "Değerlendirilmesi gereken siparişler" : "Tüm siparişlerinizi yönetin."}
        variant="default"
        actions={
          <div className="flex gap-2">
            <ImportExcel onDataReady={handleImport} />
            <ExportButtons
              data={items}
              columns={exportColumns}
              fileName={`siparis-listesi-${new Date().toISOString().split("T")[0]}`}
              title="Sipariş Listesi"
            />
            {canCreate && (
              <Button onClick={() => router.push("/siparis/olustur")} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20">
                <span className="text-lg font-light leading-none">+</span>
                Yeni Sipariş
              </Button>
            )}
          </div>
        }
      />
      {loading && <p className="text-sm text-muted-foreground" role="status" aria-live="polite">Yükleniyor...</p>}
      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
      {/* Filter toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
        <span className="text-sm font-medium text-slate-600">Filtreler:</span>
        {query && (
          <button className="inline-flex items-center gap-1 rounded-full bg-blue-100 text-blue-700 px-3 py-1 text-xs font-medium hover:bg-blue-200 transition-colors" onClick={() => { setQuery(""); setPage(1); }} aria-label="Arama filtresini temizle">
            Arama: {query} <span className="ml-1">×</span>
          </button>
        )}
        {status && (
          <button className="inline-flex items-center gap-1 rounded-full bg-purple-100 text-purple-700 px-3 py-1 text-xs font-medium hover:bg-purple-200 transition-colors" onClick={() => { setStatus(""); setPage(1); }} aria-label="Durum filtresini temizle">
            Durum: {status} <span className="ml-1">×</span>
          </button>
        )}
        {method && (
          <button className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 px-3 py-1 text-xs font-medium hover:bg-emerald-200 transition-colors" onClick={() => { setMethod(""); setPage(1); }} aria-label="Yöntem filtresini temizle">
            Yöntem: {method} <span className="ml-1">×</span>
          </button>
        )}
        {unit && (
          <button className="inline-flex items-center gap-1 rounded-full bg-cyan-100 text-cyan-700 px-3 py-1 text-xs font-medium hover:bg-cyan-200 transition-colors" onClick={() => { setUnit(""); setPage(1); }} aria-label="Birim filtresini temizle">
            Birim: {unit} <span className="ml-1">×</span>
          </button>
        )}
        {reviewOnly && (
          <button className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-700 px-3 py-1 text-xs font-medium hover:bg-amber-200 transition-colors" onClick={() => { setReviewOnly(false); setPage(1); }} aria-label="Değerlendirme filtresini temizle">
            Değerlendirme bekliyor <span className="ml-1">×</span>
          </button>
        )}
        {(dateFrom || dateTo) && (
          <button className="inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-700 px-3 py-1 text-xs font-medium hover:bg-slate-200 transition-colors" onClick={() => { setDateFrom(""); setDateTo(""); setPage(1); }} aria-label="Tarih filtresini temizle">
            Tarih: {dateFrom || "?"} → {dateTo || "?"} <span className="ml-1">×</span>
          </button>
        )}
        <div className="flex-1" />
        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer" aria-label="Değerlendirme bekleyenler">
          <input type="checkbox" checked={reviewOnly} onChange={(e) => { setReviewOnly((e.target as HTMLInputElement).checked); setPage(1); }} className="rounded border-slate-300" />
          <span>Değerlendirme bekleyenler</span>
        </label>
        <Button variant="outline" size="sm" onClick={() => setFiltersOpen((v) => !v)} aria-expanded={filtersOpen} aria-controls="filters-panel">
          {filtersOpen ? "Filtreleri Gizle" : "Filtreleri Göster"}
        </Button>
        <Button variant="outline" size="sm" onClick={() => { setQuery(""); setStatus(""); setMethod(""); setUnit(""); setDateFrom(""); setDateTo(""); setReviewOnly(false); setPage(1); }}>Temizle</Button>
      </div>

      {/* Filter inputs panel */}
      {filtersOpen && (
        <div id="filters-panel" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <SearchInput
            aria-label="Barkod"
            placeholder="Barkod ara..."
            defaultValue={query}
            onSearch={(val) => { setQuery(val); setPage(1); }}
          />
          <Select size="sm" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Durum (tümü)</option>
            <option>Taslak</option>
            <option>Onaylandı</option>
            <option>Tamamlandı</option>
          </Select>
          <Select size="sm" value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="">Yöntem (tümü)</option>
            <option>Doğrudan Temin</option>
            <option>İhale</option>
          </Select>
          {(isAdmin || permissions.includes("siparis:create")) && (
            <Select size="sm" value={unit} onChange={(e) => { setUnit(e.target.value); setPage(1); }}>
              <option value="">Birim (tümü)</option>
              {options.birim.map((b) => (
                <option key={b.id} value={b.label}>{b.label}</option>
              ))}
            </Select>
          )}
          <FilterInput aria-label="Başlangıç tarihi" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} placeholder="Başlangıç" />
          <FilterInput aria-label="Bitiş tarihi" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} placeholder="Bitiş" />
        </div>
      )}

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
          <caption className="sr-only">Sipariş listesi tablo</caption>
          <THead>
            <TR>
              <TH>Sipariş No</TH>
              <TH>Sipariş Barkodu</TH>
              <TH>Tarih</TH>
              <TH>Durum</TH>
              <TH>Yöntem</TH>
              <TH>Toplam</TH>
              <TH>Para Birimi</TH>
              <TH>İşlemler</TH>
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
                </TR>
              ))
              : items.map((r) => (
                <TR key={r.id} className="group hover:shadow-sm transition-shadow">
                  <TD>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                        </svg>
                      </div>
                      <span className="font-semibold text-slate-700">{r.barcode}</span>
                    </div>
                  </TD>
                  <TD>
                    {r.refNumber ? (
                      <span className="font-mono text-sm text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                        {r.refNumber}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 italic">-</span>
                    )}
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
                    <Badge variant={statusVariant(r.status)} className="shadow-sm font-medium">
                      {r.status}
                    </Badge>
                  </TD>
                  <TD>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center flex-shrink-0">
                        <svg className="w-3 h-3 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <span className="text-sm text-slate-600">{r.method}</span>
                    </div>
                  </TD>
                  <TD>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200">
                      <span className="font-semibold text-emerald-700">
                        {r.total.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </TD>
                  <TD>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium border border-blue-200">
                      {r.currency}
                    </span>
                  </TD>
                  <TD>
                    <div className="flex items-center gap-1 flex-wrap">
                      {r.reviewPending && (
                        <Badge variant="warning" className="text-xs">Değerlendirme bekliyor</Badge>
                      )}
                      <IconButton icon="eye" label="Detay" size="sm" onClick={() => openView(r)} />
                      <IconButton icon="edit" label="Güncelle" size="sm" onClick={() => openEdit(r)} />
                      <IconButton icon="trash" label="Sil" size="sm" tone="danger" onClick={() => openDelete(r)} />
                      {(r.status?.toLowerCase().includes("tamamlan") || r.reviewPending) && (
                        <button
                          onClick={() => openReview(r)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${r.hasEvaluation
                            ? "bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
                            : "bg-emerald-500 text-white shadow-md shadow-emerald-200 hover:bg-emerald-600"
                            }`}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                          </svg>
                          {r.hasEvaluation ? "Değerlendirmeyi Gör" : "Değerlendir"}
                        </button>
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
        onClose={() => setDialog(null)}
        title={
          dialog?.type === "view" ? "Sipariş Detayı" :
            dialog?.type === "edit" ? "Sipariş Düzenle" :
              dialog?.type === "delete" ? "Siparişi Sil" :
                dialog?.type === "review" ? "Sipariş Değerlendirme" : ""
        }
        size={dialog?.type === "delete" ? "sm" : "lg"}
        footer={
          dialog?.type === "delete" ? (
            <>
              <Button variant="outline" onClick={() => setDialog(null)}>İptal</Button>
              <Button variant="danger" onClick={confirmDelete}>Sil</Button>
            </>
            // removed edit case
          ) : dialog?.type === "review" ? (
            <>
              <Button variant="outline" onClick={() => setDialog(null)}>Kapat</Button>
              <Button variant="primary" onClick={() => { setDialog(null); router.push(`/tedarikci/degerlendirme?orderId=${encodeURIComponent(dialog.item!.id)}`); }}>
                Değerlendirme Formunu Aç
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => setDialog(null)}>Kapat</Button>
          )
        }
      >
        {/* Modal Content - only for delete and review */}
        {dialog?.type === "delete" ? (
          <div className="text-center p-4">
            <p className="text-slate-600">Bu siparişi kalıcı olarak silmek istediğinizden emin misiniz?</p>
            <p className="font-bold mt-2">{dialog.item?.barcode}</p>
          </div>
        ) : dialog?.type === "review" && dialog.item ? (
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              {dialog.item.hasEvaluation
                ? "Bu sipariş için değerlendirme mevcut. Formu görüntülemek veya yeni bir değerlendirme yapmak için devam edin."
                : "Sipariş tamamlandı. Tedarikçi değerlendirmesini başlatmak için formu açın."}
            </p>
          </div>
        ) : null}

      </Modal >

      {detailLoading && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={`dl-s-${i}`}>
              <Skeleton height={12} className="mb-1" />
              <Skeleton height={16} />
            </div>
          ))}
        </div>
      )}

      {
        detailError && (
          <p className="text-red-600">{detailError}</p>
        )
      }

      {/* Kalemler Önizleme */}


      {/* Hızlı aksiyonlar */}

    </section >
  )
}

export default function SiparisListePage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground" role="status" aria-live="polite">Yükleniyor...</p>}>
      <SiparisListeContent />
    </Suspense>
  );
}
