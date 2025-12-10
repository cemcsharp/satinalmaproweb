"use client";
import { useEffect, useState, useCallback } from "react";
import Card from "@/components/ui/Card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TableContainer, Table, THead, TBody, TR, TH, TD } from "@/components/ui/Table";
import DateRangeFilter from "@/components/ui/DateRangeFilter";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#334155"];

interface SiparisReportData {
    summary: {
        total: number;
        totalAmount: number;
        budgetGap: number;
    };
    byMethod: { name: string; count: number; amount: number }[];
    byUnitSpend: { name: string; amount: number; budget: number }[];
}

export default function SiparisRaporu() {
    const [data, setData] = useState<SiparisReportData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback((startDate?: string, endDate?: string) => {
        setLoading(true);
        const params = new URLSearchParams({ type: "siparis" });
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card variant="glass" className="p-6 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Toplam Sipariş</p>
                        <h3 className="text-3xl font-bold text-slate-800 mt-1">{data.summary.total}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        📦
                    </div>
                </Card>
                <Card variant="glass" className="p-6 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Toplam Tutar</p>
                        <h3 className="text-3xl font-bold text-emerald-600 mt-1">
                            {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(data.summary.totalAmount)}
                        </h3>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                        💰
                    </div>
                </Card>
                <Card variant="glass" className="p-6 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Bütçe Farkı</p>
                        <h3 className={`text-3xl font-bold mt-1 ${data.summary.budgetGap < 0 ? "text-red-600" : "text-emerald-600"}`}>
                            {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(data.summary.budgetGap)}
                        </h3>
                    </div>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${data.summary.budgetGap < 0 ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"}`}>
                        📉
                    </div>
                </Card>
            </div>

            {/* Grafikler */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-6">Alım Yöntemi Dağılımı</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.byMethod}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="count"
                                    nameKey="name"
                                >
                                    {data.byMethod.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card className="p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-6">Birim Harcama vs Bütçe</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.byUnitSpend}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                <YAxis />
                                <Tooltip formatter={(value) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(Number(value))} />
                                <Legend />
                                <Bar dataKey="amount" name="Harcama" fill="#8884d8" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="budget" name="Bütçe" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>

            {/* Detaylı Tablo */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Alım Yöntemi Detayları</h3>
                    <div className="max-h-96 overflow-y-auto">
                        <TableContainer>
                            <Table>
                                <THead>
                                    <TR>
                                        <TH>Yöntem</TH>
                                        <TH className="text-right">Sipariş Sayısı</TH>
                                        <TH className="text-right">Toplam Tutar</TH>
                                    </TR>
                                </THead>
                                <TBody>
                                    {data.byMethod.map((item, idx) => (
                                        <TR key={idx}>
                                            <TD>{item.name}</TD>
                                            <TD className="text-right font-medium">{item.count}</TD>
                                            <TD className="text-right text-slate-600">
                                                {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(item.amount)}
                                            </TD>
                                        </TR>
                                    ))}
                                </TBody>
                            </Table>
                        </TableContainer>
                    </div>
                </Card>

                <Card className="p-6">
                </Card>
            </div>
        </div>
    );
}
