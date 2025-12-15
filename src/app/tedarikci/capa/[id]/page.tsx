"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";
import Skeleton from "@/components/ui/Skeleton";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { TableContainer, Table, THead, TBody, TR, TH, TD } from "@/components/ui/Table";
import { useToast } from "@/components/ui/Toast";

type CAPAAction = { id: string; type: string; description: string; ownerId?: string | null; dueDate?: string | null; status: string; createdAt?: string; completedAt?: string | null };
type CAPAWhy = { id: string; idx: number; text: string; createdAt?: string };
type CAPAHistory = { id: string; date: string; event: string; details?: string | null };
type Supplier = { id: string; name: string };
type Order = { id: string; barcode: string | null } | null;
type Evaluation = { id: string } | null;
type CAPADetail = {
  id: string;
  title: string;
  description: string;
  corrective?: string | null;
  preventive?: string | null;
  status: string;
  openedAt?: string;
  closedAt?: string | null;
  supplier?: Supplier | null;
  order?: Order;
  evaluation?: Evaluation;
  actions?: CAPAAction[];
  whys?: CAPAWhy[];
  histories?: CAPAHistory[];
  problemWho?: string | null;
  problemWhen?: string | null;
  problemWhere?: string | null;
  problemHow?: string | null;
  effectivenessMethod?: string | null;
  verificationResult?: string | null;
  sustainabilityNotes?: string | null;
  approvalStatus?: string | null;
  code?: string;
};

const statusLabel = (s: string) => (s === "open" ? "Açık" : s === "in_progress" ? "Devam Ediyor" : s === "closed" ? "Kapalı" : s);
const statusVariant = (s: string) => (s === "open" ? "warning" : s === "in_progress" ? "info" : s === "closed" ? "success" : "default");
const formatDateTR = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString("tr-TR") : "-");

