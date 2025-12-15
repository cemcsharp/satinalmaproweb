"use client";
import { useEffect, useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import SearchInput from "@/components/ui/SearchInput";
import FilterInput from "@/components/ui/FilterInput";
import Pagination from "@/components/ui/Pagination";
import Select from "@/components/ui/Select";
import { TableContainer, Table, THead, TBody, TR, TH, TD } from "@/components/ui/Table";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import IconButton from "@/components/ui/IconButton";
import Skeleton from "@/components/ui/Skeleton";

type MeetingRow = {
  id: string;
  title: string;
  startAt: string;
  endAt: string | null;
  status: string;
  organizer: string | null;
  location: string | null;
};

export default function ToplantiListePage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string | "">("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "title">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [items, setItems] = useState<MeetingRow[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (status) params.set("status", status);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    params.set("sortBy", sortBy);
    params.set("sortDir", sortDir);
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));

    setLoading(true);
    fetch(`/api/toplanti?${params.toString()}`)
      .then(async (res) => {
        const data = await res.json();
        setItems((data.items ?? []) as MeetingRow[]);
        setTotal(Number(data.total ?? 0));
      })
      .finally(() => setLoading(false));
  }, [query, status, dateFrom, dateTo, sortBy, sortDir, page, pageSize]);

  const pages = Math.max(1, Math.ceil(total / pageSize));

  const statusVariant = (s: string): "default" | "success" | "warning" | "error" | "info" => {
    const v = (s || "").toLowerCase();
    if (v === "completed" || v === "tamamlandı") return "success";
    if (v === "cancelled" || v === "iptal") return "error";
    if (v === "planned" || v === "planlandı") return "info";
    return "default";
  };

  const statusLabel = (s: string) => {
    const v = (s || "").toLowerCase();
    if (v === "completed") return "Tamamlandı";
    if (v === "cancelled") return "İptal";
    if (v === "planned") return "Planlandı";
    return s;
  };

  return (
    <section className="space-y-4">
      <PageHeader title="Toplantılar" gradient>
        <Link href="/toplanti/olustur">
          <Button variant="primary" size="sm">Yeni Toplantı</Button>
        </Link>
      </PageHeader>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Filtreler:</span>
        {query && (
          <button className="rounded-full bg-muted px-2 py-0.5 text-xs" onClick={() => { setQuery(""); setPage(1); }} aria-label="Arama filtresini temizle">q: {query} ✕</button>
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
        <Button variant="outline" size="sm" onClick={() => { setQuery(""); setStatus(""); setDateFrom(""); setDateTo(""); setPage(1); }}>Temizle</Button>
      </div>

      <div id="filters-panel" className={filtersOpen ? "grid grid-cols-1 gap-1 md:grid-cols-3 lg:grid-cols-5" : "hidden"}>
        <SearchInput
          placeholder="Başlık ara"
          defaultValue={query}
          onSearch={(val) => { setQuery(val); setPage(1); }}
        />
        <Select size="sm" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Durum (tümü)</option>
          <option value="planned">Planlandı</option>
          <option value="completed">Tamamlandı</option>
          <option value="cancelled">İptal</option>
        </Select>
        <FilterInput type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        <FilterInput type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        <Select size="sm" value={sortBy} onChange={(e) => setSortBy((e.target.value as any) === "title" ? "title" : "date")}>
          <option value="date">Tarih</option>
          <option value="title">Başlık</option>
        </Select>
        <Select size="sm" value={sortDir} onChange={(e) => setSortDir((e.target.value as any) === "asc" ? "asc" : "desc")}>
          <option value="desc">Azalan</option>
          <option value="asc">Artan</option>
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
              <TH>Başlık</TH>
              <TH>Tarih</TH>
              <TH>Durum</TH>
              <TH>Organizatör</TH>
              <TH>Konum</TH>
              <TH className="w-[1%] whitespace-nowrap text-right">İşlemler</TH>
            </TR>
          </THead>
          <TBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TR key={`skeleton-${i}`}>
                  <TD><Skeleton height={16} /></TD>
                  <TD><Skeleton height={16} /></TD>
                  <TD><Skeleton height={16} /></TD>
                  <TD><Skeleton height={16} /></TD>
                  <TD><Skeleton height={16} /></TD>
                  <TD><Skeleton height={16} /></TD>
                </TR>
              ))
            ) : items.length === 0 ? (
              <TR><TD colSpan={6}>Kayıt bulunamadı</TD></TR>
            ) : (
              items.map((it) => (
                <TR key={it.id} className="group hover:shadow-sm transition-shadow">
                  <TD className="text-primary">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500/10 to-rose-500/10 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <Link href={`/toplanti/detay/${encodeURIComponent(it.id)}`} className="hover:underline font-semibold text-slate-700">
                        {it.title}
                      </Link>
                    </div>
                  </TD>
                  <TD>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm text-slate-600">{new Date(it.startAt).toLocaleString("tr-TR")}</span>
                    </div>
                  </TD>
                  <TD><Badge variant={statusVariant(it.status)} className="shadow-sm font-medium">{statusLabel(it.status)}</Badge></TD>
                  <TD>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="text-sm text-slate-600">{it.organizer || "-"}</span>
                    </div>
                  </TD>
                  <TD>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-sm text-slate-600">{it.location || "-"}</span>
                    </div>
                  </TD>
                  <TD className="text-right">
                    <div className="inline-flex items-center gap-1 sm:gap-2">
                      <Link href={`/toplanti/detay/${encodeURIComponent(it.id)}`} title="Görüntüle">
                        <IconButton icon="eye" label="Görüntüle" size="sm" />
                      </Link>
                      {/* Edit and Delete actions can be added here if needed */}
                    </div>
                  </TD>
                </TR>
              ))
            )}
          </TBody>
        </Table>
      </TableContainer>

      <Pagination
        currentPage={page}
        totalPages={pages}
        onPageChange={setPage}
        pageSize={pageSize}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
        totalItems={total}
      />
    </section>
  );
}
