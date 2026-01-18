"use client";
import { useEffect, useState, useCallback } from "react";
import Card from "@/components/ui/Card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TableContainer, Table, THead, TBody, TR, TH, TD } from "@/components/ui/Table";
import DateRangeFilter from "@/components/ui/DateRangeFilter";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

interface TalepReportData {
    summary: {
        total: number;
        approved: number;
        pending: number;
        rejected: number;
    };
    byUnit: { name: string; count: number }[];
    byPerson: { name: string; count: number }[];
}

export default function TalepRaporu() {
    const [data, setData] = useState<TalepReportData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback((startDate?: string, endDate?: string) => {
        setLoading(true);
        const params = new URLSearchParams({ type: "talep" });
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
                        <p className="text-sm text-slate-500 font-medium">Toplam Talep</p>
                        <h3 className="text-3xl font-bold text-slate-800 mt-1">{data.summary.total}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        📝
                    </div>
                </Card>
                <Card variant="glass" className="p-6 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Onaylanan</p>
                        <h3 className="text-3xl font-bold text-blue-600 mt-1">{data.summary.approved}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-sky-100 flex items-center justify-center text-blue-600">
                        ✅
                    </div>
                </Card>
                <Card variant="glass" className="p-6 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Bekleyen</p>
                        <h3 className="text-3xl font-bold text-blue-600 mt-1">{data.summary.pending}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-sky-100 flex items-center justify-center text-blue-600">
                        ⏳
                    </div>
                </Card>
                <Card variant="glass" className="p-6 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Reddedilen</p>
                        <h3 className="text-3xl font-bold text-red-600 mt-1">{data.summary.rejected}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                        ❌
                    </div>
                </Card>
            </div>

            {/* Grafikler */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-6">Birim Bazlı Talep Dağılımı</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.byUnit} layout="vertical" margin={{ left: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                                <Tooltip />
                                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Talep Sayısı" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card className="p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-6">Talep Durum Dağılımı</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: "Onaylanan", value: data.summary.approved },
                                        { name: "Bekleyen", value: data.summary.pending },
                                        { name: "Reddedilen", value: data.summary.rejected }
                                    ]}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {COLORS.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>

            {/* Detaylı Tablo */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Birim Bazlı Detaylar</h3>
                    <div className="max-h-96 overflow-y-auto">
                        <TableContainer>
                            <Table>
                                <THead>
                                    <TR>
                                        <TH>Birim Adı</TH>
                                        <TH className="text-right">Talep Sayısı</TH>
                                        <TH className="text-right">Oran</TH>
                                    </TR>
                                </THead>
                                <TBody>
                                    {data.byUnit.map((item, idx) => (
                                        <TR key={idx}>
                                            <TD>{item.name}</TD>
                                            <TD className="text-right font-medium">{item.count}</TD>
                                            <TD className="text-right text-slate-500">
                                                %{Math.round((item.count / data.summary.total) * 100)}
                                            </TD>
                                        </TR>
                                    ))}
                                </TBody>
                            </Table>
                        </TableContainer>
                    </div>
                </Card>

                <Card className="p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Kişi Bazlı Yoğunluk</h3>
                    <div className="max-h-96 overflow-y-auto">
                        <TableContainer>
                            <Table>
                                <THead>
                                    <TR>
                                        <TH>Personel</TH>
                                        <TH className="text-right">Talep Sayısı</TH>
                                        <TH className="text-right">Oran</TH>
                                    </TR>
                                </THead>
                                <TBody>
                                    {data.byPerson.map((item, idx) => (
                                        <TR key={idx}>
                                            <TD>{item.name}</TD>
                                            <TD className="text-right font-medium">{item.count}</TD>
                                            <TD className="text-right text-slate-500">
                                                %{Math.round((item.count / data.summary.total) * 100)}
                                            </TD>
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
