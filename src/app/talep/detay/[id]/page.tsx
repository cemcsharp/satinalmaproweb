"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { TableContainer, Table, THead, TBody, TR, TH, TD } from "@/components/ui/Table";
import Skeleton from "@/components/ui/Skeleton";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import RevisionHistoryModal from "@/components/RevisionHistoryModal";
import ApprovalStatus from "@/components/ApprovalStatus";
import { useToast } from "@/components/ui/Toast";

type RequestItem = { id: string; name: string; quantity: number; unit: string | null; unitPrice?: number };
type RequestComment = { id: string; text: string; author: string | null; createdAt: string | null };
type RequestDetail = {
  id: string;
  barcode: string;
  subject: string;
  justification?: string | null;
  budget: number;
  unit?: string | null;
  status?: string | null;
  currency?: string | null;
  date?: string | null;
  relatedPerson?: string | null;
  unitEmail?: string | null;
  owner?: string | null;
  responsible?: string | null;
  items: RequestItem[];
  comments?: RequestComment[];
};

export default function TalepDetayPage() {
  const params = useParams();
  const router = useRouter();
  const { show } = useToast();
  const id = String((params as any)?.id || "");
  const [data, setData] = useState<RequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  // Assignment Modal State
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [purchasingStaff, setPurchasingStaff] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [assignNote, setAssignNote] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);

  // Approval State
  const [userRoleKey, setUserRoleKey] = useState("");
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [approvalComment, setApprovalComment] = useState("");
  const [showApprovalModal, setShowApprovalModal] = useState<"approve" | "reject" | null>(null);
  const [workflowInfo, setWorkflowInfo] = useState<any>(null);

  // Cancel State
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Template Save State
  const [saveTemplateModalOpen, setSaveTemplateModalOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateLoading, setTemplateLoading] = useState(false);

  useEffect(() => {
    // Fetch Permissions
    fetch("/api/profile").then(r => r.json()).then(p => {
      setIsAdmin(p.isAdmin || p.role === "admin");
      if (p.permissions) setPermissions(p.permissions);
      // Get user role key for approval checks
      setUserRoleKey(p.roleRef?.key || p.role || "");
      setCurrentUserId(p.id || "");
    }).catch(() => { });

    if (!id) return;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/talep/${encodeURIComponent(id)}`);
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j?.error || "Detay getirilemedi");
        }
        const j = (await res.json()) as RequestDetail;
        setData({ ...j, items: Array.isArray(j.items) ? j.items : [] });
      } catch (e: any) {
        setError(e?.message || "Hata");
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    // Fetch workflow info for approval buttons
    const fetchWorkflow = async () => {
      try {
        const res = await fetch(`/api/talep/${encodeURIComponent(id)}/approve`);
        if (res.ok) {
          const data = await res.json();
          setWorkflowInfo(data);
        }
      } catch (e) { }
    };
    fetchWorkflow();
  }, [id]);

  // Load purchasing staff when assignment modal opens
  const openAssignModal = async () => {
    setAssignModalOpen(true);
    try {
      const res = await fetch("/api/users/purchasing-staff");
      if (res.ok) {
        const staff = await res.json();
        setPurchasingStaff(staff);
      }
    } catch { }
  };

  const handleAssign = async () => {
    if (!selectedUserId) {
      show({ title: "Hata", description: "Lütfen bir kişi seçin", variant: "error" });
      return;
    }
    setAssignLoading(true);
    try {
      const res = await fetch(`/api/talep/${id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responsibleUserId: selectedUserId, note: assignNote })
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j?.error || "Atama başarısız");
      }
      const result = await res.json();
      show({ title: "Başarılı", description: "Talep atandı", variant: "success" });
      setAssignModalOpen(false);
      setSelectedUserId("");
      setAssignNote("");
      // Refresh data
      setData(prev => prev ? { ...prev, responsible: result.request?.responsible?.username } : prev);
    } catch (e: any) {
      show({ title: "Hata", description: e.message, variant: "error" });
    } finally {
      setAssignLoading(false);
    }
  };

  // Check if current user can approve based on dynamic workflow
  const canApprove = () => {
    if (!workflowInfo?.workflow?.steps) return false;

    // Find current step (status = "current")
    const currentStep = workflowInfo.workflow.steps.find((s: any) => s.status === "current");
    if (!currentStep) return false;

    // Check if user role matches
    return userRoleKey === "admin" || currentStep.approverRole === userRoleKey;
  };

  // Get current step name for display
  const getCurrentStepName = () => {
    if (!workflowInfo?.workflow?.steps) return null;
    const currentStep = workflowInfo.workflow.steps.find((s: any) => s.status === "current");
    return currentStep?.name || null;
  };

  const handleApproval = async (action: "approve" | "reject") => {
    setApprovalLoading(true);
    try {
      const res = await fetch(`/api/talep/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, comment: approvalComment })
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j?.error || "İşlem başarısız");
      }
      const result = await res.json();
      show({
        title: action === "approve" ? "Onaylandı" : "Reddedildi",
        description: result.message,
        variant: action === "approve" ? "success" : "error"
      });
      setShowApprovalModal(null);
      setApprovalComment("");
      // Refresh data
      setData(prev => prev ? { ...prev, status: result.request?.status?.label } : prev);
    } catch (e: any) {
      show({ title: "Hata", description: e.message, variant: "error" });
    } finally {
      setApprovalLoading(false);
    }
  };

  const statusVariant = (s?: string | null): "default" | "success" | "warning" | "error" | "info" => {
    if (!s) return "default";
    const lower = s.toLowerCase();
    if (lower.includes("onay") || lower.includes("tamamlan")) return "success";
    if (lower.includes("bekl") || lower.includes("havuz")) return "warning";
    if (lower.includes("red") || lower.includes("iptal")) return "error";
    if (lower.includes("işlem")) return "info";
    return "default";
  };

  // Check if current user can cancel this request
  const canCancel = () => {
    if (!data?.status) return false;
    const status = data.status.toLowerCase();
    const isCancelable = ["taslak", "bekliyor", "onay", "birim", "genel müdür"].some(s => status.includes(s));
    const isNotCancelable = ["işlemde", "sipariş", "tamamlandı", "reddedildi", "iptal"].some(s => status.includes(s));
    // TODO: Check if current user is owner - for now allow admin or check via data
    return isCancelable && !isNotCancelable && (isAdmin || true); // Will be refined with owner check
  };

  const handleCancel = async () => {
    setCancelLoading(true);
    try {
      const res = await fetch(`/api/talep/${id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason })
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j?.error || "İptal işlemi başarısız");
      }
      show({ variant: "success", title: "Başarılı", description: "Talep iptal edildi" });
      setShowCancelModal(false);
      setCancelReason("");
      // Refresh data
      const r = await fetch(`/api/talep/${id}`);
      if (r.ok) setData(await r.json());
    } catch (e: any) {
      show({ variant: "error", title: "Hata", description: e?.message || "İptal başarısız" });
    } finally {
      setCancelLoading(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateName) return;
    setTemplateLoading(true);
    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: templateName,
          subject: data?.subject,
          description: "Talep " + data?.barcode + " üzerinden oluşturuldu",
          items: data?.items?.map(i => ({
            name: i.name,
            quantity: i.quantity,
            unit: i.unit,
            unitPrice: i.unitPrice
          }))
        })
      });
      if (!res.ok) throw new Error("Kayıt başarısız");
      show({ title: "Başarılı", description: "Şablon oluşturuldu", variant: "success" });
      setSaveTemplateModalOpen(false);
      setTemplateName("");
    } catch {
      show({ title: "Hata", description: "Şablon oluşturulamadı", variant: "error" });
    } finally {
      setTemplateLoading(false);
    }
  };

  if (loading) return <div className="p-10 text-center"><Skeleton height={300} /></div>;
  if (error) return <div className="p-10 text-center text-red-600">{error}</div>;
  if (!data) return <div className="p-10 text-center text-muted-foreground">Talep bulunamadı</div>;

  const finalActions = (
    <div className="flex gap-2">
      <Button variant="outline" onClick={() => router.push("/talep/liste")}>Listeye Dön</Button>
      <Button variant="outline" onClick={() => setSaveTemplateModalOpen(true)}>Şablon Olarak Kaydet</Button>
      <Button variant="gradient" onClick={() => router.push(`/talep/duzenle/${data.id}`)}>Düzenle</Button>
      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        {(isAdmin || permissions.includes("siparis:create") || true) && (data.status?.toLowerCase().includes("onay") || true) && (
          <>
            <Button
              variant="gradient"
              onClick={() => router.push(`/siparis/olustur?requestId=${data.id}`)}
              className="shadow-lg shadow-blue-500/20"
            >
              Sipariş Oluştur
            </Button>

            {/* RFQ Button - Feature Flag Controlled (Using isAdmin for demo or checking a configured prop) */}
            {/* Temporarily enabled for everyone to test visibility */}
            <Button
              variant="secondary"
              onClick={() => router.push(`/rfq/olustur?requestId=${data.id}`)}
              className="bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200"
              title="Bu talep için tedarikçilerden teklif topla"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              Teklif Topla (RFQ)
            </Button>
          </>
        )}

        {/* Approval Buttons */}
        {canApprove() && (
          <div className="flex gap-2">
            <Button
              variant="primary"
              onClick={() => setShowApprovalModal("approve")}
              className="bg-green-600 hover:bg-green-700"
              disabled={approvalLoading}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Onayla
            </Button>
            <Button
              variant="danger"
              onClick={() => setShowApprovalModal("reject")}
              disabled={approvalLoading}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Reddet
            </Button>
          </div>
        )}

        {/* Cancel Button */}
        {canCancel() && (
          <Button
            variant="outline"
            onClick={() => setShowCancelModal(true)}
            className="border-red-300 text-red-600 hover:bg-red-50"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
            İptal Et
          </Button>
        )}
        <Button
          variant="outline"
          onClick={() => setShowHistoryModal(true)}
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Geçmiş
        </Button>
        {/* Other buttons... */}</div>
    </div>
  );

  return (
    <section className="space-y-6 max-w-5xl mx-auto pb-10">
      <PageHeader
        title={`Talep: ${data.barcode}`}
        description={data.subject}
        actions={finalActions}
      />

      {/* Workflow Status */}
      {workflowInfo?.workflow && (
        <Card className="mb-6 px-6 py-6 pb-12">
          <ApprovalStatus workflow={workflowInfo.workflow} />
        </Card>
      )}

      < div className="grid grid-cols-1 md:grid-cols-3 gap-6" >
        <div className="md:col-span-2 space-y-6">
          <Card title="Talep Bilgileri" className="p-5 h-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Durum</label>
                <Badge variant={statusVariant(data.status)} className="px-2.5 py-0.5">{data.status || "Belirsiz"}</Badge>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Talep No</label>
                <div className="text-base font-medium text-slate-900">{data.barcode}</div>
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Konu</label>
                <div className="text-sm font-medium text-slate-900 leading-relaxed">{data.subject}</div>
              </div>
              {data.justification && (
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Gerekçe</label>
                  <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{data.justification}</div>
                </div>
              )}
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Talep Eden</label>
                <div className="text-sm text-slate-900">{data.owner || "-"}</div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Birim Temsilcisi</label>
                <div className="text-sm text-slate-900">{data.relatedPerson || "-"}</div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Birim</label>
                <div className="text-sm text-slate-900">{data.unit || "-"}</div>
              </div>
              {data.unitEmail && (
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Birim E-Posta</label>
                  <div className="text-sm text-blue-600 truncate">{data.unitEmail}</div>
                </div>
              )}
            </div>
          </Card>

          <Card title="Talep Kalemleri" className="p-0 overflow-hidden">
            <TableContainer>
              <Table>
                <THead>
                  <TR>
                    <TH className="bg-slate-50/50 pl-6">Kalem Adı/Açıklama</TH>
                    <TH className="bg-slate-50/50">Miktar</TH>
                    <TH className="bg-slate-50/50">Birim</TH>
                    <TH className="bg-slate-50/50 text-right pr-6">Birim Fiyat</TH>
                    <TH className="bg-slate-50/50 text-right pr-6">Tutar</TH>
                  </TR>
                </THead>
                <TBody>
                  {data.items.length === 0 ? (
                    <TR><TD colSpan={5} className="pl-6 text-slate-500 italic">Kalem girilmemiş</TD></TR>
                  ) : (
                    data.items.map((item, i) => (
                      <TR key={i}>
                        <TD className="pl-6 font-medium text-slate-700">{item.name}</TD>
                        <TD>{item.quantity}</TD>
                        <TD>{item.unit || "-"}</TD>
                        <TD className="text-right pr-6 font-mono text-slate-600">
                          {item.unitPrice ? item.unitPrice.toLocaleString("tr-TR", { minimumFractionDigits: 2 }) : "-"}
                        </TD>
                        <TD className="text-right pr-6 font-medium text-slate-900">
                          {item.unitPrice ? (item.quantity * item.unitPrice).toLocaleString("tr-TR", { minimumFractionDigits: 2 }) : "-"}
                        </TD>
                      </TR>
                    ))
                  )}
                </TBody>
              </Table>
            </TableContainer>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Bütçe ve Tarih" className="p-5">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Tahmini Bütçe</label>
                <div className="text-xl font-bold text-slate-900">
                  {Number(data.budget).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  <span className="text-sm font-normal text-slate-500 ml-1">{data.currency || "TL"}</span>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Talep Tarihi</label>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  <span className="text-sm font-medium text-slate-900">{data.date ? new Date(data.date).toLocaleDateString("tr-TR") : "-"}</span>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Sorumlu" className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </div>
              <div>
                <div className="text-sm font-medium text-slate-900">{data.responsible || "Atanmamış"}</div>
                <div className="text-xs text-slate-500">Satınalma Sorumlusu</div>
              </div>
            </div>
            {(isAdmin || permissions.includes("talep:edit")) && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={openAssignModal}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                {data.responsible ? "Yeniden Ata" : "Personele Ata"}
              </Button>
            )}
          </Card>
        </div>
      </div >

      {/* Assignment Modal */}
      < Modal
        isOpen={assignModalOpen}
        title="Talep Ata"
        onClose={() => setAssignModalOpen(false)}
        size="sm"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setAssignModalOpen(false)}>İptal</Button>
            <Button size="sm" onClick={handleAssign} disabled={assignLoading}>
              {assignLoading ? "Atanıyor..." : "Ata"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Sorumlu Kişi</label>
            <Select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
            >
              <option value="">Seçiniz...</option>
              {purchasingStaff.map((u: any) => (
                <option key={u.id} value={u.id}>
                  {u.username} {u.roleRef?.name ? `(${u.roleRef.name})` : ""}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Not (Opsiyonel)</label>
            <textarea
              value={assignNote}
              onChange={(e) => setAssignNote(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
              rows={3}
              placeholder="Atama ile ilgili not..."
            />
          </div>
        </div>
      </Modal >

      {/* Approval Confirmation Modal */}
      < Modal
        isOpen={showApprovalModal !== null}
        title={showApprovalModal === "approve" ? "Talebi Onayla" : "Talebi Reddet"}
        onClose={() => setShowApprovalModal(null)}
        size="sm"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setShowApprovalModal(null)}>İptal</Button>
            <Button
              size="sm"
              variant={showApprovalModal === "approve" ? "primary" : "danger"}
              onClick={() => handleApproval(showApprovalModal!)}
              disabled={approvalLoading}
              className={showApprovalModal === "approve" ? "bg-green-600 hover:bg-green-700" : ""}
            >
              {approvalLoading ? "İşleniyor..." : (showApprovalModal === "approve" ? "Onayla" : "Reddet")}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            {showApprovalModal === "approve"
              ? "Bu talebi onaylamak istediğinizden emin misiniz?"
              : "Bu talebi reddetmek istediğinizden emin misiniz?"}
          </p>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {showApprovalModal === "reject" ? "Red Sebebi" : "Not (Opsiyonel)"}
            </label>
            <textarea
              value={approvalComment}
              onChange={(e) => setApprovalComment(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
              rows={3}
              placeholder={showApprovalModal === "reject" ? "Red sebebini yazın..." : "Onay notu..."}
              required={showApprovalModal === "reject"}
            />
          </div>
        </div>
      </Modal >

      {/* Cancel Modal */}
      < Modal
        isOpen={showCancelModal}
        title="Talebi İptal Et"
        onClose={() => setShowCancelModal(false)}
        size="sm"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setShowCancelModal(false)}>Vazgeç</Button>
            <Button
              size="sm"
              variant="danger"
              onClick={handleCancel}
              disabled={cancelLoading}
            >
              {cancelLoading ? "İşleniyor..." : "İptal Et"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Bu talebi iptal etmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
          </p>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              İptal Sebebi (Opsiyonel)
            </label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-red-100 focus:border-red-500"
              rows={3}
              placeholder="İptal sebebini yazın..."
            />
          </div>
        </div>

      </Modal >

      {/* History Modal */}
      {/* History Modal */}
      {data && (
        <RevisionHistoryModal
          isOpen={showHistoryModal}
          onClose={() => setShowHistoryModal(false)}
          requestId={data.id}
        />
      )}

      <Modal
        isOpen={saveTemplateModalOpen}
        title="Şablon Olarak Kaydet"
        onClose={() => setSaveTemplateModalOpen(false)}
        size="sm"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setSaveTemplateModalOpen(false)}>İptal</Button>
            <Button size="sm" onClick={handleSaveTemplate} disabled={templateLoading}>
              {templateLoading ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <label className="block text-sm font-medium text-slate-700">Şablon Adı</label>
          <input
            autoFocus
            className="w-full border rounded p-2"
            value={templateName}
            onChange={e => setTemplateName(e.target.value)}
            placeholder="Örn: Aylık Ofis Malzemeleri"
          />
        </div>
      </Modal>
    </section >
  );
}

