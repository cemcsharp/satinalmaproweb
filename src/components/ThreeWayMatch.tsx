"use client";
import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import Badge from "@/components/ui/Badge";
import Skeleton from "@/components/ui/Skeleton";
import { Table, TableContainer, THead, TBody, TR, TH, TD } from "@/components/ui/Table";

interface MatchItem {
    id: string;
    name: string;
    sku: string | null;
    ordered: number;
    delivered: number;
    invoiced: number;
    price: number;
    status: {
        qtyMatch: boolean;
        overDelivered: boolean;
        underDelivered: boolean;
        overInvoiced: boolean;
        priceVariance: boolean;
    };
}

interface MatchData {
    analysis: MatchItem[];
    totals: {
        ordered: number;
        invoiced: number;
        balance: number;
    };
    orderBarcode: string;
}

export default function ThreeWayMatch({ orderId }: { orderId: string }) {
    const [data, setData] = useState<MatchData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/siparis/${orderId}/match`)
            .then(res => res.json())
            .then(d => setData(d))
            .catch(e => console.error(e))
            .finally(() => setLoading(false));
    }, [orderId]);

    if (loading) return <Skeleton height={400} />;
    if (!data) return <div className="p-10 text-center text-slate-500">Analiz verisi bulunamadı.</div>;

    const getStatusIcon = (item: MatchItem) => {
        if (item.status.qtyMatch) return <Icon name="check-circle" className="text-sky-500 w-5 h-5" />;
        if (item.status.overInvoiced || item.status.overDelivered) return <Icon name="alert-triangle" className="text-rose-500 w-5 h-5" />;
        return <Icon name="clock" className="text-sky-500 w-5 h-5" />;
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4 bg-white/50 border-slate-100 flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                        <Icon name="shopping-cart" className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-2xl font-black text-slate-800 tracking-tighter">
                            {data.totals.ordered.toLocaleString("tr-TR")} TL
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sipariş Toplamı</div>
                    </div>
                </Card>
                <Card className="p-4 bg-white/50 border-slate-100 flex items-center gap-4">
                    <div className="w-10 h-10 bg-sky-50 rounded-lg flex items-center justify-center text-blue-600">
                        <Icon name="receipt" className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-2xl font-black text-blue-600 tracking-tighter">
                            {data.totals.invoiced.toLocaleString("tr-TR")} TL
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Faturalanan</div>
                    </div>
                </Card>
                <Card className={`p-4 bg-white/50 border-slate-100 flex items-center gap-4 ${data.totals.balance > 0 ? "border-amber-200" : ""}`}>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${data.totals.balance > 0 ? "bg-amber-50 text-blue-600" : "bg-slate-50 text-slate-400"}`}>
                        <Icon name="dollar-sign" className="w-5 h-5" />
                    </div>
                    <div>
                        <div className={`text-2xl font-black tracking-tighter ${data.totals.balance > 0 ? "text-blue-600" : "text-slate-400"}`}>
                            {data.totals.balance.toLocaleString("tr-TR")} TL
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kalan Bakiye</div>
                    </div>
                </Card>
            </div>

            <Card className="p-0 overflow-hidden border-slate-100 shadow-sm">
                <TableContainer>
                    <Table>
                        <THead className="bg-slate-50/50">
                            <TR>
                                <TH className="w-[40px]"></TH>
                                <TH>Ürün / Hizmet</TH>
                                <TH className="text-center">Sipariş</TH>
                                <TH className="text-center">Onaylı Teslimat</TH>
                                <TH className="text-center">Faturalanan</TH>
                                <TH className="text-right">Durum</TH>
                            </TR>
                        </THead>
                        <TBody>
                            {data.analysis.map((item) => (
                                <TR key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                    <TD className="text-center">
                                        {getStatusIcon(item)}
                                    </TD>
                                    <TD>
                                        <div className="font-bold text-slate-900 leading-tight">{item.name}</div>
                                        {item.sku && <div className="text-[10px] text-indigo-600 font-mono mt-0.5">{item.sku}</div>}
                                    </TD>
                                    <TD className="text-center font-bold text-slate-700">{item.ordered}</TD>
                                    <TD className={`text-center font-bold ${item.status.underDelivered ? "text-blue-600" : "text-blue-600"}`}>
                                        {item.delivered}
                                    </TD>
                                    <TD className={`text-center font-bold ${item.status.overInvoiced ? "text-rose-600" : "text-slate-700"}`}>
                                        {item.invoiced}
                                    </TD>
                                    <TD className="text-right">
                                        {item.status.qtyMatch ? (
                                            <Badge variant="success" className="text-[10px] uppercase">Tam Uyum</Badge>
                                        ) : item.status.overInvoiced ? (
                                            <Badge variant="error" className="text-[10px] uppercase">Fazla Fatura!</Badge>
                                        ) : item.status.underDelivered ? (
                                            <Badge variant="warning" className="text-[10px] uppercase">Teslimat Bekliyor</Badge>
                                        ) : (
                                            <Badge variant="default" className="text-[10px] uppercase">Uyumsuz</Badge>
                                        )}
                                    </TD>
                                </TR>
                            ))}
                        </TBody>
                    </Table>
                </TableContainer>
            </Card>

            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-4 items-start">
                <Icon name="info" className="text-blue-600 w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-800 leading-relaxed">
                    <strong>Denetim Notu:</strong> Üçlü eşleşme, sistemdeki "Onaylı" irsaliyeleri ve "Kayıtlı" faturaları baz alır.
                    Eğer e-fatura entegrasyonu aktifse, fatura verileri otomatik olarak güncellenir.
                    Eşleşmeyen kalemler için finans birimi ödeme engelleyici (Payment Block) koyabilir.
                </p>
            </div>
        </div>
    );
}
