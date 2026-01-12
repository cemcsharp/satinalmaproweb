"use client";
import React from "react";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { formatNumberTR } from "@/lib/format";

type OfferFormProps = {
    rfq: {
        id: string;
        title: string;
        rfxCode: string;
        deadline: string | null;
        status: string;
        items: Array<{
            id: string;
            name: string;
            quantity: number;
            unit: string;
            description?: string;
        }>;
    };
    supplier: { name: string; companyName?: string };
    // State props
    prices: Record<string, number>;
    setPrices: (v: Record<string, number>) => void;
    itemCurrencies: Record<string, string>;
    setItemCurrencies: (v: Record<string, string>) => void;
    brands: Record<string, string>;
    setBrands: (v: Record<string, string>) => void;
    deliveries: Record<string, number>;
    setDeliveries: (v: Record<string, number>) => void;
    warranties: Record<string, string>;
    setWarranties: (v: Record<string, string>) => void;
    kdvRates: Record<string, number>;
    setKdvRates: (v: Record<string, number>) => void;
    alternatives: Record<string, boolean>;
    setAlternatives: (v: Record<string, boolean>) => void;
    // Global states
    paymentTerm: string;
    setPaymentTerm: (v: string) => void;
    incoterm: string;
    setIncoterm: (v: string) => void;
    validUntil: string;
    setValidUntil: (v: string) => void;
    generalNote: string;
    setGeneralNote: (v: string) => void;
    extraCostPackaging: number;
    setExtraCostPackaging: (v: number) => void;
    extraCostLogistics: number;
    setExtraCostLogistics: (v: number) => void;
    // Actions
    attachments: string[];
    handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    removeAttachment: (url: string) => void;
    uploading: boolean;
    handleSubmit: () => void;
    submitting: boolean;
    submitted: boolean;
    currencyTotals: Record<string, number>;
    deadlineInfo: { date: string; daysLeft: number; isUrgent: boolean } | null;
};

const CURRENCIES = ["TRY", "USD", "EUR", "GBP"];

