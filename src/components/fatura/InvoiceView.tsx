import React, { useEffect, useState } from "react";
import { Invoice, InvoiceDetail } from "@/types/fatura";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { fetchJsonWithRetry } from "@/lib/http";
import { calculateWithholding } from "@/lib/withholding";
import dynamic from "next/dynamic";

const PDFDownloadButton = dynamic(() => import("@/components/PDFDownloadButton"), {
    ssr: false,
    loading: () => <Button variant="outline" size="sm" disabled>PDF...</Button>
});

interface InvoiceViewProps {
    item: Invoice;
    onClose: () => void;
    onEdit: (item: Invoice) => void;
}

export default function InvoiceView({ item, onClose, onEdit }: InvoiceViewProps) {
    const [detail, setDetail] = useState<InvoiceDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        const load = async () => {
            try {
                setLoading(true);
                const d = await fetchJsonWithRetry<InvoiceDetail>(`/api/fatura/${item.id}`, { cache: "no-store" }, { retries: 2, backoffMs: 250 });
                if (active) setDetail(d);
            } catch (e: any) {
                if (active) setError(e.message || "Detay yüklenemedi");
            } finally {
                if (active) setLoading(false);
            }
        };
        load();
        return () => { active = false; };
    }, [item.id]);

    const statusVariant = (s: string): "default" | "success" | "warning" | "error" | "info" => {
        const v = String(s || "").toLowerCase();
        if (v.includes("ödendi") || v.includes("onaylandı")) return "success";
        if (v.includes("beklemede") || v.includes("vade")) return "warning";
        if (v.includes("iptal") || v.includes("hata")) return "error";
        if (v.includes("taslak")) return "info";
        return "default";
    };

    if (loading) return <div className="p-8 text-center text-sm text-slate-500 animate-pulse">Yükleniyor...</div>;
    if (error) return <div className="p-6 text-sm text-red-600 bg-red-50 rounded-xl border border-red-100">{error}</div>;
    if (!detail) return null;

    const parseRatio = (s: string | null | undefined) => {
        const parts = String(s || "").split("/");
        const num = Number(parts[0] || 0);
        const den = Number(parts[1] || 0);
        return den > 0 ? num / den : 0;
    };
    const applyWithholding = Boolean(detail.withholdingCode);
    const lineItems = (detail.items || []).map((it) => ({
        id: it.id,
        name: it.name,
        quantity: Number(it.quantity),
        unitPrice: Number(it.unitPrice),
        taxRate: Number(typeof it.taxRate === "number" ? it.taxRate : (typeof detail.vatRate === "number" ? detail.vatRate : 0)),
        applyWithholding
    }));
    const rule = applyWithholding ? {
        id: String(detail.withholdingCode),
        code: String(detail.withholdingCode),
        vatRate: Number(typeof detail.vatRate === "number" ? detail.vatRate : 0),
        percent: parseRatio(detail.withholdingCode)
    } : null;
    const calc = calculateWithholding(lineItems, rule as any);

    // Prepare PDF data
    const pdfData = {
        invoiceNo: detail.number || "",
        date: new Date(detail.createdAt).toLocaleDateString("tr-TR"),
        dueDate: detail.dueDate ? new Date(detail.dueDate as any).toLocaleDateString("tr-TR") : undefined,
        supplier: detail.order?.supplier?.name || "-",
        supplierAddress: detail.order?.supplier?.address || undefined,
        items: lineItems.map(it => ({
            description: it.name,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            total: it.quantity * it.unitPrice
        })),
        subtotal: calc.subtotal,
        tax: calc.vatTotal,
        total: calc.grossTotal,
        status: detail.status,
        notes: detail.notes || undefined
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
                <div>
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-bold text-slate-900">Fatura Önizleme</h2>
                        <Badge variant={statusVariant(detail.status)} className="px-2 py-0.5 text-xs">{detail.status}</Badge>
                    </div>
                    <div className="text-sm text-slate-500 mt-1">
                        No: {detail.number} • Sipariş: {detail.orderNo}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <PDFDownloadButton data={pdfData} fileName={`fatura-${detail.number}.pdf`} />
                    <Button variant="gradient" size="sm" onClick={() => onEdit(item)} className="shadow-lg shadow-blue-500/20">Düzenle</Button>
                    <Button variant="outline" size="sm" onClick={onClose}>Kapat</Button>
                </div>
            </div>

            {/* Buyer / Seller Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">ALICI (FİRMA)</div>
                    <div className="text-sm font-bold text-slate-900">{detail.order?.company?.name || "-"}</div>
                    <div className="text-xs text-slate-600 mt-1">Vergi No: <span className="font-medium">{detail.order?.company?.taxId || "-"}</span></div>
                    <div className="text-xs text-slate-600">Adres: <span className="font-medium">{detail.order?.company?.address || "-"}</span></div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">SATICI (TEDARİKÇİ)</div>
                    <div className="text-sm font-bold text-slate-900">{detail.order?.supplier?.name || "-"}</div>
                    <div className="text-xs text-slate-600 mt-1">Vergi No: <span className="font-medium">{detail.order?.supplier?.taxId || "-"}</span></div>
                </div>
            </div>

            {/* Items Table */}
            <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                        <tr>
                            <th className="px-4 py-3 text-left">ÜRÜN/HİZMET</th>
                            <th className="px-4 py-3 text-right">BİRİM FİYAT</th>
                            <th className="px-4 py-3 text-center">MİKTAR</th>
                            <th className="px-4 py-3 text-center">VERGİ (%)</th>
                            <th className="px-4 py-3 text-right">TUTAR</th>
                            <th className="px-4 py-3 text-right">KDV</th>
                            <th className="px-4 py-3 text-right">TOPLAM</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {lineItems.map((it) => {
                            const line = Number(it.quantity) * Number(it.unitPrice);
                            const vat = line * (Number(it.taxRate || 0) / 100);
                            const total = line + vat;
                            return (
                                <tr key={it.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-4 py-3 font-medium text-slate-900">{it.name}</td>
                                    <td className="px-4 py-3 text-right text-slate-600">{new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2 }).format(Number(it.unitPrice))} ₺</td>
                                    <td className="px-4 py-3 text-center text-slate-600">{Number(it.quantity)}</td>
                                    <td className="px-4 py-3 text-center text-slate-600">{Number(it.taxRate || 0)}</td>
                                    <td className="px-4 py-3 text-right text-slate-600">{new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2 }).format(line)} ₺</td>
                                    <td className="px-4 py-3 text-right text-slate-600">{new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2 }).format(vat)} ₺</td>
                                    <td className="px-4 py-3 text-right font-medium text-slate-900">{new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2 }).format(total)} ₺</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Bottom Section: Payment & Totals */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 h-full">
                    <div className="font-medium text-slate-900 mb-4">Ödeme Bilgileri</div>
                    <div className="flex justify-between text-sm text-slate-600 mb-2">
                        <span>Yöntem:</span>
                        <span className="font-bold text-slate-900">Havale/EFT</span>
                    </div>
                    <div className="flex justify-between text-sm text-slate-600 mb-2">
                        <span>Vade:</span>
                        <span className="font-medium text-slate-900">{detail.dueDate ? new Date(detail.dueDate as any).toLocaleDateString("tr-TR") : "-"}</span>
                    </div>
                    <div className="flex justify-between text-sm text-slate-600">
                        <span>Banka:</span>
                        <span className="font-medium text-slate-900">{detail.bank || "-"}</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-sm text-slate-600">
                        <span>Ara Toplam</span>
                        <span className="font-bold text-slate-900">{new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2 }).format(calc.subtotal)} ₺</span>
                    </div>
                    <div className="flex justify-between text-sm text-slate-600">
                        <span>KDV Toplamı</span>
                        <span className="font-bold text-slate-900">{new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2 }).format(calc.vatTotal)} ₺</span>
                    </div>
                    {applyWithholding && rule && (
                        <div className="flex justify-between text-sm text-orange-600">
                            <span>Tevkifat ({(rule as any).code})</span>
                            <span className="font-bold">-{new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2 }).format(calc.withheldVat)} ₺</span>
                        </div>
                    )}
                    <div className="pt-3 border-t border-slate-200 flex justify-between text-base font-bold text-slate-900">
                        <span>Genel Toplam</span>
                        <span>{new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2 }).format(calc.grossTotal)} ₺</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-emerald-600">
                        <span>Ödenecek Tutar</span>
                        <span>{new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2 }).format(applyWithholding ? calc.netPayableTotal : calc.grossTotal)} ₺</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
