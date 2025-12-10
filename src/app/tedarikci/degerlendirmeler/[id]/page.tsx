'use client';

import { useEffect, useRef, useState, useMemo } from "react";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import Button from "@/components/ui/Button";
import { fetchJsonWithRetry } from "@/lib/http";
import { formatNumberTR, formatDateTR } from "@/lib/format";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import Badge from "@/components/ui/Badge";

type AnswerItem = {
  id: string;
  questionId: string;
  questionText: string;
  section: string | null;
  type: string | null;
  scoringType: { code: string; name: string } | null;
  value: string;
};

type DetailItem = {
  id: string;
  supplierId: string;
  supplierName: string;
  orderId: string;
  orderBarcode: string | null;
  submittedAt: string | null;
  totalScore: number | null;
  answers: AnswerItem[];
};

export default function EvaluationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params?.id || "");
  const [item, setItem] = useState<DetailItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchJsonWithRetry<{ item: DetailItem }>(
          `/api/tedarikci/degerlendirme/${encodeURIComponent(id)}`,
          { method: "GET", headers: { Accept: "application/json" } },
          { retries: 2, backoffMs: 300, maxBackoffMs: 1200 }
        );
        if (mounted) setItem(res.item);
      } catch (e: unknown) {
        if (mounted) setError("Detay yüklenemedi");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  const grouped = (() => {
    const map: Record<string, AnswerItem[]> = {};
    (item?.answers || []).forEach((a) => {
      const key = String(a.section || "");
      if (!map[key]) map[key] = [];
      map[key].push(a);
    });
    // sort questions inside group by question text
    Object.keys(map).forEach((k) => map[k].sort((x, y) => x.questionText.localeCompare(y.questionText)));
    return map;
  })();

  const orderedSections = useMemo(() => {
    const keys = Object.keys(grouped);
    const order = ["A", "B", "C", ""]; // empty for "Diğer"
    return keys.sort((a, b) => order.indexOf(a) - order.indexOf(b));
  }, [grouped]);

  const handlePrint = () => {
    window.print();
  };

  const handlePdf = async () => {
    const node = printRef.current;
    if (!node) return handlePrint();
    const canvas = await html2canvas(node, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    const pageW = 210;
    const pageH = 297;
    const imgW = pageW - 20;
    const imgH = (canvas.height * imgW) / canvas.width;
    const y = 10;
    if (imgH < pageH - 20) {
      pdf.addImage(imgData, "PNG", 10, y, imgW, imgH);
    } else {
      let remaining = imgH;
      const sliceH = pageH - 20;
      while (remaining > 0) {
        const sH = Math.min(sliceH, remaining);
        pdf.addImage(imgData, "PNG", 10, 10, imgW, sH, undefined, "FAST");
        remaining -= sH;
        if (remaining > 0) pdf.addPage();
      }
    }
    pdf.save(`degerlendirme-${item?.id || "rapor"}.pdf`);
  };

  if (loading) {
    return (
      <section className="space-y-6" aria-busy="true" aria-live="polite">
        <div className="border-b border-slate-200 pb-4">
          <div className="flex items-center gap-4">
            <Skeleton height={32} className="w-64" />
            <div className="ml-auto flex gap-3">
              <Skeleton height={40} className="w-28" />
              <Skeleton height={40} className="w-32" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6">
          <Skeleton height={160} />
          <Skeleton height={300} />
          <Skeleton height={300} />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        {error}
      </div>
    );
  }

  if (!item) return <p className="text-sm text-slate-500">Kayıt bulunamadı.</p>;

  return (
    <div className="space-y-6">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-sheet { margin: 0 auto; width: 210mm; min-height: 297mm; padding: 16mm; background: #fff; color: #111; }
          .print-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12mm; border-bottom: 1px solid #ddd; padding-bottom: 6mm; }
          .print-title { font-size: 20px; font-weight: 700; }
          .print-meta { font-size: 12px; color: #333; }
          .print-table { width: 100%; border-collapse: collapse; margin-top: 6mm; }
          .print-table th, .print-table td { border: 1px solid #ddd; padding: 6px 8px; font-size: 12px; }
          .print-footer { margin-top: 12mm; display: grid; grid-template-columns: 1fr 1fr; gap: 8mm; }
          .print-sign { border-top: 1px solid #999; padding-top: 3mm; font-size: 12px; }
        }
        @media screen {
          .print-sheet { display: none; }
        }
      `}</style>
      <PageHeader
        title="Değerlendirme Detayı"
        description="Tek değerlendirme için soru-cevap ayrıntıları"
        variant="gradient"
      >
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={() => router.push("/tedarikci/degerlendirmeler")} className="bg-white/10 hover:bg-white/20 text-white border-white/20">Listeye Dön</Button>
          <Button variant="outline" size="sm" onClick={handlePdf} className="bg-white/10 hover:bg-white/20 text-white border-white/20">PDF İndir</Button>
          <Button variant="outline" size="sm" onClick={handlePrint} className="bg-white/10 hover:bg-white/20 text-white border-white/20">Yazdır</Button>
        </div>
      </PageHeader>

      <div className="space-y-6">
        <Card variant="glass" className="no-print overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200/60 bg-slate-50/50 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
            </div>
            <h3 className="font-semibold text-slate-800">Genel Bilgiler</h3>
          </div>
          <div className="p-6 grid gap-6 md:grid-cols-4">
            <div className="space-y-1">
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Tedarikçi</div>
              <div className="font-medium text-slate-900">{item.supplierName}</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Tarih</div>
              <div className="font-medium text-slate-900">{item.submittedAt ? formatDateTR(item.submittedAt) : "-"}</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Toplam Puan</div>
              <div className="font-bold text-lg text-blue-600">{item.totalScore != null ? `${formatNumberTR(item.totalScore, 0)} / 100` : "-"}</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Sipariş</div>
              <div className="font-medium text-slate-900">{item.orderBarcode || "-"}</div>
            </div>
          </div>
        </Card>

        {orderedSections.map((section) => (
          <div key={section} className="space-y-4 no-print">
            <div className="flex items-center gap-2 px-1">
              <div className="h-6 w-1 bg-blue-500 rounded-full"></div>
              <h3 className="text-lg font-semibold text-slate-800">{section ? `Bölüm ${section}` : "Diğer"}</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {grouped[section].map((a) => (
                <Card key={a.id} variant="glass" className="hover:shadow-md transition-all duration-200">
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="text-sm font-medium text-slate-800">{a.questionText}</div>
                      <Badge variant="default" className="shrink-0 text-[10px]">{a.scoringType ? a.scoringType.name : a.type || "Soru"}</Badge>
                    </div>
                    <div className="pt-3 border-t border-slate-100">
                      <div className="text-xs text-slate-500 mb-1">Cevap</div>
                      <div className="font-semibold text-blue-700 bg-blue-50 inline-block px-3 py-1 rounded-lg">{a.value}</div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}

        <div className="print-sheet" ref={printRef} aria-hidden>
          <div className="print-header">
            <div className="print-title">Tedarikçi Değerlendirme Raporu</div>
            <div className="print-meta">
              <div>ID: {item.id}</div>
              <div>Tarih: {item.submittedAt ? formatDateTR(item.submittedAt) : "-"}</div>
            </div>
          </div>
          <table className="print-table">
            <tbody>
              <tr>
                <th style={{ width: "25%" }}>Tedarikçi</th>
                <td>{item.supplierName}</td>
              </tr>
              <tr>
                <th>Sipariş</th>
                <td>{item.orderBarcode || "-"}</td>
              </tr>
              <tr>
                <th>Toplam Puan</th>
                <td>{item.totalScore != null ? `${formatNumberTR(item.totalScore, 0)} / 100` : "-"}</td>
              </tr>
            </tbody>
          </table>
          {orderedSections.map((section) => (
            <div key={`p-${section}`} style={{ marginTop: "8mm" }}>
              <div style={{ fontWeight: 700, marginBottom: "3mm" }}>{section ? `Bölüm ${section}` : "Diğer"}</div>
              <table className="print-table">
                <thead>
                  <tr>
                    <th style={{ width: "70%" }}>Soru</th>
                    <th style={{ width: "30%" }}>Cevap</th>
                  </tr>
                </thead>
                <tbody>
                  {grouped[section].map((a) => (
                    <tr key={`row-${a.id}`}>
                      <td>{a.questionText}</td>
                      <td style={{ fontWeight: 600 }}>{a.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
          <div className="print-footer">
            <div>
              <div className="print-sign">Değerlendiren İmza</div>
              <div className="print-meta">Ad, Ünvan, Tarih</div>
            </div>
            <div>
              <div className="print-sign">Onay İmza</div>
              <div className="print-meta">Ad, Ünvan, Tarih</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}