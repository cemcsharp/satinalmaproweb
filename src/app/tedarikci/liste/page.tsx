"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import IconButton from "@/components/ui/IconButton";
import { TableContainer, Table, THead, TBody, TR, TH, TD } from "@/components/ui/Table";
import Input from "@/components/ui/Input";
import SearchInput from "@/components/ui/SearchInput";
import FilterInput from "@/components/ui/FilterInput";
import Pagination from "@/components/ui/Pagination";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import Modal from "@/components/ui/Modal";
import { useRouter } from "next/navigation";
import Skeleton from "@/components/ui/Skeleton";
import Badge from "@/components/ui/Badge";

type Supplier = { id: string; name: string; active: boolean; taxId?: string; contactName?: string; email?: string; phone?: string };

const fetchSuppliers = async (params: URLSearchParams): Promise<{ items: Supplier[]; total: number }> => {
  const res = await fetch(`/api/tedarikci?${params.toString()}`);
  if (!res.ok) throw new Error("Liste alınamadı");
  const data = await res.json();
  return { items: (data.items ?? []) as Supplier[], total: Number(data.total || 0) };
};

function SupplierListContent() {
  const { show } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [initialized, setInitialized] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState<string>("");
  const [items, setItems] = useState<Supplier[]>([]);
  const [sortBy, setSortBy] = useState<"name" | "date">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingName, setDeletingName] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    if (initialized) return;
    setQ(searchParams.get("q") ?? "");
    setActive(searchParams.get("active") ?? "");
    setInitialized(true);
  }, [searchParams, initialized]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (active) params.set("active", active);
    params.set("sortBy", sortBy);
    params.set("sortDir", sortDir);
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    const current = searchParams.toString();
    const next = params.toString();
    if (current !== next && typeof window !== "undefined") {
      window.history.replaceState(null, "", `${pathname}?${next}`);
    }
    setLoading(true);
    setError(null);
    fetchSuppliers(params)
      .then((res) => { setItems(res.items); setTotal(res.total); })
      .catch((e) => {
        setError(e.message || "Hata");
        show({ title: "Hata", description: e.message || "Liste alınamadı", variant: "error" });
      })
      .finally(() => setLoading(false));
  }, [q, active, sortBy, sortDir, page, pageSize, pathname, searchParams]);

  return (
    <section className="space-y-4">
      <PageHeader title="Tedarikçi Listesi" variant="gradient">
        <Button
          onClick={() => {
            const header = "Ad,Durum,Vergi No,İrtibat";
            const lines = items.map((s) => [s.name, s.active ? "Aktif" : "Pasif", s.taxId || "-", s.contactName || s.email || s.phone || "-"].join(","));
            const csv = [header, ...lines].join("\n");
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "tedarikci_listesi.csv";
            a.click();
            URL.revokeObjectURL(url);
            show({ title: "CSV hazır", description: "Tedarikçi listesi indiriliyor", variant: "success" });
          }}
          variant="outline"
          size="sm"
          aria-label="CSV indir"
          title="CSV indir"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <path d="M7 10l5 5 5-5" />
            <path d="M12 15V3" />
          </svg>
        </Button>
      </PageHeader>
      {loading && <p className="text-sm text-muted-foreground" role="status" aria-live="polite">Yükleniyor...</p>}
      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}

      {/* Toolbar: aktif filtre çipleri ve panel toggle */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Filtreler:</span>
        {q && (
          <button className="rounded-full bg-muted px-2 py-0.5 text-xs" onClick={() => { setQ(""); setPage(1); }} aria-label="Arama filtresini temizle">q: {q} ✕</button>
        )}
        {active && (
          <button className="rounded-full bg-muted px-2 py-0.5 text-xs" onClick={() => { setActive(""); setPage(1); }} aria-label="Durum filtresini temizle">active: {active === "true" ? "Aktif" : "Pasif"} ✕</button>
        )}
        <Button className="ml-auto" variant="outline" size="sm" onClick={() => setFiltersOpen((v) => !v)} aria-expanded={filtersOpen} aria-controls="filters-panel">
          {filtersOpen ? "Filtreleri Gizle" : "Filtreleri Göster"}
        </Button>
        <Button variant="outline" size="sm" onClick={() => { setQ(""); setActive(""); setPage(1); }}>Temizle</Button>
      </div>

      {/* Sıkıştırılmış filtre paneli */}
      <div id="filters-panel" className={filtersOpen ? "grid grid-cols-1 gap-1 md:grid-cols-3 lg:grid-cols-5" : "hidden"}>
        <SearchInput
          placeholder="Ara (ad, vergi no, e-posta, tel)"
          defaultValue={q}
          onSearch={(val) => { setQ(val); setPage(1); }}
        />
        <Select size="sm" value={active} onChange={(e) => setActive((e.target as HTMLSelectElement).value)}>
          <option value="">Durum (tümü)</option>
          <option value="true">Aktif</option>
          <option value="false">Pasif</option>
        </Select>
        <Select size="sm" value={sortBy} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setSortBy(e.target.value as "name" | "date"); setPage(1); }}>
          <option value="name">Ad</option>
          <option value="date">Tarih</option>
        </Select>
        <Select size="sm" value={sortDir} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setSortDir(e.target.value as "asc" | "desc"); setPage(1); }}>
          <option value="asc">Artan</option>
          <option value="desc">Azalan</option>
        </Select>
        <Select size="sm" value={String(pageSize)} onChange={(e) => { setPageSize(Number((e.target as HTMLSelectElement).value)); setPage(1); }}>
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="50">50</option>
          <option value="100">100</option>
        </Select>
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
          <THead>
            <TR>
              <TH>
                Ad
              </TH>
              <TH>Vergi No</TH>
              <TH>İrtibat</TH>
              <TH>
                Durum
              </TH>
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
                  <TD className="text-right"><Skeleton height={16} /></TD>
                </TR>
              ))
              : items.map((s) => (
                <TR key={s.id} className="group hover:shadow-sm transition-shadow">
                  <TD className="text-primary">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500/10 to-green-500/10 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <Link href={`/tedarikci/detay/${encodeURIComponent(s.id)}`} prefetch={false} className="hover:underline font-semibold text-slate-700">
                        {s.name}
                      </Link>
                    </div>
                  </TD>
                  <TD>
                    <div className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-50 text-slate-700 text-xs font-medium border border-slate-200">
                      {s.taxId || "-"}
                    </div>
                  </TD>
                  <TD>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="text-sm text-slate-600">{s.contactName || s.email || s.phone || "-"}</span>
                    </div>
                  </TD>
                  <TD>
                    <Badge variant={s.active ? "success" : "default"} className="shadow-sm font-medium">{s.active ? "Aktif" : "Pasif"}</Badge>
                  </TD>
                  <TD className="text-right">
                    <div className="inline-flex items-center gap-1 sm:gap-2">
                      <Link href={`/tedarikci/detay/${encodeURIComponent(s.id)}`} prefetch={false} aria-label="Görüntüle" title="Görüntüle">
                        <IconButton icon="eye" label="Görüntüle" size="sm" />
                      </Link>
                      <Link
                        href={`/tedarikci/duzenle/${encodeURIComponent(s.id)}`}
                        prefetch={false}
                        aria-label="Düzenle"
                        title="Düzenle"
                      >
                        <IconButton icon="edit" label="Düzenle" size="sm" />
                      </Link>
                      <IconButton
                        icon="trash"
                        label="Sil"
                        size="sm"
                        tone="danger"
                        onClick={() => { setConfirmOpen(true); setDeletingId(s.id); setDeletingName(s.name); }}
                      />
                    </div>
                  </TD>
                </TR>
              ))}
          </TBody>
        </Table>
      </TableContainer>
      <Modal
        isOpen={confirmOpen}
        onClose={() => { if (!deleteLoading) { setConfirmOpen(false); setDeletingId(null); setDeletingName(null); } }}
        title="Tedarikçiyi Sil"
        size="sm"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setConfirmOpen(false)} disabled={deleteLoading}>İptal</Button>
            <Button variant="primary" size="sm" loading={deleteLoading} onClick={async () => {
              if (!deletingId) return;
              setDeleteLoading(true);
              try {
                const res = await fetch(`/api/tedarikci/${encodeURIComponent(deletingId)}`, { method: "DELETE" });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) {
                  const msg = data?.error === "linked_records"
                    ? "Bağlı kayıtlar nedeniyle silinemiyor."
                    : data?.message || "Silme işlemi başarısız.";
                  show({ title: "Silinemedi", description: msg, variant: "error" });
                } else {
                  setItems((prev) => prev.filter((x) => x.id !== deletingId));
                  show({ title: "Silindi", description: `${deletingName ?? "Tedarikçi"} silindi.`, variant: "success" });
                  setConfirmOpen(false);
                }
              } catch (e) {
                const message = e instanceof Error ? e.message : "Silme işleminde hata.";
                show({ title: "Hata", description: message, variant: "error" });
              } finally {
                setDeleteLoading(false);
                setDeletingId(null);
                setDeletingName(null);
              }
            }}>Sil</Button>
          </>
        }
      >
        <p className="text-sm">{deletingName ? `${deletingName} kayıtını kalıcı olarak silmek istediğinize emin misiniz?` : "Kalıcı silme işlemini onaylıyor musunuz?"}</p>
        <p className="mt-2 text-[12px] text-muted-foreground">Bu işlem geri alınamaz. Bağlı sipariş veya sözleşmeler varsa silme engellenebilir.</p>
      </Modal>
    </section>
  );
}

export default function SupplierListPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground" role="status" aria-live="polite">Yükleniyor...</p>}>
      <SupplierListContent />
    </Suspense>
  );
}