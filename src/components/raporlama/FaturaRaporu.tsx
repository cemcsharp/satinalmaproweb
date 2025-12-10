"use client";
import { useEffect, useState, useCallback } from "react";
import Card from "@/components/ui/Card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts";
import { TableContainer, Table, THead, TBody, TR, TH, TD } from "@/components/ui/Table";
import DateRangeFilter from "@/components/ui/DateRangeFilter";

interface FaturaReportData {
    summary: {
        total: number;
        paid: number;
        unpaid: number;
        totalAmount: number;
    };
    bySupplier: { name: string; amount: number }[];
    statusTrend: { date: string; paid: number; unpaid: number }[];
}

export default function FaturaRaporu() {
    const [data, setData] = useState<FaturaReportData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback((startDate?: string, endDate?: string) => {
        setLoading(true);
        const params = new URLSearchParams({ type: "fatura" });
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
                        <p className="text-sm text-slate-500 font-medium">Toplam Fatura</p>
                        <h3 className="text-3xl font-bold text-slate-800 mt-1">{data.summary.total}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        🧾
                    </div>
                </Card>
                <Card variant="glass" className="p-6 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Ödenen</p>
                        <h3 className="text-3xl font-bold text-emerald-600 mt-1">{data.summary.paid}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                        ✅
                    </div>
                </Card>
                <Card variant="glass" className="p-6 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Bekleyen</p>
                        <h3 className="text-3xl font-bold text-amber-600 mt-1">{data.summary.unpaid}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                        ⏳
                    </div>
                </Card>
                <Card variant="glass" className="p-6 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Toplam Tutar</p>
                        <h3 className="text-3xl font-bold text-slate-800 mt-1">
                            {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(data.summary.totalAmount)}
                        </h3>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                        💰
                    </div>
                </Card>
            </div>

            {/* Grafikler */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-6">Tedarikçi Bazlı Fatura Tutarı</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.bySupplier} layout="vertical" margin={{ left: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" tickFormatter={(val) => `₺${val / 1000}k`} />
                                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                                <Tooltip formatter={(value) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(Number(value))} />
                                <Bar dataKey="amount" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Tutar" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card className="p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-6">Ödeme Durumu Trendi</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.statusTrend}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                                <YAxis tickFormatter={(val) => `₺${val / 1000}k`} />
                                <Tooltip formatter={(value) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(Number(value))} />
                                <Legend />
                                <Area type="monotone" dataKey="paid" stackId="1" stroke="#10b981" fill="#10b981" name="Ödenen" />
                                <Area type="monotone" dataKey="unpaid" stackId="1" stroke="#f59e0b" fill="#f59e0b" name="Bekleyen" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>

            {/* Detaylı Tablo */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Tedarikçi Fatura Detayları</h3>
                    <div className="max-h-96 overflow-y-auto">
                        <TableContainer>
                            <Table>
                                <THead>
                                    <TR>
                                        <TH>Tedarikçi</TH>
                                        <TH className="text-right">Toplam Tutar</TH>
                                    </TR>
                                </THead>
                                <TBody>
                                    {data.bySupplier.map((item, idx) => (
                                        <TR key={idx}>
                                            <TD>{item.name}</TD>
                                            <TD className="text-right font-medium text-slate-700">
                                                {new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(item.amount)}
                                            </TD>
                                        </TR>
                                    ))}
                                </TBody>
                            </Table>
                        </TableContainer>
                    </div>
                </Card>

                <Card className="p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Aylık Ödeme Özeti</h3>
                    <div className="max-h-96 overflow-y-auto">
                        <TableContainer>
                            <Table>
                                <THead>
                                    <TR>
                                        <TH>Dönem</TH>
                                        <TH className="text-right">Ödenen</TH>
                                        <TH className="text-right">Bekleyen</TH>
                                    </TR>
                                </THead>
                                <TBody>
                                    {data.statusTrend.map((item, idx) => (
                                        <TR key={idx}>
                                            <TD className="font-medium text-slate-700">{item.date}</TD>
                                            <TD className="text-right text-emerald-600">
                                                {new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(item.paid)}
                                            </TD>
                                            <TD className="text-right text-amber-600">
                                                {new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(item.unpaid)}
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
