"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Skeleton from "@/components/ui/Skeleton";
import Badge from "@/components/ui/Badge";
import { TableContainer, Table, THead, TBody, TR, TH, TD } from "@/components/ui/Table";
import * as XLSX from "xlsx";
import { formatNumberTR } from "@/lib/format";
import { fetchJsonWithRetry } from "@/lib/http";

import Link from "next/link";
import ExportButtons, { ExportColumn } from "@/components/ui/ExportButtons";
import ImportExcel from "@/components/ui/ImportExcel";

type EvalItem = {
  id: string;
  supplierId: string;
  supplierName: string;
  orderId: string;
  orderBarcode: string | null;
  totalScore: number;
  submittedAt: string | null;
  comment: string | null;
};

type ListResponse = {
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
  items: EvalItem[];
};

function formatDateTR(iso: string | null): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat("tr-TR", { year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
  } catch {
    return iso || "";
  }
}

export default function SupplierEvaluationsPage() {
  const [activeTab, setActiveTab] = useState<"cards" | "scores">("cards");
  const [sort, setSort] = useState("latest");
  const [scoringType, setScoringType] = useState<string>("");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<EvalItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [supplierInput, setSupplierInput] = useState<string>("");
  const [supplierId, setSupplierId] = useState<string>("");
  const [supplierOpts, setSupplierOpts] = useState<{ id: string; name: string }[]>([]);
  const [minScore, setMinScore] = useState<string>("");
  const [maxScore, setMaxScore] = useState<string>("");

  const scoringOptions = [
    { code: "", label: "Tümü" },
    { code: "malzeme", label: "Malzeme" },
    { code: "hizmet", label: "Hizmet" },
    { code: "danismanlik", label: "Danışmanlık" },
    { code: "bakim", label: "Bakım" },
    { code: "insaat", label: "İnşaat" },
  ];

  const load = async (reset = false) => {
    try {
      setLoading(true);
      if (reset) {
        setPage(1);
      }
      const currentPage = reset ? 1 : page;
      const params = new URLSearchParams();
      params.set("sort", sort);
      if (scoringType) params.set("scoringType", scoringType);
      if (query.trim()) params.set("q", query.trim());
      if (supplierId) params.set("supplierId", supplierId);
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      params.set("page", String(currentPage));
      params.set("pageSize", String(20));
      const url = `/api/tedarikci/degerlendirme/liste?${params.toString()}`;

      const payload = await fetchJsonWithRetry<ListResponse>(url, { method: "GET", headers: { Accept: "application/json" } }, {
        retries: 2,
        backoffMs: 250,
        maxBackoffMs: 1500,
      });
      setHasMore(payload.hasMore);
      setItems((prev) => (reset ? payload.items : [...prev, ...payload.items]));
      setInitialLoaded(true);
    } catch (e) {
      console.error("[evals] fetch error", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(true);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      load(true);
    }, 300);
    return () => clearTimeout(t);
  }, [sort, scoringType, query, supplierId, from, to]);

  const onLoadMore = () => {
    if (loading || !hasMore) return;
    setPage((p) => p + 1);
  };

  useEffect(() => {
    if (page > 1) {
      load(false);
    }
  }, [page]);

  useEffect(() => {
    const t = setTimeout(async () => {
      const q = supplierInput.trim();
      if (q.length < 2) {
        setSupplierOpts([]);
        return;
      }
      try {
        const res = await fetchJsonWithRetry<{ items: { id: string; name: string }[] }>(
          `/api/tedarikci/ara?q=${encodeURIComponent(q)}`,
          { method: "GET", headers: { Accept: "application/json" } },
          { retries: 2, backoffMs: 200, maxBackoffMs: 1000 }
        );
        setSupplierOpts(res.items || []);
      } catch (e) {
        setSupplierOpts([]);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [supplierInput]);

  const clearSupplier = () => {
    setSupplierId("");
    setSupplierInput("");
    setSupplierOpts([]);
  };

  const handleImport = async (data: any[]) => {
    // Bulk create logic would go here.
    alert("Toplu ekleme özelliği backend entegrasyonu bekliyor.");
  };

  const exportColumns: ExportColumn[] = [
    { header: "Tedarikçi", accessor: "supplierName" },
    { header: "Sipariş", accessor: (row) => row.orderBarcode ?? "-" },
    { header: "Puan", accessor: (row) => Math.round(row.totalScore ?? 0) },
    { header: "Tarih", accessor: (row) => formatDateTR(row.submittedAt) },
    { header: "Yorum", accessor: (row) => row.comment ?? "-" },
  ];

  const Empty = useMemo(() => (
    <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
      <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
      </div>
      <h3 className="text-lg font-medium text-slate-900 mb-1">Değerlendirme Bulunamadı</h3>
      <p className="text-slate-500">Arama kriterlerinize uygun değerlendirme kaydı bulunmamaktadır.</p>
    </div>
  ), []);

  const scoreDir: "ascending" | "descending" | null = sort === "lowest" ? "ascending" : sort === "highest" ? "descending" : null;
  const tableItems = useMemo(() => {
    const min = minScore.trim() ? Number(minScore) : null;
    const max = maxScore.trim() ? Number(maxScore) : null;
    return items.filter((it) => {
      const s = Math.round(it.totalScore ?? 0);
      if (min !== null && s < min) return false;
      if (max !== null && s > max) return false;
      return true;
    });
  }, [items, minScore, maxScore]);

  const scoreTone = (s: number): "success" | "warning" | "danger" => {
    if (s >= 80) return "success";
    if (s >= 50) return "warning";
    return "danger";
  };



  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Tedarikçi Değerlendirmeleri"
        description="Yapılan tüm değerlendirmeleri listeleyin, filtreleyin ve analiz edin."
        variant="default"
        actions={
          <Link href="/tedarikci/degerlendirme">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Yeni Değerlendirme
            </Button>
          </Link>
        }
      >
      </PageHeader>

      <Card variant="glass" className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select label="Sıralama" value={sort} onChange={(e) => setSort((e.target as HTMLSelectElement).value)}>
            <option value="latest">En Yeni</option>
            <option value="oldest">En Eski</option>
            <option value="highest">En Yüksek Puan</option>
            <option value="lowest">En Düşük Puan</option>
          </Select>

          <Select label="Puanlama Tipi" value={scoringType} onChange={(e) => setScoringType((e.target as HTMLSelectElement).value)}>
            {scoringOptions.map((opt) => (
              <option key={opt.code} value={opt.code}>{opt.label}</option>
            ))}
          </Select>

          <div className="md:col-span-2">
            <Input
              label="Tedarikçi Ara"
              placeholder="Tedarikçi adı ile ara..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="relative">
            <Input
              label="Tedarikçi Seç (Autocomplete)"
              placeholder="Örn: Kuzey Lojistik"
              value={supplierInput}
              onChange={(e) => setSupplierInput(e.target.value)}
            />
            {!!supplierOpts.length && !supplierId && (
              <div className="absolute z-10 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-xl max-h-48 overflow-auto">
                {supplierOpts.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className="block w-full text-left px-4 py-2 hover:bg-blue-50 text-sm text-slate-700 transition-colors"
                    onClick={() => { setSupplierId(opt.id); setSupplierInput(opt.name); setSupplierOpts([]); }}
                  >
                    {opt.name}
                  </button>
                ))}
              </div>
            )}
            {supplierId && (
              <button
                onClick={clearSupplier}
                className="absolute right-3 top-[34px] text-slate-400 hover:text-slate-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
          </div>

          <Input label="Başlangıç Tarihi" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input label="Bitiş Tarihi" type="date" value={to} onChange={(e) => setTo(e.target.value)} />

          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Min Puan"
              type="number"
              min={0}
              max={100}
              placeholder="0"
              value={minScore}
              onChange={(e) => setMinScore(e.target.value)}
            />
            <Input
              label="Maks Puan"
              type="number"
              min={0}
              max={100}
              placeholder="100"
              value={maxScore}
              onChange={(e) => setMaxScore(e.target.value)}
            />
          </div>
        </div>
      </Card>

      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        <button
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === "cards" ? "bg-white text-blue-600 border-b-2 border-blue-600" : "text-slate-500 hover:text-slate-700"}`}
          onClick={() => setActiveTab("cards")}
        >
          Kart Görünümü
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === "scores" ? "bg-white text-blue-600 border-b-2 border-blue-600" : "text-slate-500 hover:text-slate-700"}`}
          onClick={() => setActiveTab("scores")}
        >
          Liste Görünümü
        </button>
      </div>

      {!initialLoaded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="p-4 space-y-3">
              <div className="flex justify-between"><Skeleton width={100} height={20} /><Skeleton width={60} height={20} /></div>
              <Skeleton height={40} />
              <Skeleton height={20} />
            </Card>
          ))}
        </div>
      )}

      {initialLoaded && items.length === 0 && Empty}

      {activeTab === "cards" && initialLoaded && items.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((it) => (
            <Card key={it.id} variant="glass" className="hover:shadow-lg transition-all duration-200 group">
              <div className="flex items-center justify-between mb-3">
                <div className="font-semibold text-slate-800 truncate" title={it.supplierName}>{it.supplierName}</div>
                <div className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">{formatDateTR(it.submittedAt)}</div>
              </div>

              <div className="mb-4">
                <div className="flex items-baseline gap-1">
                  <span className={`text-3xl font-bold ${it.totalScore >= 80 ? "text-blue-600" : it.totalScore >= 50 ? "text-blue-600" : "text-red-600"}`}>
                    {formatNumberTR(it.totalScore ?? 0, 0)}
                  </span>
                  <span className="text-sm text-slate-400">/ 100</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${it.totalScore >= 80 ? "bg-sky-500" : it.totalScore >= 50 ? "bg-sky-500" : "bg-red-500"}`}
                    style={{ width: `${it.totalScore}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                {it.orderBarcode && (
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                    <span className="font-medium">{it.orderBarcode}</span>
                  </div>
                )}
                <div className="text-xs text-slate-500 line-clamp-2 min-h-[2.5em]">
                  {it.comment || "Yorum girilmemiş"}
                </div>
              </div>

              <Link href={`/tedarikci/degerlendirmeler/${encodeURIComponent(it.id)}`}>
                <Button variant="outline" fullWidth size="sm" className="group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-200">
                  Detayları Gör
                </Button>
              </Link>
            </Card>
          ))}
        </div>
      )}

      {activeTab === "scores" && initialLoaded && items.length > 0 && (
        <Card variant="glass" className="overflow-hidden">
          <TableContainer>
            <Table>
              <THead>
                <TR>
                  <TH>Tedarikçi</TH>
                  <TH sortable direction={scoreDir} onSort={() => setSort((prev) => (prev === "highest" ? "lowest" : "highest"))}>Puan</TH>
                  <TH>Değerlendirme Tarihi</TH>
                  <TH>Sipariş</TH>
                  <TH>İşlem</TH>
                </TR>
              </THead>
              <TBody>
                {tableItems.map((it) => {
                  const s = Math.round(it.totalScore ?? 0);
                  const tone = scoreTone(s);
                  return (
                    <TR key={it.id}>
                      <TD className="font-medium">{it.supplierName}</TD>
                      <TD>
                        <Badge variant={tone === "success" ? "success" : tone === "warning" ? "warning" : "error"}>
                          {s} / 100
                        </Badge>
                      </TD>
                      <TD>{formatDateTR(it.submittedAt)}</TD>
                      <TD>{it.orderBarcode ?? "-"}</TD>
                      <TD>
                        <Link href={`/tedarikci/degerlendirmeler/${encodeURIComponent(it.id)}`}>
                          <Button variant="ghost" size="sm">İncele</Button>
                        </Link>
                      </TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
        <div className="flex gap-2 items-center">
          <ImportExcel onDataReady={handleImport} />
          <ExportButtons
            data={items}
            columns={exportColumns}
            fileName={`degerlendirmeler-${new Date().toISOString().split("T")[0]}`}
            title="Tedarikçi Değerlendirmeleri"
          />
        </div>

        <Button variant="ghost" onClick={onLoadMore} disabled={!hasMore || loading} loading={loading}>
          {hasMore ? "Daha Fazla Göster" : "Tüm Kayıtlar Listelendi"}
        </Button>
      </div>
    </div>
  );
}