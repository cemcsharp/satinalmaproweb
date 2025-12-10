"use client";
import { useEffect, useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import Skeleton from "@/components/ui/Skeleton";
import { useParams, useRouter } from "next/navigation";
import IconButton from "@/components/ui/IconButton";

type Meeting = {
  id: string;
  title: string;
  startAt: string;
  endAt?: string | null;
  status: string;
  location?: string | null;
  organizer?: { username?: string | null } | null;
  attendees?: Array<{ id: string; email?: string | null; user?: { username?: string | null } | null }>;
  notes?: Array<{ id: string; content: string; createdAt?: string | null; author?: { username?: string | null } | null }>;
  actionItems?: Array<{ id: string; title: string; status: string; owner?: { username?: string | null } | null; dueDate?: string | null }>;
};

export default function ToplantiDetayPage() {
  const params = useParams();
  const router = useRouter();
  const id = String((params as any)?.id || "");
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loadedOnce, setLoadedOnce] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [actionTitle, setActionTitle] = useState("");
  const [actionDue, setActionDue] = useState("");

  useEffect(() => {
    if (!id) return;
    fetch(`/api/toplanti/${encodeURIComponent(id)}`)
      .then(async (r) => (r.ok ? r.json() : Promise.reject(new Error("Detay alınamadı"))))
      .then((m) => setMeeting(m as Meeting))
      .catch((e) => setError(e.message || "Hata"))
      .finally(() => setLoadedOnce(true));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const es = new EventSource(`/api/toplanti/sse/${encodeURIComponent(id)}`);
    const refresh = () => {
      fetch(`/api/toplanti/${encodeURIComponent(id)}`).then((r) => r.json()).then((m) => setMeeting(m as Meeting)).catch(() => { });
    };
    es.addEventListener("note_created", refresh);
    es.addEventListener("action_created", refresh);
    es.addEventListener("meeting_created", refresh);
    return () => { try { es.close(); } catch { } };
  }, [id]);

  const addNote = async () => {
    const content = noteText.trim();
    if (!content) return;
    await fetch(`/api/toplanti/${encodeURIComponent(id)}/notes`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content }) });
    setNoteText("");
    const m = await fetch(`/api/toplanti/${encodeURIComponent(id)}`).then((r) => r.json());
    setMeeting(m);
  };

  const addAction = async () => {
    const title = actionTitle.trim();
    const dueDate = actionDue || undefined;
    if (!title) return;
    await fetch(`/api/toplanti/${encodeURIComponent(id)}/actions`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, dueDate }) });
    setActionTitle("");
    setActionDue("");
    const m = await fetch(`/api/toplanti/${encodeURIComponent(id)}`).then((r) => r.json());
    setMeeting(m);
  };

  if (!loadedOnce) {
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
  if (error) return (
    <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 flex items-center gap-2">
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      {error}
    </div>
  );
  if (!meeting) return <p className="text-sm text-slate-500">Bulunamadı</p>;

  return (
    <section className="space-y-6">
      <PageHeader
        title={meeting.title}
        description={meeting.startAt ? `Başlangıç: ${new Date(meeting.startAt).toLocaleString("tr-TR")}` : undefined}
        variant="gradient"
      >
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={() => router.push(`/toplanti/liste`)} className="bg-white/10 hover:bg-white/20 text-white border-white/20">Listeye Dön</Button>
        </div>
      </PageHeader>

      <Card variant="glass" className="overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200/60 bg-slate-50/50 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>
          <h3 className="font-semibold text-slate-800">Toplantı Detayları</h3>
        </div>
        <div className="p-6 grid sm:grid-cols-2 gap-6">
          <div className="space-y-1">
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Başlangıç</div>
            <div className="text-sm font-medium text-slate-900">{new Date(meeting.startAt).toLocaleString("tr-TR")}</div>
          </div>
          {meeting.location && (
            <div className="space-y-1">
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Konum</div>
              <div className="text-sm font-medium text-slate-900">{meeting.location}</div>
            </div>
          )}
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <a href={`/api/toplanti/ics?id=${encodeURIComponent(meeting.id)}`}><Button variant="outline" size="sm" className="gap-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>Takvime Ekle (ICS)</Button></a>
          <a href={`/api/toplanti/rapor?id=${encodeURIComponent(meeting.id)}&format=csv`}><Button variant="outline" size="sm" className="gap-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>CSV Dışa Aktar</Button></a>
          <a href={`/api/toplanti/rapor?id=${encodeURIComponent(meeting.id)}&format=pdf`}><Button variant="outline" size="sm" className="gap-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>PDF Dışa Aktar</Button></a>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="glass" className="overflow-hidden h-full">
          <div className="px-6 py-4 border-b border-slate-200/60 bg-slate-50/50 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-yellow-100 text-yellow-600 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            </div>
            <h3 className="font-semibold text-slate-800">Notlar</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input multiline rows={3} placeholder="Yeni not ekle..." value={noteText} onChange={(e) => setNoteText(e.target.value)} className="resize-none" />
              </div>
              <Button variant="primary" onClick={addNote} className="self-end h-10 px-4">Ekle</Button>
            </div>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {(meeting.notes || []).length === 0 ? (
                <div className="text-sm text-slate-500 italic text-center py-4">Henüz not eklenmemiş.</div>
              ) : (
                (meeting.notes || []).map((n) => (
                  <div key={n.id} className="bg-white/60 p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                    <div className="text-sm text-slate-700 whitespace-pre-wrap">{n.content}</div>
                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                      <span className="font-medium text-slate-600">{n.author?.username || "Anonim"}</span>
                      <span>•</span>
                      <span>{n.createdAt ? new Date(n.createdAt).toLocaleString("tr-TR") : ""}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>

        <Card variant="glass" className="overflow-hidden h-full">
          <div className="px-6 py-4 border-b border-slate-200/60 bg-slate-50/50 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 className="font-semibold text-slate-800">Aksiyonlar</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <Input placeholder="Aksiyon başlığı" value={actionTitle} onChange={(e) => setActionTitle(e.target.value)} />
              <Input type="date" value={actionDue} onChange={(e) => setActionDue(e.target.value)} />
            </div>
            <Button variant="primary" onClick={addAction} className="w-full">Aksiyon Ekle</Button>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {(meeting.actionItems || []).length === 0 ? (
                <div className="text-sm text-slate-500 italic text-center py-4">Henüz aksiyon eklenmemiş.</div>
              ) : (
                (meeting.actionItems || []).map((a) => (
                  <div key={a.id} className="bg-white/60 p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-start gap-3 group">
                    <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${a.status === "Tamamlandı" ? "bg-emerald-500" : "bg-orange-500"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-800 truncate">{a.title}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                        <span className={`px-2 py-0.5 rounded-full ${a.status === "Tamamlandı" ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"}`}>{a.status}</span>
                        {a.owner?.username && <span>Sorumlu: {a.owner.username}</span>}
                        {a.dueDate && <span>Termin: {new Date(a.dueDate).toLocaleDateString("tr-TR")}</span>}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
