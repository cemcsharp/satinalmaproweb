"use client";
import { useState, useEffect, useMemo, ReactNode } from "react";
import { useSession } from "next-auth/react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

interface RfqDetail {
    participationId: string;
    rfq: {
        id: string;
        rfxCode: string;
        title: string;
        deadline: string;
        company: { name: string };
        deliveryAddress: { name: string };
        items: Array<{
            id: string;
            name: string;
            quantity: number;
            unit: string;
            description?: string;
        }>;
    };
    existingOffer?: {
        totalAmount: number;
        currency: string;
        notes?: string;
        validUntil?: string;
        items: Array<{
            rfqItemId: string;
            unitPrice: number;
        }>;
    };
}

export default function SupplierRfqDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { data: session } = useSession();
    const [loading, setLoading] = useState(true);
    const [rfqData, setRfqData] = useState<RfqDetail | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [prices, setPrices] = useState<Record<string, string>>({});
    const [currency, setCurrency] = useState("TRY");
    const [notes, setNotes] = useState("");
    const [validUntil, setValidUntil] = useState("");

    useEffect(() => {
        const load = async () => {
            try {
                const { id } = await params;
                const res = await fetch(`/api/portal/rfq/details/${id}`);
                if (!res.ok) throw new Error("RFQ verisi alınamadı");
                const data = await res.json();
                setRfqData(data);

                // Pre-fill if there is an existing offer
                if (data.existingOffer) {
                    const priceMap: Record<string, string> = {};
                    data.existingOffer.items.forEach((item: any) => {
                        priceMap[item.rfqItemId] = String(item.unitPrice);
                    });
                    setPrices(priceMap);
                    setCurrency(data.existingOffer.currency || "TRY");
                    setNotes(data.existingOffer.notes || "");
                    if (data.existingOffer.validUntil) {
                        setValidUntil(new Date(data.existingOffer.validUntil).toISOString().split('T')[0]);
                    }
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [params]);

    const totalCalculated = useMemo(() => {
        if (!rfqData) return 0;
        return rfqData.rfq.items.reduce((sum, item) => {
            const price = parseFloat(prices[item.id] || "0");
            return sum + (price * item.quantity);
        }, 0);
    }, [rfqData, prices]);

    const handleSubmit = async () => {
        if (!rfqData) return;
        setSubmitting(true);
        try {
            const payload = {
                items: Object.entries(prices).map(([rfqItemId, unitPrice]) => ({
                    rfqItemId,
                    unitPrice: Number(unitPrice),
                    quantity: rfqData.rfq.items.find(i => i.id === rfqItemId)?.quantity || 0
                })),
                totalAmount: totalCalculated,
                currency,
                notes,
                validUntil
            };

            const { id } = await params;
            const res = await fetch(`/api/portal/rfq/details/${id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Teklif gönderilemedi");
            alert("Teklifiniz başarıyla iletildi.");
        } catch (err: any) {
            alert(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Yükleniyor...</div>;
    if (error || !rfqData) return <div className="p-8 text-red-600">Hata: {error}</div>;

    const { rfq } = rfqData;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{rfq.rfxCode} - {rfq.title}</h1>
                    <p className="text-slate-500">{rfq.company.name} tarafından oluşturuldu</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-amber-50 text-amber-700 px-4 py-2 rounded-xl border border-amber-100 text-sm font-semibold">
                        Son Tarih: {new Date(rfq.deadline).toLocaleDateString('tr-TR')}
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 p-0 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="font-bold text-slate-800">Ürün / Hizmet Listesi</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-white border-b border-slate-100">
                                <tr>
                                    <th className="text-left p-4 font-semibold text-slate-600">Kalem</th>
                                    <th className="text-center p-4 font-semibold text-slate-600">Miktar</th>
                                    <th className="text-right p-4 font-semibold text-slate-600">Birim Fiyat</th>
                                    <th className="text-right p-4 font-semibold text-slate-600">Toplam</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {rfq.items.map((item) => (
                                    <tr key={item.id}>
                                        <td className="p-4">
                                            <div className="font-semibold text-slate-800">{item.name}</div>
                                            {item.description && <div className="text-xs text-slate-400">{item.description}</div>}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="bg-slate-100 px-2 py-1 rounded text-slate-700 font-medium">{item.quantity} {item.unit}</span>
                                        </td>
                                        <td className="p-4">
                                            <input
                                                type="number"
                                                className="w-full text-right p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                value={prices[item.id] || ""}
                                                onChange={(e) => setPrices(prev => ({ ...prev, [item.id]: e.target.value }))}
                                                placeholder="0.00"
                                            />
                                        </td>
                                        <td className="p-4 text-right font-bold text-slate-900">
                                            {((Number(prices[item.id]) || 0) * item.quantity).toLocaleString('tr-TR')} {currency}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>

                <div className="space-y-6">
                    <Card className="p-6 border-indigo-100 bg-indigo-50/20">
                        <h3 className="font-bold text-indigo-900 mb-4">Teklif Özeti</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Para Birimi</label>
                                <select
                                    className="w-full p-3 bg-white border border-slate-200 rounded-xl"
                                    value={currency}
                                    onChange={(e) => setCurrency(e.target.value)}
                                >
                                    <option value="TRY">Türk Lirası (TRY)</option>
                                    <option value="USD">Amerikan Doları (USD)</option>
                                    <option value="EUR">Euro (EUR)</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Geçerlilik Tarihi</label>
                                <input
                                    type="date"
                                    className="w-full p-3 bg-white border border-slate-200 rounded-xl"
                                    value={validUntil}
                                    onChange={(e) => setValidUntil(e.target.value)}
                                />
                            </div>
                            <div className="pt-4 border-t border-indigo-100">
                                <div className="flex justify-between items-end mb-4">
                                    <span className="text-slate-600 font-medium">Toplam Tutar:</span>
                                    <span className="text-2xl font-black text-indigo-700">{totalCalculated.toLocaleString('tr-TR')} {currency}</span>
                                </div>
                                <Button
                                    variant="primary"
                                    fullWidth
                                    size="lg"
                                    onClick={handleSubmit}
                                    loading={submitting}
                                >
                                    Teklifi Gönder
                                </Button>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <h3 className="font-bold text-slate-800 mb-4">Ek Notlar</h3>
                        <textarea
                            className="w-full p-3 border border-slate-200 rounded-xl min-h-[120px]"
                            placeholder="Teklifinizle ilgili eklemek istediğiniz notlar..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </Card>
                </div>
            </div>
        </div>
    );
}
