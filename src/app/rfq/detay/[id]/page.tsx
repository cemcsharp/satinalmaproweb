"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal"; // Added
import { useToast } from "@/components/ui/Toast";
import { formatNumberTR } from "@/lib/format";
import Skeleton from "@/components/ui/Skeleton";

export default function RfqDetayPage() {
    const { id } = useParams();
    const router = useRouter();
    const { show } = useToast();

    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [converting, setConverting] = useState(false);

    // Modal State
    const [selectedOffer, setSelectedOffer] = useState<any>(null);
    const [viewMode, setViewMode] = useState<"list" | "matrix">("list");
    const [matrixSelections, setMatrixSelections] = useState<Record<string, string>>({}); // rfqItemId -> offerId
    const [showSplitConfirm, setShowSplitConfirm] = useState(false);
    const [customOrderNumbers, setCustomOrderNumbers] = useState<Record<string, string>>({}); // offerId -> userTypedNumber

    useEffect(() => {
        if (!id) return;
        fetch(`/api/rfq/${id}`)
            .then(r => r.json())
            .then(d => {
                setData(d);
                // Initialize matrix selections with best prices
                if (d.items && d.suppliers) {
                    const initialSelections: any = {};
                    d.items.forEach((item: any) => {
                        let bestOfferId = null;
                        let minPrice = Infinity;

                        d.suppliers.forEach((s: any) => {
                            if (!s.offer?.items) return;
                            const offerItem = s.offer.items.find((oi: any) => oi.rfqItemId === item.id);
                            if (offerItem) {
                                // Convert price to base currency if needed? Assuming same currency or simple compare for now.
                                // For MVP assumes same currency or user checks. 
                                // Ideally normalize currency but that's complex.
                                const price = Number(offerItem.unitPrice);
                                if (price < minPrice && price > 0) {
                                    minPrice = price;
                                    bestOfferId = s.offer.id;
                                }
                            }
                        });
                        if (bestOfferId) initialSelections[item.id] = bestOfferId;
                    });
                    setMatrixSelections(initialSelections);
                }
            })
            .catch(e => console.error(e))
            .finally(() => setLoading(false));
    }, [id]);

    const handleSplitOrderClick = () => {
        if (Object.keys(matrixSelections).length === 0) return show({ title: "Seçim Yapmadınız", variant: "warning" });

        // Initialize empty reference numbers
        // We don't pre-fill system barcodes anymore as they are auto-generated
        setCustomOrderNumbers({});
        setShowSplitConfirm(true);
    };

    const handleSplitOrderConfirm = async () => {
        setConverting(true);
        try {
            const selections = Object.entries(matrixSelections).map(([itemId, offerId]) => {
                const item = data.items.find((i: any) => i.id === itemId);
                return {
                    rfqItemId: itemId,
                    offerId: offerId,
                    quantity: Number(item.quantity) // Full quantity for now
                };
            });

            const res = await fetch("/api/rfq/finalize-split", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    rfqId: id,
                    selections,
                    customOrderNumbers // Pass map: offerId -> number
                })
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "Failed");

            show({ title: "Siparişler Oluşturuldu", description: `${json.orderIds.length} adet sipariş oluşturuldu.`, variant: "success" });
            // Redirect to order list or refresh
            window.location.href = "/siparis/liste";
        } catch (e: any) {
            show({ title: "Hata", description: e.message, variant: "error" });
        } finally {
            setConverting(false);
            setShowSplitConfirm(false);
        }
    };

    const handleSelectOffer = async (offerId: string) => {
        if (!confirm("Bu teklifi kabul edip Siparişe dönüştürmek istediğinize emin misiniz?")) return;
        setConverting(true);
        try {
            const res = await fetch("/api/rfq/finalize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    rfqId: id,
                    offerId
                })
            });
            const json = await res.json();
            if (res.ok) {
                show({ title: "Sipariş Oluşturuldu", description: `Sipariş No: ${json.barcode}`, variant: "success" });
                router.push(`/siparis/detay/${json.orderId}`);
            } else {
                throw new Error(json.error || "failed");
            }
        } catch (e: any) {
            show({ title: "Hata", description: e.message, variant: "error" });
        } finally {
            setConverting(false);
        }
    };

    if (loading) return <div className="p-10"><Skeleton height={400} /></div>;
    if (!data || data.error) return <div className="p-10 text-center">RFQ Bulunamadı</div>;

    const suppliers = data.suppliers || [];
    const offers = suppliers.filter((s: any) => s.offer).map((s: any) => ({ ...s.offer, supplierName: s.contactName || s.supplier?.name }));
    const sortedOffers = [...offers].sort((a, b) => Number(a.totalAmount) - Number(b.totalAmount)); // Cheapest first

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-10">
            <PageHeader
                title={`RFQ: ${data.rfxCode}`}
                description={data.title}
                actions={
                    <Badge variant={data.status === "ACTIVE" ? "success" : "default"}>{data.status}</Badge>
                }
            />

            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-slate-100">
                <h2 className="text-lg font-semibold text-slate-800">Teklif Analizi</h2>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button
                        onClick={() => setViewMode("list")}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${viewMode === "list" ? "bg-white shadow text-slate-900" : "text-slate-500 hover:text-slate-700"}`}
                    >
                        Liste Görünümü
                    </button>
                    <button
                        onClick={() => setViewMode("matrix")}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${viewMode === "matrix" ? "bg-white shadow text-slate-900" : "text-slate-500 hover:text-slate-700"}`}
                    >
                        Karşılaştırma Matrisi (Detaylı)
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-6">
                    <Card title="Katılımcı Durumu">
                        <ul className="space-y-3">
                            {suppliers.map((sup: any) => (
                                <li key={sup.id} className="flex justify-between items-center p-2 bg-slate-50 rounded">
                                    <div>
                                        <div className="font-medium text-sm">{sup.contactName || sup.email}</div>
                                        <div className="text-xs text-slate-500">{sup.email}</div>
                                    </div>
                                    <Badge variant={
                                        sup.stage === "OFFERED" ? "success" :
                                            sup.stage === "VIEWED" ? "warning" : "default"
                                    }>
                                        {sup.stage === "OFFERED" ? "Teklif Verdi" :
                                            sup.stage === "VIEWED" ? "Görüntüledi" : "Bekliyor"}
                                    </Badge>
                                </li>
                            ))}
                        </ul>
                    </Card>

                    <Card title="Talep Kalemleri">
                        <ul className="text-sm space-y-2">
                            {data.items.map((it: any) => (
                                <li key={it.id} className="flex justify-between border-b pb-1 last:border-0">
                                    <span>{it.name}</span>
                                    <span className="font-mono text-slate-600">{it.quantity} {it.unit}</span>
                                </li>
                            ))}
                        </ul>
                    </Card>
                </div>

                <div className="md:col-span-2">
                    {viewMode === "list" ? (
                        <Card title="Gelen Teklifler (En Ucuzdan Pahalıya)" className="overflow-hidden p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-100 text-slate-700">
                                        <tr>
                                            <th className="p-3">Tedarikçi</th>
                                            <th className="p-3 text-right">Toplam Tutar</th>
                                            <th className="p-3 text-center">Tarih</th>
                                            <th className="p-3 text-right">İşlem</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {sortedOffers.length === 0 ? (
                                            <tr><td colSpan={4} className="p-6 text-center text-slate-500">Henüz teklif gelmedi.</td></tr>
                                        ) : (
                                            sortedOffers.map((off: any, idx: number) => (
                                                <tr key={off.id} className={idx === 0 ? "bg-green-50/50" : ""}>
                                                    <td className="p-3">
                                                        <div className="font-bold text-slate-900">{off.supplierName}</div>
                                                        {idx === 0 && <span className="text-xs text-green-600 font-bold">★ En İyi Teklif</span>}
                                                    </td>
                                                    <td className="p-3 text-right font-mono text-base font-semibold text-slate-800">
                                                        {formatNumberTR(off.totalAmount)} {off.currency}
                                                    </td>
                                                    <td className="p-3 text-center text-slate-500">
                                                        {new Date(off.submittedAt).toLocaleDateString("tr-TR")}
                                                    </td>
                                                    <td className="p-3 text-right space-x-2">
                                                        <Button
                                                            size="sm"
                                                            variant="secondary"
                                                            onClick={() => setSelectedOffer(off)}
                                                        >
                                                            İncele
                                                        </Button>

                                                        {data.status === "ACTIVE" && (
                                                            <Button
                                                                size="sm"
                                                                variant={idx === 0 ? "success" : "secondary"}
                                                                onClick={() => handleSelectOffer(off.id)}
                                                                disabled={converting}
                                                            >
                                                                Seç
                                                            </Button>
                                                        )}
                                                        {data.status === "COMPLETED" && off.isWinner && (
                                                            <Badge variant="success">KAZANAN</Badge>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    ) : (
                        <Card title="Kale Bazlı Karşılaştırma Matrisi" className="overflow-hidden p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm border-collapse">
                                    <thead>
                                        <tr>
                                            <th className="p-3 bg-slate-100 border text-left min-w-[150px]">Ürün</th>
                                            <th className="p-3 bg-slate-100 border text-center w-[80px]">Miktar</th>
                                            {suppliers.filter((s: any) => s.offer).map((s: any) => (
                                                <th key={s.id} className="p-3 bg-slate-50 border text-center min-w-[120px]">
                                                    <div className="font-bold">{s.contactName || s.supplier?.name}</div>
                                                    <div className="text-xs font-normal text-slate-500">{s.offer.currency}</div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.items.map((item: any) => (
                                            <tr key={item.id}>
                                                <td className="p-3 border font-medium">{item.name}</td>
                                                <td className="p-3 border text-center text-slate-500">{item.quantity} {item.unit}</td>
                                                {suppliers.filter((s: any) => s.offer).map((s: any) => {
                                                    const offerItem = s.offer.items.find((oi: any) => oi.rfqItemId === item.id);
                                                    const isSelected = matrixSelections[item.id] === s.offer.id;
                                                    const price = offerItem ? Number(offerItem.unitPrice) : 0;

                                                    // Am I the cheapest for this row?
                                                    // Logic already captured in matrixSelections initial state for highlighting best price
                                                    // But user can change selection.

                                                    return (
                                                        <td
                                                            key={s.id}
                                                            className={`p-3 border text-center cursor-pointer hover:bg-blue-50 transition-colors ${isSelected ? "bg-green-50 ring-2 ring-inset ring-green-500" : ""}`}
                                                            onClick={() => setMatrixSelections(prev => ({ ...prev, [item.id]: s.offer.id }))}
                                                        >
                                                            {offerItem ? (
                                                                <div>
                                                                    <div className="font-bold">{formatNumberTR(price)}</div>
                                                                    {isSelected && <div className="text-[10px] text-green-600 font-bold">SEÇİLDİ</div>}
                                                                </div>
                                                            ) : (
                                                                <span className="text-slate-300">-</span>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="p-4 bg-slate-50 border-t flex justify-end">
                                <Button
                                    onClick={handleSplitOrderClick}
                                    disabled={converting}
                                    variant="primary"
                                >
                                    {converting ? "Oluşturuluyor..." : "Seçili Kalemlerle Sipariş Oluştur"}
                                </Button>
                            </div>
                        </Card>
                    )}
                </div>
            </div>

            {showSplitConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden">
                        <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-slate-800">Sipariş Oluşturma Onayı</h3>
                            <button onClick={() => setShowSplitConfirm(false)} className="text-slate-400 hover:text-red-500">✕</button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-slate-600">
                                Aşağıdaki tedarikçiler için ayrı ayrı siparişler oluşturulacak. Dilerseniz <strong>Sipariş Barkodu</strong> (Özel Numara) girebilirsiniz. Boş bırakırsanız sadece sistem numarası üretilir.
                            </p>
                            <div className="space-y-3">
                                {Object.keys(matrixSelections).reduce((acc: string[], curr) => {
                                    const oid = matrixSelections[curr];
                                    if (!acc.includes(oid)) acc.push(oid);
                                    return acc;
                                }, []).map(offerId => {
                                    const supplierName = suppliers.find((s: any) => s.offer?.id === offerId)?.supplier?.name ||
                                        suppliers.find((s: any) => s.offer?.id === offerId)?.contactName || "Tedarikçi";
                                    return (
                                        <div key={offerId} className="flex flex-col gap-1">
                                            <label className="text-xs font-semibold text-slate-700">{supplierName} - Sipariş Barkodu</label>
                                            <input
                                                type="text"
                                                placeholder="Örn: 2025-001 (Opsiyonel)"
                                                className="border rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                value={customOrderNumbers[offerId] || ""}
                                                onChange={(e) => setCustomOrderNumbers(prev => ({ ...prev, [offerId]: e.target.value }))}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 border-t flex justify-end gap-2">
                            <Button variant="secondary" onClick={() => setShowSplitConfirm(false)}>Vazgeç</Button>
                            <Button variant="primary" onClick={handleSplitOrderConfirm} disabled={converting}>
                                {converting ? "Oluşturuluyor..." : "Onayla ve Oluştur"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Offer Detail Modal */}
            <Modal
                isOpen={!!selectedOffer}
                onClose={() => setSelectedOffer(null)}
                title={`Teklif Detayı: ${selectedOffer?.supplierName}`}
            >
                <div className="space-y-4">
                    <div className="text-right font-medium text-slate-600 mb-2">
                        Toplam: <span className="text-xl text-slate-900 font-bold">{selectedOffer && formatNumberTR(selectedOffer.totalAmount)} {selectedOffer?.currency}</span>
                    </div>

                    <div className="overflow-x-auto border rounded-lg">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 font-semibold border-b">
                                <tr>
                                    <th className="p-2">Ürün</th>
                                    <th className="p-2 text-right">Miktar</th>
                                    <th className="p-2 text-right">Birim Fiyat</th>
                                    <th className="p-2 text-right">Toplam</th>
                                    <th className="p-2">Not/Marka</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {selectedOffer?.items?.map((it: any) => {
                                    // Find original request item name if needed, or use offer item name/rfq item name
                                    const rfqItem = data.items.find((r: any) => r.id === it.rfqItemId);
                                    return (
                                        <tr key={it.id}>
                                            <td className="p-2 font-medium">{rfqItem?.name || "Bilinmeyen Ürün"}</td>
                                            <td className="p-2 text-right">{formatNumberTR(it.quantity)}</td>
                                            <td className="p-2 text-right font-mono">{formatNumberTR(it.unitPrice)} {selectedOffer.currency}</td>
                                            <td className="p-2 text-right font-mono font-semibold">{formatNumberTR(it.totalPrice || (it.quantity * it.unitPrice))}</td>
                                            <td className="p-2 text-xs text-slate-500 max-w-[150px] truncate" title={it.notes || it.brand}>
                                                {it.brand && <span className="block font-semibold text-slate-700">{it.brand}</span>}
                                                {it.notes}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {selectedOffer?.notes && (
                        <div className="bg-slate-50 p-3 rounded text-sm text-slate-700">
                            <strong>Tedarikçi Notu:</strong> <br />
                            {selectedOffer.notes}
                        </div>
                    )}

                    {selectedOffer?.attachments && (
                        <div className="bg-blue-50 p-3 rounded text-sm border border-blue-100">
                            <strong>Ekli Dosyalar:</strong>
                            <ul className="list-disc list-inside mt-1 text-blue-700">
                                {selectedOffer.attachments.split(",").filter(Boolean).map((url: string, idx: number) => (
                                    <li key={idx}>
                                        <a href={url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                            {url.split("/").pop()}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="flex justify-end pt-2">
                        <Button variant="secondary" onClick={() => setSelectedOffer(null)}>Kapat</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