export default function OfferFormClean(props: OfferFormProps) {
    const { rfq, supplier, prices, setPrices, itemCurrencies, setItemCurrencies, brands, setBrands, deliveries, setDeliveries, warranties, setWarranties, kdvRates, setKdvRates, alternatives, setAlternatives, paymentTerm, setPaymentTerm, incoterm, setIncoterm, validUntil, setValidUntil, generalNote, setGeneralNote, extraCostPackaging, setExtraCostPackaging, extraCostLogistics, setExtraCostLogistics, attachments, handleFileUpload, removeAttachment, uploading, handleSubmit, submitting, submitted, currencyTotals, deadlineInfo } = props;

    return (
        <div className="space-y-6">
            {/* HEADER */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Badge variant="primary" className="text-xs">{rfq.rfxCode}</Badge>
                            {deadlineInfo && (
                                <Badge variant={deadlineInfo.isUrgent ? "error" : "success"} className="text-xs">
                                    Son: {deadlineInfo.date}
                                </Badge>
                            )}
                        </div>
                        <h1 className="text-xl font-bold text-slate-900">{rfq.title}</h1>
                        <p className="text-slate-500 text-sm">{supplier.name || supplier.companyName} için teklif formu</p>
                    </div>
                    {submitted && (
                        <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Teklif Gönderildi
                        </div>
                    )}
                </div>
            </div>

            {/* TWO COLUMN LAYOUT */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LEFT: ITEMS */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-lg font-semibold text-slate-800">Ürün Fiyatlandırması</h2>

                    {rfq.items.map((item, idx) => {
                        const price = prices[item.id] || 0;
                        const curr = itemCurrencies[item.id] || "TRY";
                        const total = item.quantity * price;

                        return (
                            <Card key={item.id} className="p-5 border border-slate-200">
                                {/* Item Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <span className="text-xs text-slate-400 font-medium">#{idx + 1}</span>
                                        <h3 className="text-base font-semibold text-slate-900">{item.name}</h3>
                                        {item.description && <p className="text-sm text-slate-500">{item.description}</p>}
                                    </div>
                                    <div className="text-right bg-blue-50 px-3 py-1 rounded-lg">
                                        <div className="text-lg font-bold text-blue-600">{formatNumberTR(item.quantity)}</div>
                                        <div className="text-xs text-blue-400">{item.unit}</div>
                                    </div>
                                </div>

                                {/* Price Row */}
                                <div className="grid grid-cols-3 gap-3 mb-3">
                                    <div className="col-span-2">
                                        <label className="block text-xs text-slate-500 mb-1">Birim Fiyat (KDV Hariç)</label>
                                        <div className="flex">
                                            <Input
                                                type="number"
                                                placeholder="0.00"
                                                value={prices[item.id] || ""}
                                                onChange={e => setPrices({ ...prices, [item.id]: Number(e.target.value) })}
                                                className="rounded-r-none"
                                            />
                                            <Select
                                                options={CURRENCIES.map(c => ({ label: c, value: c }))}
                                                value={curr}
                                                onChange={e => setItemCurrencies({ ...itemCurrencies, [item.id]: e.target.value })}
                                                className="w-20 rounded-l-none border-l-0"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-500 mb-1">Toplam</label>
                                        <div className="h-10 flex items-center bg-slate-50 rounded-lg px-3">
                                            <span className="font-semibold text-slate-900">{formatNumberTR(total)}</span>
                                            <span className="text-xs text-slate-400 ml-1">{curr}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Expandable Details */}
                                <details className="group">
                                    <summary className="cursor-pointer text-sm text-blue-600 font-medium flex items-center gap-1">
                                        <svg className="w-4 h-4 group-open:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                        Detaylar
                                    </summary>
                                    <div className="mt-3 pt-3 border-t grid grid-cols-2 md:grid-cols-4 gap-3">
                                        <Input label="Marka" placeholder="Ör: Bosch" size="sm" value={brands[item.id] || ""} onChange={e => setBrands({ ...brands, [item.id]: e.target.value })} />
                                        <Input label="Teslimat (Gün)" type="number" placeholder="0" size="sm" value={deliveries[item.id] || ""} onChange={e => setDeliveries({ ...deliveries, [item.id]: Number(e.target.value) })} />
                                        <Input label="Garanti" placeholder="Ör: 2 yıl" size="sm" value={warranties[item.id] || ""} onChange={e => setWarranties({ ...warranties, [item.id]: e.target.value })} />
                                        <div className="flex items-end">
                                            <label className="flex items-center gap-2 cursor-pointer text-sm">
                                                <input type="checkbox" className="w-4 h-4 rounded" checked={!!alternatives[item.id]} onChange={e => setAlternatives({ ...alternatives, [item.id]: e.target.checked })} />
                                                Muadil
                                            </label>
                                        </div>
                                    </div>
                                </details>
                            </Card>
                        );
                    })}
                </div>

                {/* RIGHT: SIDEBAR */}
                <div className="space-y-4">
                    {/* Summary Card */}
                    <Card className="p-5 bg-slate-900 text-white border-none sticky top-4">
                        <h3 className="text-sm font-medium text-slate-400 mb-3">Teklif Özeti</h3>
                        {Object.entries(currencyTotals).filter(([_, v]) => v > 0).length === 0 ? (
                            <div className="text-3xl font-bold text-slate-600">0,00 TRY</div>
                        ) : (
                            Object.entries(currencyTotals).filter(([_, v]) => v > 0).map(([curr, total]) => (
                                <div key={curr} className="mb-2">
                                    <div className="text-3xl font-bold">{formatNumberTR(total + extraCostPackaging + extraCostLogistics)}</div>
                                    <div className="text-sm text-slate-400">{curr} (KDV Hariç)</div>
                                </div>
                            ))
                        )}
                    </Card>

                    {/* Terms Card */}
                    <Card className="p-5 border border-slate-200">
                        <h3 className="text-sm font-semibold text-slate-700 mb-4">Ticari Koşullar</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">Ödeme Vadesi</label>
                                <select className="w-full h-9 px-3 border rounded-lg text-sm" value={paymentTerm} onChange={e => setPaymentTerm(e.target.value)}>
                                    <option value="VADE_SIZ">Peşin</option>
                                    <option value="30_GUN">30 Gün</option>
                                    <option value="60_GUN">60 Gün</option>
                                    <option value="90_GUN">90 Gün</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">Teslim Şekli</label>
                                <select className="w-full h-9 px-3 border rounded-lg text-sm" value={incoterm} onChange={e => setIncoterm(e.target.value)}>
                                    <option value="EXW">EXW</option>
                                    <option value="DDP">DDP</option>
                                    <option value="DAP">DAP</option>
                                    <option value="CIF">CIF</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">Geçerlilik Tarihi</label>
                                <input type="date" className="w-full h-9 px-3 border rounded-lg text-sm" value={validUntil} onChange={e => setValidUntil(e.target.value)} />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <Input label="Paketleme" type="number" placeholder="0" size="sm" value={extraCostPackaging || ""} onChange={e => setExtraCostPackaging(Number(e.target.value))} />
                                <Input label="Nakliye" type="number" placeholder="0" size="sm" value={extraCostLogistics || ""} onChange={e => setExtraCostLogistics(Number(e.target.value))} />
                            </div>
                        </div>
                    </Card>

                    {/* Notes Card */}
                    <Card className="p-5 border border-slate-200">
                        <h3 className="text-sm font-semibold text-slate-700 mb-3">Notlar</h3>
                        <Textarea placeholder="Ek notlarınız..." value={generalNote} onChange={e => setGeneralNote(e.target.value)} className="h-24" />
                    </Card>

                    {/* Attachments */}
                    <Card className="p-5 border border-slate-200">
                        <h3 className="text-sm font-semibold text-slate-700 mb-3">Dosya Ekleri</h3>
                        <label className={`flex flex-col items-center justify-center py-6 border-2 border-dashed rounded-lg cursor-pointer hover:border-blue-400 transition ${uploading ? 'opacity-50' : ''}`}>
                            <svg className="w-8 h-8 text-slate-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <span className="text-xs text-slate-500">{uploading ? "Yükleniyor..." : "Dosya Seç"}</span>
                            <input type="file" className="hidden" multiple onChange={handleFileUpload} disabled={uploading} />
                        </label>
                        {attachments.length > 0 && (
                            <div className="mt-3 space-y-2">
                                {attachments.map((url, idx) => (
                                    <div key={idx} className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded text-sm">
                                        <span className="truncate text-slate-700">{url.split('/').pop()}</span>
                                        <button onClick={() => removeAttachment(url)} className="text-red-500 hover:text-red-700">×</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>

                    {/* Submit Button */}
                    <Button onClick={handleSubmit} loading={submitting} disabled={rfq.status !== "ACTIVE"} className="w-full h-14 text-lg font-bold" variant="primary">
                        {submitting ? "Gönderiliyor..." : "Teklifi Gönder"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
