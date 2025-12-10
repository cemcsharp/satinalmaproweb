"use client";
import { useEffect, useState, useCallback } from "react";
import Card from "@/components/ui/Card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TableContainer, Table, THead, TBody, TR, TH, TD } from "@/components/ui/Table";
import DateRangeFilter from "@/components/ui/DateRangeFilter";

interface SozlesmeReportData {
    summary: {
        total: number;
        active: number;
        ended: number;
        expiringSoon: number;
    };
    byUnit: { name: string; count: number }[];
    expiringList: { name: string; unit: string; date: string }[];
}

export default function SozlesmeRaporu() {
    const [data, setData] = useState<SozlesmeReportData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback((startDate?: string, endDate?: string) => {
        setLoading(true);
        const params = new URLSearchParams({ type: "sozlesme" });
        if (startDate) params.append("startDate", startDate);
        if (endDate) params.append("endDate", endDate);

        fetch(`/api/raporlama/detay?${params.toString()}`)
            .then(res => res.json())
            .then(setData)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleFilterChange = (start: string, end: string) => {
        fetchData(start, end);
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Yükleniyor...</div>;
    if (!data) return <div className="p-8 text-center text-red-500">Veri yüklenemedi.</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-end">
                <DateRangeFilter onFilterChange={handleFilterChange} />
            </div>
            {/* Özet Kartları */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card variant="glass" className="p-6 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Toplam Sözleşme</p>
                        <h3 className="text-3xl font-bold text-slate-800 mt-1">{data.summary.total}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        📄
                    </div>
                </Card>
                <Card variant="glass" className="p-6 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Aktif</p>
                        <h3 className="text-3xl font-bold text-emerald-600 mt-1">{data.summary.active}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                        ✅
                    </div>
                </Card>
                <Card variant="glass" className="p-6 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Sona Eren</p>
                        <h3 className="text-3xl font-bold text-slate-600 mt-1">{data.summary.ended}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                        🏁
                    </div>
                </Card>
                <Card variant="glass" className="p-6 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Yaklaşan Bitiş</p>
                        <h3 className="text-3xl font-bold text-amber-600 mt-1">{data.summary.expiringSoon}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                        ⚠️
                    </div>
                </Card>
            </div>

            {/* Grafikler */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-6">Birim Bazlı Sözleşme Dağılımı</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.byUnit} layout="vertical" margin={{ left: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                                <Tooltip />
                                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Sözleşme Sayısı" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card className="p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-6">Yaklaşan Sözleşme Bitişleri</h3>
                    <div className="h-80 overflow-y-auto pr-2">
                        <div className="space-y-3">
                            {data.expiringList.map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <div>
                                        <p className="font-medium text-slate-700">{item.name}</p>
                                        <p className="text-xs text-slate-500">{item.unit}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-amber-600">{item.date}</p>
                                        <p className="text-xs text-slate-400">Bitiş Tarihi</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>
            </div>

            {/* Detaylı Tablo */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Birim Bazlı Sözleşme Detayları</h3>
                    <div className="max-h-96 overflow-y-auto">
                        <TableContainer>
                            <Table>
                                <THead>
                                    <TR>
                                        <TH>Birim Adı</TH>
                                        <TH className="text-right">Sözleşme Sayısı</TH>
                                    </TR>
                                </THead>
                                <TBody>
                                    {data.byUnit.map((item, idx) => (
                                        <TR key={idx}>
                                            <TD>{item.name}</TD>
                                            <TD className="text-right font-medium">{item.count}</TD>
                                        </TR>
                                    ))}
                                </TBody>
                            </Table>
                        </TableContainer>
                    </div>
                </Card>

                <Card className="p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Sona Erecek Sözleşmeler Listesi</h3>
                    <div className="max-h-96 overflow-y-auto">
                        <TableContainer>
                            <Table>
                                <THead>
                                    <TR>
                                        <TH>Sözleşme Adı</TH>
                                        <TH>Birim</TH>
                                        <TH className="text-right">Bitiş Tarihi</TH>
                                    </TR>
                                </THead>
                                <TBody>
                                    {data.expiringList.map((item, idx) => (
                                        <TR key={idx}>
                                            <TD className="font-medium text-slate-700">{item.name}</TD>
                                            <TD className="text-slate-500">{item.unit}</TD>
                                            <TD className="text-right text-amber-600 font-medium">{item.date}</TD>
                                        </TR>
                                    ))}
                                </TBody>
                            </Table>
                        </TableContainer>
                    </div>
                </Card>
            </div>
        </div>
    );
}
