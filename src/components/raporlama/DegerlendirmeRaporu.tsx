"use client";
import { useEffect, useState, useCallback } from "react";
import Card from "@/components/ui/Card";
import { Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { TableContainer, Table, THead, TBody, TR, TH, TD } from "@/components/ui/Table";
import DateRangeFilter from "@/components/ui/DateRangeFilter";

interface DegerlendirmeReportData {
    summary: {
        total: number;
        averageScore: number;
        highScore: number;
        lowScore: number;
    };
    byCriteria: { criteria: string; score: number }[];
    recentEvaluations: { supplier: string; date: string; score: number }[];
}

export default function DegerlendirmeRaporu() {
    const [data, setData] = useState<DegerlendirmeReportData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback((startDate?: string, endDate?: string) => {
        setLoading(true);
        const params = new URLSearchParams({ type: "degerlendirme" });
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
                        <p className="text-sm text-slate-500 font-medium">Toplam Değerlendirme</p>
                        <h3 className="text-3xl font-bold text-slate-800 mt-1">{data.summary.total}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        📋
                    </div>
                </Card>
                <Card variant="glass" className="p-6 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Ortalama Puan</p>
                        <h3 className="text-3xl font-bold text-emerald-600 mt-1">{data.summary.averageScore}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                        ⭐
                    </div>
                </Card>
                <Card variant="glass" className="p-6 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Yüksek Puanlı</p>
                        <h3 className="text-3xl font-bold text-slate-600 mt-1">{data.summary.highScore}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                        🏆
                    </div>
                </Card>
                <Card variant="glass" className="p-6 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Düşük Puanlı</p>
                        <h3 className="text-3xl font-bold text-amber-600 mt-1">{data.summary.lowScore}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                        ⚠️
                    </div>
                </Card>
            </div>

            {/* Grafikler */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-6">Kriter Bazlı Ortalama Puanlar</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data.byCriteria}>
                                <PolarGrid />
                                <PolarAngleAxis dataKey="criteria" tick={{ fontSize: 12 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                                <Radar name="Puan" dataKey="score" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                                <Tooltip />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card className="p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-6">Son Değerlendirmeler</h3>
                    <div className="h-80 overflow-y-auto pr-2">
                        <div className="space-y-3">
                            {data.recentEvaluations.map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <div>
                                        <p className="font-medium text-slate-700">{item.supplier}</p>
                                        <p className="text-xs text-slate-500">{item.date}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-emerald-600">{item.score}</p>
                                        <p className="text-xs text-slate-400">Puan</p>
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
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Kriter Bazlı Puan Detayları</h3>
                    <div className="max-h-96 overflow-y-auto">
                        <TableContainer>
                            <Table>
                                <THead>
                                    <TR>
                                        <TH>Kriter</TH>
                                        <TH className="text-right">Ortalama Puan</TH>
                                    </TR>
                                </THead>
                                <TBody>
                                    {data.byCriteria.map((item, idx) => (
                                        <TR key={idx}>
                                            <TD>{item.criteria}</TD>
                                            <TD className="text-right font-medium text-emerald-600">{item.score}</TD>
                                        </TR>
                                    ))}
                                </TBody>
                            </Table>
                        </TableContainer>
                    </div>
                </Card>

                <Card className="p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Son Değerlendirmeler Listesi</h3>
                    <div className="max-h-96 overflow-y-auto">
                        <TableContainer>
                            <Table>
                                <THead>
                                    <TR>
                                        <TH>Tedarikçi</TH>
                                        <TH>Tarih</TH>
                                        <TH className="text-right">Puan</TH>
                                    </TR>
                                </THead>
                                <TBody>
                                    {data.recentEvaluations.map((item, idx) => (
                                        <TR key={idx}>
                                            <TD className="font-medium text-slate-700">{item.supplier}</TD>
                                            <TD className="text-slate-500">{item.date}</TD>
                                            <TD className="text-right font-bold text-emerald-600">{item.score}</TD>
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
