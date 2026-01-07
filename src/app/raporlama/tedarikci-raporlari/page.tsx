"use client";
import React, { useEffect, useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import { TableContainer, Table, THead, TBody, TR, TH, TD } from "@/components/ui/Table";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

type Summary = {
  supplierId: string;
  period: string;
  totalScore: number;
  decision: string;
};

function currentPeriod(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export default function SupplierReportsPage() {
  const { show } = useToast();
  const [period, setPeriod] = useState(currentPeriod());
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tedarikci/degerlendirme/otomatik?period=${period}`);
      if (!res.ok) throw new Error("Rapor alınamadı");
      const json = await res.json();
      setSummaries(json.summaries ?? []);
    } catch (e: any) {
      show({ title: "Hata", description: e.message ?? "Bilinmeyen hata", variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh();   }, [period]);

  const getDecisionBadge = (decision: string) => {
    switch (decision?.toLowerCase()) {
      case "onaylı": return "success";
      case "red": return "error";
      case "şartlı": return "warning";
      default: return "default";
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Tedarikçi Raporları"
        description="Dönemsel tedarikçi performans değerlendirmeleri."
        variant="gradient"
      />

      <Card variant="glass" className="p-6">
        <div className="flex items-end gap-4 max-w-md">
          <Input
            label="Dönem (YYYY-AA)"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            placeholder="YYYY-MM"
          />
          <Button onClick={refresh} loading={loading} className="mb-[2px]">Yenile</Button>
        </div>
      </Card>

      <Card variant="glass" className="overflow-hidden">
        <TableContainer>
          <Table>
            <THead>
              <TR>
                <TH>Tedarikçi</TH>
                <TH className="text-right">Toplam Skor</TH>
                <TH>Karar</TH>
              </TR>
            </THead>
            <TBody>
              {summaries.map((s: any) => (
                <TR key={`${s.supplierId}-${s.period}`}>
                  <TD className="font-medium">{s.supplierId}</TD>
                  <TD className="text-right font-bold text-slate-700">{s.totalScore}</TD>
                  <TD>
                    <Badge variant={getDecisionBadge(s.decision)}>{s.decision}</Badge>
                  </TD>
                </TR>
              ))}
              {summaries.length === 0 && (
                <TR>
                  <TD colSpan={3} className="text-center py-12 text-muted-foreground">
                    Bu dönem için rapor bulunamadı.
                  </TD>
                </TR>
              )}
            </TBody>
          </Table>
        </TableContainer>
      </Card>
    </div>
  );
}