"use client";
import React, { useEffect, useState, Suspense, useMemo } from "react";
import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import { TableContainer, Table, THead, TBody, TR, TH, TD } from "@/components/ui/Table";
import Select from "@/components/ui/Select";
import Badge from "@/components/ui/Badge";
import Skeleton from "@/components/ui/Skeleton";
import * as XLSX from "xlsx";
import Card from "@/components/ui/Card";

type CapaItem = {
  id: string;
  title: string;
  description?: string;
  correctiveAction?: string;
  preventiveAction?: string;
  supplierId: string;
  supplier?: { id: string; name: string };
  orderId?: string | null;
  order?: { id: string; barcode: string | null } | null;
  evaluationId?: string | null;
  status: "open" | "in_progress" | "closed";
  createdAt?: string;
};

function StatusBadge({ status }: { status: CapaItem["status"] }) {
  const map: Record<CapaItem["status"], { label: string; variant: Parameters<typeof Badge>[0]["variant"] }> = {
    open: { label: "Açık", variant: "warning" },
    in_progress: { label: "Devam Ediyor", variant: "info" },
    closed: { label: "Kapalı", variant: "success" },
  };
  const s = map[status];
  return <Badge variant={s.variant}>{s.label}</Badge>;
}

function CapaListeContent() {
  const [items, setItems] = useState<CapaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");

  useEffect(() => {
    let active = true;
    // yüklenme başlangıcı initial state ile true
    fetch("/api/tedarikci/capa")
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        setItems(Array.isArray(data.items) ? data.items : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const filtered = items.filter((it) => (statusFilter ? it.status === statusFilter : true));
  const stats = useMemo(() => {
    const s = { open: 0, in_progress: 0, closed: 0 } as Record<string, number>;
    for (const it of items) {
      if (s[it.status] === undefined) s[it.status] = 0;
      s[it.status]++;
    }
    return s;
  }, [items]);
  const topSuppliers = useMemo(() => {
    const m = new Map<string, { name: string; count: number }>();
    for (const it of items) {
      const key = it.supplierId;
      const name = it.supplier?.name || it.supplierId;
      const v = m.get(key) || { name, count: 0 };
      v.count++;
      m.set(key, v);
    }
    return Array.from(m.values()).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [items]);

  const exportExcel = () => {
    const rows = filtered.map((it) => ({
      Baslik: it.title,
      Tedarikci: it.supplier?.name || it.supplierId,
      Siparis: it.order?.barcode || it.orderId || "-",
      Degerlendirme: it.evaluationId || "-",
      Durum: it.status,
      Acilis: it.createdAt ? new Date(it.createdAt).toLocaleDateString("tr-TR") : "-",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "DOF");
    XLSX.writeFile(wb, `DOF_Listesi_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  return (
    <div className="grid gap-3">
      <PageHeader title="DÖF Listesi" description="Düzeltici ve Önleyici Faaliyet kayıtları">
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)} size="sm" aria-label="Durum filtresi">
            <option value="">Tüm durumlar</option>
            <option value="open">Açık</option>
            <option value="in_progress">Devam Ediyor</option>
            <option value="closed">Kapalı</option>
          </Select>
          <Button variant="outline" size="sm" onClick={exportExcel}>Excel</Button>
          <Link href="/tedarikci/dof/olustur"><Button size="sm">Yeni DÖF</Button></Link>
        </div>
      </PageHeader>

      <Card compact>
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="rounded border p-2"><div className="text-[12px] text-muted-foreground">Açık</div><div className="text-base font-semibold">{stats.open || 0}</div></div>
          <div className="rounded border p-2"><div className="text-[12px] text-muted-foreground">Devam</div><div className="text-base font-semibold">{stats.in_progress || 0}</div></div>
          <div className="rounded border p-2"><div className="text-[12px] text-muted-foreground">Kapalı</div><div className="text-base font-semibold">{stats.closed || 0}</div></div>
        </div>
      </Card>

      <Card compact>
        <div className="grid gap-2">
          <div className="text-sm font-medium">Tekrarlayan Sorunlar</div>
          <div className="grid md:grid-cols-2 gap-2">
            {topSuppliers.length === 0 ? (
              <div className="text-[12px] text-muted-foreground">Veri yok</div>
            ) : topSuppliers.map((s) => (
              <div key={s.name} className="rounded border p-2 flex items-center justify-between text-sm">
                <div className="font-medium">{s.name}</div>
                <div className="text-[12px]">{s.count} kayıt</div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <TableContainer>
          <Table>
            <THead>
              <TR>
                <TH>Başlık</TH>
                <TH>Tedarikçi</TH>
                <TH>Sipariş</TH>
                <TH>Değerlendirme</TH>
                <TH>Durum</TH>
              </TR>
            </THead>
            <TBody>
              {loading ? (
                <TR>
                  <TD colSpan={5}>
                    <Skeleton height={28} />
                  </TD>
                </TR>
              ) : filtered.length === 0 ? (
                <TR>
                  <TD colSpan={5} className="text-muted-foreground">
                    Kayıt bulunamadı.
                  </TD>
                </TR>
              ) : (
                filtered.map((it) => (
                  <TR key={it.id}>
                    <TD>
                      <Link href={`/tedarikci/dof/${it.id}`} className="text-primary hover:underline">
                        {it.title}
                      </Link>
                    </TD>
                    <TD>{it.supplier?.name || it.supplierId}</TD>
                    <TD>{it.order?.barcode || it.orderId || "-"}</TD>
                    <TD>{it.evaluationId ?? "-"}</TD>
                    <TD>
                      <StatusBadge status={it.status} />
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

export default function CapaListePage() {
  return (
    <Suspense fallback={<div className="grid gap-2"><Skeleton height={24} /><Skeleton height={300} /></div>}>
      <CapaListeContent />
    </Suspense>
  );
}
