import React, { useEffect, useState, useMemo } from "react";
import { Request, RequestDetail } from "@/types/talep";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { parseDecimalFlexible } from "@/lib/format";
import { fetchJsonWithRetry } from "@/lib/http";
import { useToast } from "@/components/ui/Toast";

interface TalepEditProps {
    item: Request;
    onSave: () => void;
    onCancel: () => void;
    options?: any;
    canEditAdvanced: boolean;
}

export default function TalepEdit({ item, onSave, onCancel, options, canEditAdvanced }: TalepEditProps) {
    const { show } = useToast();
    const [loading, setLoading] = useState(false);
    const [detail, setDetail] = useState<RequestDetail | null>(null);

    const [editSubject, setEditSubject] = useState(item.subject);
    const [editBudget, setEditBudget] = useState<number | "">(item.budget);
    const [editUnitId, setEditUnitId] = useState<string>("");
    const [editStatusId, setEditStatusId] = useState<string>("");
    const [editCurrencyId, setEditCurrencyId] = useState<string>("");
    const [editRelatedPersonId, setEditRelatedPersonId] = useState<string>("");
    const [editOwnerUserId, setEditOwnerUserId] = useState<string>("");
    const [editResponsibleUserId, setEditResponsibleUserId] = useState<string>("");
    const [editErrors, setEditErrors] = useState<{ subject?: string; budget?: string }>({});

    useEffect(() => {
        let active = true;
        const load = async () => {
            try {
                const d = await fetchJsonWithRetry<any>(`/api/talep/${item.id}`, { cache: "no-store" }, { retries: 2, backoffMs: 250 });
                if (active) {
                    setDetail(d);
                    setEditUnitId(d.unitId || "");
                    setEditStatusId(d.statusId || "");
                    setEditCurrencyId(d.currencyId || "");
                    setEditRelatedPersonId(d.relatedPersonId || "");
                    setEditOwnerUserId(d.ownerUserId || "");
                    setEditResponsibleUserId(d.responsibleUserId || "");
                }
            } catch (_) {
                // ignore
            }
        };
        load();
        return () => { active = false; };
    }, [item.id]);

    useEffect(() => {
        const next: { subject?: string; budget?: string } = {};
        if (!editSubject || editSubject.trim().length < 2) {
            next.subject = "Konu en az 2 karakter olmalı";
        }
        if (editBudget !== "" && !Number.isFinite(Number(editBudget))) {
            next.budget = "Bütçe sayısal olmalı";
        }
        setEditErrors(next);
    }, [editSubject, editBudget]);

    const handleSave = async () => {
        try {
            setLoading(true);
            if (editBudget !== "" && !Number.isFinite(Number(editBudget))) {
                show({ title: "Hata", description: "Bütçe sayısal olmalıdır.", variant: "error" });
                setLoading(false);
                return;
            }
            const body: any = { subject: editSubject, budget: editBudget === "" ? item.budget : Number(editBudget) };
            if (canEditAdvanced) {
                if (editUnitId) body.unitId = editUnitId;
                if (editStatusId) body.statusId = editStatusId;
                if (editCurrencyId) body.currencyId = editCurrencyId;
                if (editRelatedPersonId) body.relatedPersonId = editRelatedPersonId;
                if (editOwnerUserId) body.ownerUserId = editOwnerUserId;
                if (editResponsibleUserId) body.responsibleUserId = editResponsibleUserId;
            }
            await fetchJsonWithRetry(`/api/talep/${item.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            }, { retries: 1, backoffMs: 200 });
            show({ title: "Güncellendi", description: "Kayıt güncellendi", variant: "success" });
            onSave();
        } catch (e: any) {
            const msg = e?.message || "Güncelleme başarısız";
            const friendly = /validation_failed/.test(msg)
                ? "Geçersiz veri: lütfen alanları kontrol edin."
                : msg;
            show({ title: "Hata", description: friendly, variant: "error" });
        } finally {
            setLoading(false);
        }
    };

    const getLabel = (group: "ilgiliKisi" | "birim" | "durum" | "paraBirimi" | "kullanici", id: string) => {
        const arr = (options && (options as any)[group]) || [];
        const found = arr.find((x: any) => String(x.id) === String(id));
        return found ? String(found.label) : id;
    };

    const diffs: Array<{ label: string; from: string | number | undefined; to: string | number | undefined }> = [];
    if (editSubject && editSubject !== item.subject) diffs.push({ label: "Konu", from: item.subject, to: editSubject });
    const budgetTo = editBudget === "" ? item.budget : Number(editBudget);
    if (budgetTo !== item.budget) diffs.push({ label: "Bütçe", from: item.budget, to: budgetTo });
    if (editRelatedPersonId && detail) diffs.push({ label: "İlgili Kişi", from: detail.relatedPerson || '-', to: getLabel("ilgiliKisi", editRelatedPersonId) });
    if (editUnitId && detail) diffs.push({ label: "Birim", from: detail.unit || item.unit, to: getLabel("birim", editUnitId) });
    if (editStatusId && detail) diffs.push({ label: "Durum", from: detail.status || item.status, to: getLabel("durum", editStatusId) });
    if (editCurrencyId && detail) diffs.push({ label: "Para Birimi", from: detail.currency || item.currency, to: getLabel("paraBirimi", editCurrencyId) });
    if (editOwnerUserId && detail) diffs.push({ label: "Talep Sahibi", from: detail.owner || '-', to: getLabel("kullanici", editOwnerUserId) });
    if (editResponsibleUserId && detail) diffs.push({ label: "Sorumlu", from: detail.responsible || '-', to: getLabel("kullanici", editResponsibleUserId) });

    return (
        <div className="space-y-3">
            {diffs.length > 0 && (
                <div className="rounded-md border bg-muted/40 p-2">
                    <div className="mb-1 text-xs font-medium">Değişiklik Özeti</div>
                    <ul className="text-xs">
                        {diffs.map((d, i) => (
                            <li key={`diff-${i}`}>
                                <span className="font-medium">{d.label}:</span> <span className="line-through text-muted-foreground">{d.from ?? '-'}</span> → <span>{String(d.to ?? '')}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); handleSave(); }} aria-labelledby="edit-form">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <Input size="sm" label="Talep başlığı" placeholder="Örn: Yeni ekipman alımı" value={editSubject} onChange={(e) => setEditSubject(e.target.value)} required aria-invalid={!!editErrors.subject} description={editErrors.subject ? undefined : "Kısa ve anlaşılır bir başlık"} error={editErrors.subject} />
                    <Input
                        size="sm"
                        label="Bütçe"
                        type="text"
                        inputMode="decimal"
                        pattern="^[0-9]+([,\.][0-9]{0,2})?$"
                        value={editBudget === "" ? "" : String(editBudget).replace(".", ",")}
                        onChange={(e) => {
                            const raw = (e.target as HTMLInputElement).value;
                            if (raw === "") { setEditBudget(""); return; }
                            const parsed = parseDecimalFlexible(raw);
                            setEditBudget(parsed == null ? "" : parsed);
                        }}
                        description={editErrors.budget ? undefined : "Sayısal değer, örn: 28544,50"}
                        error={editErrors.budget}
                    />
                </div>
                {canEditAdvanced && (
                    <details className="rounded-md border p-2">
                        <summary className="cursor-pointer text-sm">Gelişmiş alanlar</summary>
                        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <Select label="İlgili Kişi" size="sm" value={editRelatedPersonId} onChange={(e) => setEditRelatedPersonId((e.target as HTMLSelectElement).value)} aria-label="İlgili kişi">
                                <option value="">Seçiniz</option>
                                {(options?.ilgiliKisi ?? []).map((o: any) => <option key={o.id} value={o.id}>{o.label}</option>)}
                            </Select>
                            <Select label="Birim" size="sm" value={editUnitId} onChange={(e) => setEditUnitId((e.target as HTMLSelectElement).value)} aria-label="Birim">
                                <option value="">Seçiniz</option>
                                {(options?.birim ?? []).map((o: any) => <option key={o.id} value={o.id}>{o.label}</option>)}
                            </Select>
                            <Select label="Durum" size="sm" value={editStatusId} onChange={(e) => setEditStatusId((e.target as HTMLSelectElement).value)} aria-label="Durum">
                                <option value="">Seçiniz</option>
                                {(options?.durum ?? []).map((o: any) => <option key={o.id} value={o.id}>{o.label}</option>)}
                            </Select>
                            <Select label="Para Birimi" size="sm" value={editCurrencyId} onChange={(e) => setEditCurrencyId((e.target as HTMLSelectElement).value)} aria-label="Para birimi">
                                <option value="">Seçiniz</option>
                                {(options?.paraBirimi ?? []).map((o: any) => <option key={o.id} value={o.id}>{o.label}</option>)}
                            </Select>
                        </div>
                        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <Select label="Talep Sahibi" size="sm" value={editOwnerUserId} onChange={(e) => setEditOwnerUserId((e.target as HTMLSelectElement).value)} aria-label="Talep sahibi">
                                <option value="">Seçiniz</option>
                                {(options?.kullanici ?? []).map((o: any) => <option key={o.id} value={o.id}>{o.label}</option>)}
                            </Select>
                            <Select label="Sorumlu" size="sm" value={editResponsibleUserId} onChange={(e) => setEditResponsibleUserId((e.target as HTMLSelectElement).value)} aria-label="Sorumlu">
                                <option value="">Seçiniz</option>
                                {(options?.kullanici ?? []).map((o: any) => <option key={o.id} value={o.id}>{o.label}</option>)}
                            </Select>
                        </div>
                    </details>
                )}
                <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" size="sm" onClick={onCancel}>Vazgeç</Button>
                    <Button size="sm" type="submit" disabled={!!editErrors.subject || !!editErrors.budget || loading} loading={loading}>Kaydet</Button>
                </div>
            </form>
        </div>
    );
}
