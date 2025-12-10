"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

export default function ContractReviewPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params?.id || "");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    (async () => {
      if (!id) return;
      try {
        const res = await fetch(`/api/sozlesme/${id}/analyze`);
        if (!res.ok) {
          let code = `HTTP ${res.status}`;
          try { const body = await res.json(); code = body?.code || code; } catch {}
          if (code === "unauthorized") setError("Yetkisiz erişim");
          else if (code === "not_found") setError("Sözleşme bulunamadı");
          else setError("Analiz yüklenemedi");
          setData(null);
        } else {
          const json = await res.json();
          setData(json);
          setError("");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  return (
    <section className="space-y-4">
      <PageHeader title="Sözleşme İncele" description="Sözleşme metrikleri ve öneriler" />
      {loading && <div>Yükleniyor…</div>}
      {error && <div className="text-red-600">{error}</div>}
      {!loading && !error && data && (
        <div className="space-y-4">
          <Card title="Özet">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><div className="text-xs text-gray-600">Numara</div><div className="font-medium">{data.number}</div></div>
              <div><div className="text-xs text-gray-600">Başlık</div><div className="font-medium">{data.title}</div></div>
              <div><div className="text-xs text-gray-600">Durum</div><div className="font-medium">{data.status}</div></div>
              <div><div className="text-xs text-gray-600">Versiyon</div><div className="font-medium">{data.version}</div></div>
            </div>
          </Card>
          <Card title="Metrikler">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Metric label="Bitişe kalan (gün)" value={data.metrics?.daysUntilEnd ?? "—"} />
              <Metric label="Sözleşme süresi (gün)" value={data.metrics?.durationDays ?? "—"} />
              <Metric label="Süresi doldu mu" value={data.metrics?.isExpired ? "Evet" : "Hayır"} />
              <Metric label="PDF eki var mı" value={data.metrics?.hasPdf ? "Evet" : "Hayır"} />
              <Metric label="Bekleyen revizyon" value={data.metrics?.pendingRevisionCount ?? 0} />
              <Metric label="Planlı etkinlik sayısı" value={data.metrics?.eventCount ?? 0} />
            </div>
          </Card>
          <Card title="Öneriler">
            {Array.isArray(data.suggestions) && data.suggestions.length > 0 ? (
              <ul className="list-disc pl-6 space-y-1">
                {data.suggestions.map((s: string, i: number) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            ) : (
              <div>Öneri yok. Her şey yolunda görünüyor.</div>
            )}
          </Card>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push(`/sozlesme/${id}`)}>Görüntüle</Button>
            <Button variant="primary" onClick={() => router.push(`/sozlesme/duzenle/${id}`)}>Düzenle</Button>
          </div>
        </div>
      )}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-xl border-[var(--border)] bg-card p-3">
      <div className="text-xs text-gray-600">{label}</div>
      <div className="text-lg font-semibold">{String(value)}</div>
    </div>
  );
}