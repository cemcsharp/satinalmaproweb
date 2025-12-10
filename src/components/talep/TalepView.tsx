import React, { useEffect, useState } from "react";
import { Request, RequestDetail } from "@/types/talep";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Alert from "@/components/ui/Alert";
import { TableContainer, Table, THead, TBody, TR, TH, TD } from "@/components/ui/Table";
import Select from "@/components/ui/Select";
import { fetchJsonWithRetry } from "@/lib/http";
import { useToast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";

interface TalepViewProps {
    item: Request;
    onEdit: (item: Request) => void;
    onClose: () => void;
    options?: any; // Passed from parent to avoid refetching if possible, or we can fetch here
    currentUser?: { id: string };
}

export default function TalepView({ item, onEdit, onClose, options, currentUser }: TalepViewProps) {
    const { show } = useToast();
    const router = useRouter();
    const [detail, setDetail] = useState<RequestDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [commentText, setCommentText] = useState("");
    const [commentAuthorId, setCommentAuthorId] = useState(currentUser?.id || "");

    useEffect(() => {
        let active = true;
        const load = async () => {
            try {
                setLoading(true);
                const d = await fetchJsonWithRetry<any>(`/api/talep/${item.id}`, { cache: "no-store" }, { retries: 2, backoffMs: 250 });
                if (active) {
                    setDetail({
                        id: d.id,
                        barcode: d.barcode,
                        subject: d.subject,
                        budget: Number(d.budget),
                        unit: d.unit ?? item.unit,
                        status: d.status ?? item.status,
                        currency: d.currency ?? item.currency,
                        date: d.date ?? item.date,
                        relatedPerson: d.relatedPerson ?? null,
                        unitEmail: d.unitEmail ?? null,
                        owner: d.owner ?? null,
                        responsible: d.responsible ?? null,
                        items: Array.isArray(d.items) ? d.items : [],
                        comments: Array.isArray(d.comments) ? d.comments : [],
                    });
                }
            } catch (e: any) {
                if (active) setError(e?.message || "Detay alınamadı");
            } finally {
                if (active) setLoading(false);
            }
        };
        load();
        return () => { active = false; };
    }, [item.id, item.unit, item.status, item.currency, item.date]);

    const statusVariant = (s: string): "default" | "success" | "warning" | "error" | "info" => {
        const v = (s || "").toLowerCase();
        if (v.includes("onay")) return "success";
        if (v.includes("iptal") || v.includes("redd")) return "error";
        if (v.includes("taslak")) return "warning";
        if (v.includes("bekle") || v.includes("işlem") || v.includes("hazır")) return "info";
        return "default";
    };

    const submitComment = async () => {
        if (!detail?.id) return;
        const text = commentText.trim();
        const authorId = String(commentAuthorId || "").trim();
        if (!text || !authorId) {
            show({ title: "Yorum metni ve yazar seçiniz", variant: "warning" });
            return;
        }
        try {
            await fetchJsonWithRetry(`/api/talep/${detail.id}/yorum`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text, authorId }),
            }, { retries: 1, backoffMs: 200 });
            setCommentText("");
            // Refresh details to show new comment
            const d = await fetchJsonWithRetry<any>(`/api/talep/${detail.id}`, { cache: "no-store" });
            setDetail((prev) => prev ? { ...prev, comments: d.comments } : prev);
            show({ title: "Yorum eklendi", variant: "success" });
        } catch (e: any) {
            show({ title: "Yorum eklenemedi", description: e?.message, variant: "error" });
        }
    };

    if (loading) return <div className="p-4 text-sm text-muted-foreground">Yükleniyor...</div>;
    if (error) return <Alert variant="error" className="m-4">{error}</Alert>;
    if (!detail) return null;

    return (
        <div className="space-y-3">
            <PageHeader
                title={`Talep Detayı: ${detail.barcode}`}
                description={`${detail.subject}${detail.date ? ` • ${new Date(detail.date).toLocaleDateString()}` : ""}`}
                size="sm"
            >
                <div className="flex items-center gap-2">
                    <Badge variant={statusVariant(detail.status || "")} className="text-[12px]">
                        {detail.status}
                    </Badge>
                    <Button size="sm" variant="outline" onClick={() => onEdit(item)}>Güncelle</Button>
                </div>
            </PageHeader>

            <Card>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                        <div className="text-xs text-gray-600">Barkod</div>
                        <div className="text-sm font-medium text-primary">{detail.barcode}</div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-600">Tarih</div>
                        <div className="text-sm font-medium">{detail.date ? new Date(detail.date).toLocaleDateString() : "-"}</div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-600">Birim</div>
                        <div className="text-sm font-medium">{detail.unit}</div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-600">Birim E‑posta</div>
                        <div className="text-sm font-medium">{detail.unitEmail || '-'}</div>
                    </div>
                </div>
            </Card>

            <Card>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                        <div className="text-xs text-gray-600">İlgili Kişi</div>
                        <div className="text-sm font-medium">{detail.relatedPerson || '-'}</div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-600">Talep Sahibi</div>
                        <div className="text-sm font-medium">{detail.owner || '-'}</div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-600">Sorumlu</div>
                        <div className="text-sm font-medium">{detail.responsible || '-'}</div>
                    </div>
                </div>
            </Card>

            <Card>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                        <div className="text-xs text-gray-600">Para Birimi</div>
                        <div className="text-sm font-medium">{detail.currency}</div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-600">Bütçe</div>
                        <div className="text-sm font-medium">{detail.budget.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {detail.currency}</div>
                    </div>
                </div>
            </Card>

            <Card title="Talep Edilen Ürünler">
                {Array.isArray(detail.items) && detail.items.length > 0 ? (
                    <TableContainer>
                        <Table>
                            <THead>
                                <TR>
                                    <TH className="p-1.5 text-[12px]">Kalem</TH>
                                    <TH className="p-1.5 text-[12px]">Miktar</TH>
                                    <TH className="p-1.5 text-[12px]">Birim</TH>
                                    <TH className="p-1.5 text-[12px]">Birim Fiyat</TH>
                                    <TH className="p-1.5 text-[12px]">Toplam Fiyat</TH>
                                </TR>
                            </THead>
                            <TBody>
                                {detail.items.map((it) => (
                                    <TR key={it.id}>
                                        <TD className="p-1.5 text-[12px]">{it.name}</TD>
                                        <TD className="p-1.5 text-[12px]">{it.quantity}</TD>
                                        <TD className="p-1.5 text-[12px]">{it.unit ?? '-'}</TD>
                                        <TD className="p-1.5 text-[12px]">{Number(it.unitPrice ?? 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {detail.currency}</TD>
                                        <TD className="p-1.5 text-[12px]">{(Number(it.quantity) * Number(it.unitPrice ?? 0)).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {detail.currency}</TD>
                                    </TR>
                                ))}
                            </TBody>
                        </Table>
                    </TableContainer>
                ) : (
                    <Alert variant="info" className="text-[12px]">Talep kalemi bulunmuyor.</Alert>
                )}
            </Card>

            <Card title="Yorumlar / Notlar">
                {Array.isArray(detail.comments) && detail.comments.length > 0 ? (
                    <ul className="space-y-2 text-[12px] sm:text-sm">
                        {detail.comments.map((c) => (
                            <li key={c.id}>
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">{c.author || 'Anonim'}</span>
                                    <span className="text-[12px] text-muted-foreground">{c.createdAt ? new Date(c.createdAt).toLocaleString() : ''}</span>
                                </div>
                                <div className="text-[12px] sm:text-sm">{c.text}</div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <Alert variant="info" className="text-[12px]">Henüz yorum yok.</Alert>
                )}
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <textarea
                        className="border-2 border-[var(--border)] rounded-xl bg-card px-3 py-2 text-[12px] sm:text-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition"
                        placeholder="Yorum"
                        rows={3}
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                    />
                    <Select size="sm" value={commentAuthorId} onChange={(e) => setCommentAuthorId(e.target.value)}>
                        <option value="">Yazar seçin</option>
                        {(options?.kullanici ?? []).map((u: any) => (
                            <option key={u.id} value={u.id}>{u.label}</option>
                        ))}
                    </Select>
                </div>
                <div className="mt-2">
                    <Button size="sm" onClick={submitComment}>Yorum Ekle</Button>
                </div>
            </Card>

            <div className="flex flex-wrap gap-2 mt-4">
                <Button size="sm" variant="outline" onClick={onClose}>Kapat</Button>
                <Button size="sm" variant="outline" onClick={() => onEdit(item)}>Durum Değiştir</Button>
                <Button size="sm" variant="outline" onClick={() => onEdit(item)}>Atama Yap</Button>
                <Button size="sm" onClick={() => router.push(`/talep/detay/${encodeURIComponent(item.id)}`)}>Tüm Detayı Gör</Button>
            </div>
        </div>
    );
}
