"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import Link from "next/link";
import IconButton from "@/components/ui/IconButton";
import { render, contractTemplates } from "@/lib/template";
import jsPDF from "jspdf";

type Attachment = { id: string; title: string; url: string; mimeType: string };
type Event = { id: string; type: string; date: string; note?: string };
type History = { id: string; date: string; fromStatus: string; toStatus: string; version: number };
type Revision = { id: string; createdAt: string; pending: boolean; changes?: any };

export default function ContractViewPage() {
  const params = useParams();
  const id = String(params?.id || "");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [eventOpen, setEventOpen] = useState(false);
  const [eventType, setEventType] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventNote, setEventNote] = useState("");
  const [eventSaving, setEventSaving] = useState(false);
  const [attOpen, setAttOpen] = useState(false);
  const [attTitle, setAttTitle] = useState("");
  const [attUrl, setAttUrl] = useState("");
  const [attMime, setAttMime] = useState("application/pdf");
  const [attSaving, setAttSaving] = useState(false);

  useEffect(() => {
    (async () => {
      if (!id) return;
      try {
        const res = await fetch(`/api/sozlesme/${id}`);
        if (!res.ok) {
          let code = `HTTP ${res.status}`;
          try {
            const body = await res.json();
            code = body?.code || code;
          } catch {}
          if (code === "unauthorized") {
            setError("Yetkisiz erişim");
          } else if (code === "not_found") {
            setError("Sözleşme bulunamadı");
          } else {
            setError("Sözleşme yüklenemedi");
          }
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

  if (loading) return <section><PageHeader title="Sözleşme" /><div>Yükleniyor…</div></section>;
  if (error) return <section><PageHeader title="Sözleşme" /><div className="text-red-600">{error}</div></section>;
  if (!data) return <section><PageHeader title="Sözleşme" /><div>Bulunamadı</div></section>;

  const attachments = (data.attachments || []) as Attachment[];
  const events = (data.events || []) as Event[];
  const histories = (data.histories || []) as History[];
  const revisions = (data.revisions || []) as Revision[];
  const pdfs = attachments.filter((a) => a.mimeType === "application/pdf" || (a.url || "").toLowerCase().endsWith(".pdf"));

  const buildContractText = (): string => {
    const tplKey = String(data.template || "") as keyof typeof contractTemplates;
    const tpl = (tplKey && (contractTemplates as any)[tplKey]) || contractTemplates.standart;
    const orderBarcode = (data.order?.barcode || "");
    return render(tpl, {
      parties: String(data.parties || ""),
      startDate: data.startDate ? new Date(data.startDate).toISOString().slice(0, 10) : "",
      endDate: data.endDate ? new Date(data.endDate).toISOString().slice(0, 10) : "",
      orderBarcode,
      summary: "",
      method: "",
      orderTotal: 0,
      currency: "",
    });
  };

  const exportPdf = () => {
    try {
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const text = buildContractText();
      const lines = doc.splitTextToSize(text, 520);
      doc.text(lines, 40, 60);
      const name = `${data.number || "Sozlesme"}.pdf`;
      doc.save(name);
    } catch {}
  };

  const exportWord = () => {
    try {
      const text = buildContractText();
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${data.number || "Sözleşme"}</title></head><body><pre style="font-family: Arial, sans-serif; white-space: pre-wrap;">${text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")}</pre></body></html>`;
      const blob = new Blob([html], { type: "application/msword" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${data.number || "Sozlesme"}.doc`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {}
  };

  return (
    <section className="space-y-6">
      <PageHeader title={`Sözleşme ${data.number}`} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded border-[var(--border)] p-3">
          <div className="text-sm text-gray-600">Durum</div>
          <div className="mt-1 inline-flex items-center gap-2 rounded bg-blue-50 px-2 py-1 text-sm">
            <span className="font-medium">{data.status}</span>
            <span className="text-xs text-gray-500">v{data.version}</span>
          </div>
          <div className="mt-3 text-sm text-gray-600">Sözleşme No</div>
          <div className="mt-1 text-sm">{data.number}</div>
          <div className="mt-3 text-sm text-gray-600">Başlık</div>
          <div className="mt-1 text-sm">{data.title}</div>
          <div className="mt-3 text-sm text-gray-600">Tür</div>
          <div className="mt-1 text-sm">{data.type || "—"}</div>
          <div className="mt-3 text-sm text-gray-600">Şablon</div>
          <div className="mt-1 text-sm">{data.template || "—"}</div>
          <div className="mt-3 text-sm text-gray-600">Taraflar</div>
          <div className="mt-1 text-sm">{data.parties}</div>
          <div className="mt-3 text-sm text-gray-600">Tarih Aralığı</div>
          <div className="mt-1 text-sm">
            {data.startDate ? new Date(data.startDate).toLocaleDateString() : "—"}
            {" "}–{" "}
            {data.endDate ? new Date(data.endDate).toLocaleDateString() : "—"}
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Button size="sm" onClick={exportPdf}>PDF’e Dışa Aktar</Button>
            <Button size="sm" variant="outline" onClick={exportWord}>Word’e Dışa Aktar</Button>
          </div>
        </div>

        <div className="rounded border-[var(--border)] p-3">
          <div className="text-sm font-semibold">Ekler ve Dokümanlar</div>
          <div className="mt-2 flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setAttOpen((v) => !v)}>{attOpen ? "İptal" : "Ek Ekle"}</Button>
          </div>
          {attOpen && (
            <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
              <input className="rounded border p-2 text-sm" placeholder="Başlık" value={attTitle} onChange={(e) => setAttTitle((e.target as HTMLInputElement).value)} />
              <input className="rounded border p-2 text-sm" placeholder="URL" value={attUrl} onChange={(e) => setAttUrl((e.target as HTMLInputElement).value)} />
              <select className="rounded border p-2 text-sm" value={attMime} onChange={(e) => setAttMime((e.target as HTMLSelectElement).value)}>
                <option value="application/pdf">PDF</option>
                <option value="text/plain">Metin</option>
                <option value="application/vnd.openxmlformats-officedocument.wordprocessingml.document">Word</option>
              </select>
              <div className="md:col-span-3 flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => { setAttTitle(""); setAttUrl(""); setAttMime("application/pdf"); }}>Temizle</Button>
                <Button size="sm" onClick={async () => {
                  try {
                    setAttSaving(true);
                    const res = await fetch(`/api/sozlesme/${id}/attachments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: attTitle, url: attUrl, mimeType: attMime }) });
                    const j = await res.json().catch(() => ({}));
                    if (!res.ok) throw new Error(j?.error || "attachment_create_failed");
                    setAttOpen(false);
                    setAttTitle(""); setAttUrl(""); setAttMime("application/pdf");
                    const r = await fetch(`/api/sozlesme/${id}`);
                    const next = await r.json();
                    setData(next);
                  } catch {}
                  finally { setAttSaving(false); }
                }} disabled={attSaving}>{attSaving ? "Kaydediliyor…" : "Kaydet"}</Button>
              </div>
            </div>
          )}
          {attachments.length === 0 && <div className="mt-2 text-sm text-gray-600">Ek bulunmuyor</div>}
          {attachments.length > 0 && (
            <ul className="mt-2 space-y-2">
              {attachments.map((a) => (
                <li key={a.id} className="flex items-center justify-between">
                  <div>
                    <div className="text-sm">{a.title}</div>
                    <div className="text-xs text-gray-500">{a.mimeType}</div>
                  </div>
                  <a href={a.url} target="_blank" rel="noreferrer" className="text-blue-600 underline">Önizle</a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {pdfs.length > 0 && (
        <div className="rounded border-[var(--border)] p-3">
          <div className="text-sm font-semibold">PDF Önizleme</div>
          <div className="mt-2">
            <object data={pdfs[0].url} type="application/pdf" className="w-full h-[480px]" aria-label="PDF Önizleme">
              <iframe src={pdfs[0].url} className="w-full h-[480px]" title="PDF Önizleme"></iframe>
            </object>
            {pdfs.length > 1 && (
              <div className="mt-2 text-xs text-gray-500">Birden fazla PDF var, listeden diğerlerini açabilirsiniz.</div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded border-[var(--border)] p-3">
          <div className="text-sm font-semibold">İş Akışı ve Geçmiş</div>
          {histories.length === 0 && <div className="mt-2 text-sm text-gray-600">Geçmiş yok</div>}
          {histories.length > 0 && (
            <ul className="mt-2 space-y-1">
              {histories.map((h) => (
                <li key={h.id} className="text-sm">
                  {new Date(h.date).toLocaleString()} · {h.fromStatus} → {h.toStatus} · v{h.version}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded border-[var(--border)] p-3">
          <div className="text-sm font-semibold">Zaman Çizelgesi ve Önemli Tarihler</div>
          <div className="mt-2 flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setEventOpen((v) => !v)}>{eventOpen ? "İptal" : "Etkinlik Ekle"}</Button>
          </div>
          {eventOpen && (
            <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
              <select className="rounded border p-2 text-sm" value={eventType} onChange={(e) => setEventType((e.target as HTMLSelectElement).value)}>
                <option value="">Tür</option>
                <option value="milestone">Kilometre Taşı</option>
                <option value="reminder">Hatırlatma</option>
                <option value="extension">Uzatma</option>
              </select>
              <input className="rounded border p-2 text-sm" type="date" value={eventDate} onChange={(e) => setEventDate((e.target as HTMLInputElement).value)} />
              <input className="rounded border p-2 text-sm" placeholder="Not" value={eventNote} onChange={(e) => setEventNote((e.target as HTMLInputElement).value)} />
              <div className="md:col-span-3 flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => { setEventType(""); setEventDate(""); setEventNote(""); }}>Temizle</Button>
                <Button size="sm" onClick={async () => {
                  try {
                    setEventSaving(true);
                    const res = await fetch(`/api/sozlesme/${id}/events`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: eventType, date: eventDate, note: eventNote || undefined }) });
                    const j = await res.json().catch(() => ({}));
                    if (!res.ok) throw new Error(j?.error || "event_create_failed");
                    setEventOpen(false);
                    setEventType(""); setEventDate(""); setEventNote("");
                    const r = await fetch(`/api/sozlesme/${id}`);
                    const next = await r.json();
                    setData(next);
                  } catch {}
                  finally { setEventSaving(false); }
                }} disabled={eventSaving}>{eventSaving ? "Kaydediliyor…" : "Kaydet"}</Button>
              </div>
            </div>
          )}
          {events.length === 0 && <div className="mt-2 text-sm text-gray-600">Kayıt yok</div>}
          {events.length > 0 && (
            <ul className="mt-2 space-y-1">
              {events.map((ev) => (
                <li key={ev.id} className="text-sm">
                  {new Date(ev.date).toLocaleDateString()} · {ev.type}{ev.note ? ` – ${ev.note}` : ""}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="rounded border-[var(--border)] p-3">
        <div className="text-sm font-semibold">Değişiklik Revizyonları</div>
        {revisions.length === 0 && <div className="mt-2 text-sm text-gray-600">Revizyon yok</div>}
        {revisions.length > 0 && (
          <ul className="mt-2 space-y-2">
            {revisions.map((r) => (
              <li key={r.id} className="flex items-center justify-between text-sm">
                <div>
                  {new Date(r.createdAt).toLocaleString()} · {r.pending ? "Onay bekliyor" : "Onaylandı"}
                </div>
                {r.pending && (
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={async () => {
                      try {
                        const res = await fetch(`/api/sozlesme/${id}?confirm=true`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(r.changes || {}) });
                        if (!res.ok) throw new Error(`HTTP ${res.status}`);
                        const next = await fetch(`/api/sozlesme/${id}`).then((rr) => rr.json());
                        setData(next);
                      } catch {}
                    }}>Onayla ve Uygula</Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex gap-2">
        <Link href={`/sozlesme/duzenle/${id}`}>
          <IconButton icon="edit" label="Düzenle" variant="outline" size="sm" title="Sözleşmeyi düzenle" />
        </Link>
      </div>
    </section>
  );
}