export default function CAPADetailPage() {
  const params = useParams();
  const router = useRouter();
  const { show } = useToast();
  const id = String(params?.id || "");

  const [detail, setDetail] = useState<CAPADetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string>("");

  const [whys, setWhys] = useState<CAPAWhy[]>([]);
  const [actions, setActions] = useState<CAPAAction[]>([]);
  const [histories, setHistories] = useState<CAPAHistory[]>([]);

  const [newAction, setNewAction] = useState<{ type: "corrective" | "preventive"; description: string; dueDate?: string } | null>({ type: "corrective", description: "" });

  useEffect(() => {
    let active = true;
    setLoading(true);
    (async () => {
      try {
        const r = await fetch(`/api/tedarikci/dof/${id}`);
        const data = await r.json();
        if (!active) return;
        if (!r.ok) throw new Error(data?.error || "Yüklenirken hata oluştu");
        setDetail(data);
        setStatus(data.status);
        setWhys(data.whys || []);
        setActions(data.actions || []);
        setHistories(data.histories || []);
        setError(null);
      } catch (e: any) {
        setError(e?.message || "Hata");
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  const updateStatus = async () => {
    try {
      setSaving(true);
      const r = await fetch(`/api/tedarikci/dof/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.message || data?.error || "Güncellenemedi");
      setDetail((d) => (d ? { ...d, status } : d));
      show({ title: "Durum güncellendi", variant: "success" });
    } catch (e: any) {
      show({ title: e?.message || "Hata", variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const saveWhy = async (idx: number, text: string) => {
    const r = await fetch(`/api/tedarikci/dof/${id}/whys`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idx, text }) });
    const data = await r.json();
    if (!r.ok) throw new Error(data?.message || data?.error || "Kayıt başarısız");
    setWhys((list) => {
      const exists = list.find((w) => w.idx === idx);
      if (exists) return list.map((w) => (w.idx === idx ? { ...w, text } : w));
      return [...list, data].sort((a, b) => a.idx - b.idx);
    });
  };

  const deleteWhy = async (idx: number) => {
    const r = await fetch(`/api/tedarikci/dof/${id}/whys?idx=${idx}`, { method: "DELETE" });
    if (!r.ok) throw new Error("Silme başarısız");
    setWhys((list) => list.filter((w) => w.idx !== idx));
  };

  const addAction = async () => {
    if (!newAction || !newAction.description.trim()) return;
    const payload: any = { type: newAction.type, description: newAction.description };
    if (newAction.dueDate) payload.dueDate = newAction.dueDate;
    const r = await fetch(`/api/tedarikci/dof/${id}/actions`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await r.json();
    if (!r.ok) throw new Error(data?.message || data?.error || "Aksiyon eklenemedi");
    setActions((list) => [...list, data]);
    setNewAction({ type: "corrective", description: "" });
  };

  const updateAction = async (actionId: string, changes: Partial<CAPAAction>) => {
    const r = await fetch(`/api/tedarikci/dof/${id}/actions`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: actionId, ...changes }) });
    const data = await r.json();
    if (!r.ok) throw new Error(data?.message || data?.error || "Aksiyon güncellenemedi");
    setActions((list) => list.map((a) => (a.id === actionId ? { ...a, ...changes } : a)));
  };

  const deleteAction = async (actionId: string) => {
    const r = await fetch(`/api/tedarikci/dof/${id}/actions?id=${actionId}`, { method: "DELETE" });
    if (!r.ok) throw new Error("Aksiyon silinemedi");
    setActions((list) => list.filter((a) => a.id !== actionId));
  };

  const corrective = useMemo(() => actions.filter((a) => a.type === "corrective"), [actions]);
  const preventive = useMemo(() => actions.filter((a) => a.type === "preventive"), [actions]);

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
          <Skeleton height={200} />
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

  return (
    <div className="space-y-6">
      <PageHeader
        title={detail?.title || "DÖF Detay"}
        description={detail?.supplier ? `Tedarikçi: ${detail.supplier.name}` : undefined}
        variant="gradient"
      >
        <div className="flex items-center gap-3">
          <Badge variant={statusVariant(status)} className="text-sm px-3 py-1">{statusLabel(status)}</Badge>
          <div className="h-8 w-px bg-white/20 mx-1"></div>
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            size="sm"
            aria-label="Durum"
            className="bg-white/10 border-white/20 text-white placeholder:text-white/50 w-40"
          >
            <option value="open" className="text-slate-900">Açık</option>
            <option value="in_progress" className="text-slate-900">Devam Ediyor</option>
            <option value="closed" className="text-slate-900">Kapalı</option>
          </Select>
          <Button size="sm" onClick={updateStatus} disabled={saving} className="bg-white text-blue-600 hover:bg-blue-50">Güncelle</Button>
          <Button variant="outline" size="sm" onClick={() => router.push("/tedarikci/capa/liste")} className="bg-white/10 hover:bg-white/20 text-white border-white/20">Listeye Dön</Button>
        </div>
      </PageHeader>

      <div className="grid gap-6">
        <Card variant="glass" className="overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200/60 bg-slate-50/50 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 className="font-semibold text-slate-800">Sorun Kaydı</h3>
          </div>
          <div className="p-6 grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Açıklama</div>
                <div className="p-3 border border-slate-200 rounded-lg bg-slate-50/50 text-slate-700 min-h-[80px]">{detail?.description}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Açılış Tarihi</div>
                  <div className="font-medium text-slate-900">{formatDateTR(detail?.openedAt)}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Kapanış Tarihi</div>
                  <div className="font-medium text-slate-900">{formatDateTR(detail?.closedAt)}</div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 content-start">
              <div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Kim</div>
                <div className="font-medium text-slate-900">{detail?.problemWho || '-'}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Ne Zaman</div>
                <div className="font-medium text-slate-900">{formatDateTR(detail?.problemWhen)}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Nerede</div>
                <div className="font-medium text-slate-900">{detail?.problemWhere || '-'}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Nasıl</div>
                <div className="font-medium text-slate-900">{detail?.problemHow || '-'}</div>
              </div>
              {detail?.order && (
                <div className="col-span-2 pt-2 border-t border-slate-100 mt-2">
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">İlişkili Sipariş</div>
                  <Link href={`/siparis/detay/${detail.order.id}`} className="font-medium text-blue-600 hover:underline flex items-center gap-1">
                    {detail.order.barcode || '-'}
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card variant="glass" className="overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200/60 bg-slate-50/50 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 className="font-semibold text-slate-800">Takip ve Doğrulama</h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Etkinlik Metodolojisi</div>
              <div className="p-3 border border-slate-200 rounded-lg bg-slate-50/50 text-slate-700">{detail?.effectivenessMethod || '-'}</div>
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Doğrulama Sonucu</div>
              <div className="p-3 border border-slate-200 rounded-lg bg-slate-50/50 text-slate-700">{detail?.verificationResult || '-'}</div>
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Kalıcılık Notları</div>
              <div className="p-3 border border-slate-200 rounded-lg bg-slate-50/50 text-slate-700">{detail?.sustainabilityNotes || '-'}</div>
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Açık Gün</div>
              <div className="font-medium text-slate-900">{(() => {
                const start = detail?.openedAt ? new Date(detail.openedAt) : null;
                const end = detail?.closedAt ? new Date(detail.closedAt) : new Date();
                if (!start) return '-';
                const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                return `${diff} gün`;
              })()}</div>
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Onay Durumu</div>
              <div className="font-medium text-slate-900">{detail?.approvalStatus || '—'}</div>
            </div>
          </div>
        </Card>

        <Card variant="glass" className="overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200/60 bg-slate-50/50 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 className="font-semibold text-slate-800">Kök Neden Analizi — 5 Neden</h3>
          </div>
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4, 5].map((idx) => {
              const existing = whys.find((w) => w.idx === idx)?.text || "";
              return (
                <div key={idx} className="flex items-center gap-3">
                  <label className="w-20 text-sm font-medium text-slate-500">Neden #{idx}</label>
                  <Input className="flex-1" value={existing} onChange={(e) => setWhys((list) => {
                    const text = (e.target as HTMLInputElement).value;
                    const found = list.find((w) => w.idx === idx);
                    if (found) return list.map((w) => (w.idx === idx ? { ...w, text } : w));
                    return [...list, { id: `temp-${idx}`, idx, text }];
                  })} />
                  <Button size="sm" variant="outline" onClick={() => saveWhy(idx, existing)}>Kaydet</Button>
                  <Button size="sm" variant="ghost" onClick={() => deleteWhy(idx)} className="text-red-500 hover:text-red-600 hover:bg-red-50">Sil</Button>
                </div>
              );
            })}
          </div>
        </Card>

        <Card variant="glass" className="overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200/60 bg-slate-50/50 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 className="font-semibold text-slate-800">Düzeltici ve Önleyici Aksiyonlar</h3>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  Düzeltici Aksiyonlar
                </h3>
                <TableContainer>
                  <Table>
                    <THead>
                      <TR>
                        <TH>Aksiyon</TH>
                        <TH>Durum</TH>
                        <TH>Termin</TH>
                        <TH>İşlem</TH>
                      </TR>
                    </THead>
                    <TBody>
                      {corrective.length === 0 ? (
                        <TR><TD colSpan={4} className="text-muted-foreground text-center py-4">Kayıt yok</TD></TR>
                      ) : (
                        corrective.map((a) => (
                          <TR key={a.id}>
                            <TD>{a.description}</TD>
                            <TD><Badge variant={statusVariant(a.status)}>{statusLabel(a.status)}</Badge></TD>
                            <TD>{formatDateTR(a.dueDate)}</TD>
                            <TD>
                              <div className="flex gap-2">
                                {(() => {
                                  const now = new Date();
                                  const due = a.dueDate ? new Date(a.dueDate) : null;
                                  const late = due && a.status !== 'done' && a.status !== 'cancelled' && due.getTime() < now.getTime();
                                  return late ? <Badge variant="error" className="text-[10px]">Gecikmiş</Badge> : null;
                                })()}
                                <Select size="sm" value={a.status} onChange={(e) => updateAction(a.id, { status: e.target.value })} className="w-24 text-xs">
                                  <option value="planned">Planlandı</option>
                                  <option value="in_progress">Devam</option>
                                  <option value="done">Tamamlandı</option>
                                  <option value="cancelled">İptal</option>
                                </Select>
                                <Button size="sm" variant="ghost" onClick={() => deleteAction(a.id)} className="h-8 w-8 p-0 text-red-500 hover:bg-red-50">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </Button>
                              </div>
                            </TD>
                          </TR>
                        ))
                      )}
                    </TBody>
                  </Table>
                </TableContainer>
              </div>
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  Önleyici Aksiyonlar
                </h3>
                <TableContainer>
                  <Table>
                    <THead>
                      <TR>
                        <TH>Aksiyon</TH>
                        <TH>Durum</TH>
                        <TH>Termin</TH>
                        <TH>İşlem</TH>
                      </TR>
                    </THead>
                    <TBody>
                      {preventive.length === 0 ? (
                        <TR><TD colSpan={4} className="text-muted-foreground text-center py-4">Kayıt yok</TD></TR>
                      ) : (
                        preventive.map((a) => (
                          <TR key={a.id}>
                            <TD>{a.description}</TD>
                            <TD><Badge variant={statusVariant(a.status)}>{statusLabel(a.status)}</Badge></TD>
                            <TD>{formatDateTR(a.dueDate)}</TD>
                            <TD>
                              <div className="flex gap-2">
                                {(() => {
                                  const now = new Date();
                                  const due = a.dueDate ? new Date(a.dueDate) : null;
                                  const late = due && a.status !== 'done' && a.status !== 'cancelled' && due.getTime() < now.getTime();
                                  return late ? <Badge variant="error" className="text-[10px]">Gecikmiş</Badge> : null;
                                })()}
                                <Select size="sm" value={a.status} onChange={(e) => updateAction(a.id, { status: e.target.value })} className="w-24 text-xs">
                                  <option value="planned">Planlandı</option>
                                  <option value="in_progress">Devam</option>
                                  <option value="done">Tamamlandı</option>
                                  <option value="cancelled">İptal</option>
                                </Select>
                                <Button size="sm" variant="ghost" onClick={() => deleteAction(a.id)} className="h-8 w-8 p-0 text-red-500 hover:bg-red-50">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </Button>
                              </div>
                            </TD>
                          </TR>
                        ))
                      )}
                    </TBody>
                  </Table>
                </TableContainer>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100">
              <h4 className="text-sm font-medium text-slate-700 mb-3">Yeni Aksiyon Ekle</h4>
              <div className="grid gap-4 md:grid-cols-4 items-end bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Aksiyon Türü</label>
                  <Select value={newAction?.type || "corrective"} onChange={(e) => setNewAction((a) => ({ ...(a || { description: "" }), type: e.target.value as any }))}>
                    <option value="corrective">Düzeltici</option>
                    <option value="preventive">Önleyici</option>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Aksiyon Tanımı</label>
                  <Input value={newAction?.description || ""} onChange={(e) => setNewAction((a) => ({ ...(a || { type: "corrective" }), description: (e.target as HTMLInputElement).value }))} placeholder="Yapılacak işlemi giriniz..." />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Termin</label>
                  <input type="date" className="w-full h-10 border rounded-lg px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" value={newAction?.dueDate || ""} onChange={(e) => setNewAction((a) => ({ ...(a || { type: "corrective", description: "" }), dueDate: (e.target as HTMLInputElement).value }))} />
                </div>
                <div className="md:col-span-4 flex justify-end">
                  <Button onClick={async () => { try { await addAction(); show({ title: "Aksiyon eklendi", variant: "success" }); } catch (e: any) { show({ title: e?.message || "Hata", variant: "error" }); } }}>Ekle</Button>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card variant="glass" className="overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200/60 bg-slate-50/50 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 className="font-semibold text-slate-800">Takip ve Geçmiş</h3>
          </div>
          <div className="p-6">
            <TableContainer>
              <Table>
                <THead>
                  <TR>
                    <TH>Tarih</TH>
                    <TH>Olay</TH>
                    <TH>Detay</TH>
                  </TR>
                </THead>
                <TBody>
                  {(histories || []).length === 0 ? (
                    <TR><TD colSpan={3} className="text-muted-foreground text-center py-4">Kayıt yok</TD></TR>
                  ) : (
                    (histories || []).map((h) => (
                      <TR key={h.id}>
                        <TD>{formatDateTR(h.date)}</TD>
                        <TD>{h.event}</TD>
                        <TD>{h.details || "-"}</TD>
                      </TR>
                    ))
                  )}
                </TBody>
              </Table>
            </TableContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}