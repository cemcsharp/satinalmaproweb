"use client";

import React, { useMemo } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Area,
    AreaChart
} from 'recharts';
import useSWR from 'swr';

type Props = {
    name?: string;
    sku?: string;
};

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function PriceTrendChart({ name, sku }: Props) {
    const { data, error, isLoading } = useSWR(
        name || sku ? `/api/analytics/price-history?${name ? `name=${encodeURIComponent(name)}` : ''}${sku ? `&sku=${encodeURIComponent(sku)}` : ''}` : null,
        fetcher
    );

    const chartData = useMemo(() => {
        if (!data?.items) return [];
        return data.items;
    }, [data]);

    if (isLoading) return <div className="h-48 w-full bg-slate-50 animate-pulse rounded-2xl flex items-center justify-center text-slate-400 text-sm">Veriler yükleniyor...</div>;
    if (!name && !sku) return null;
    if (chartData.length === 0) return <div className="p-4 bg-slate-50 rounded-xl text-slate-400 text-sm italic">Bu ürün için henüz geçmiş fiyat verisi bulunmamaktadır.</div>;

    return (
        <div className="w-full space-y-4">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-700">Fiyat Trend Analizi</h4>
                {chartData.length > 1 && (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${chartData[chartData.length - 1].price > chartData[chartData.length - 2].price ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                        }`}>
                        {chartData[chartData.length - 1].price > chartData[chartData.length - 2].price ? '↑ Artış' : '↓ Azalış'}
                    </span>
                )}
            </div>

            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: '#64748b' }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: '#64748b' }}
                            tickFormatter={(val) => `₺${val}`}
                        />
                        <Tooltip
                            contentStyle={{
                                borderRadius: '12px',
                                border: 'none',
                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                fontSize: '12px'
                            }}
                            formatter={(value: any, name: any, props: any) => [
                                <span className="font-bold text-blue-600">{`₺${value}`}</span>,
                                "Fiyat"
                            ]}
                            labelFormatter={(label) => <span className="font-bold text-slate-800">{label}</span>}
                            cursor={{ stroke: '#3b82f6', strokeWidth: 2, strokeDasharray: '5 5' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="price"
                            stroke="#3b82f6"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorPrice)"
                            animationDuration={1500}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="text-[10px] text-slate-400">
                    En Düşük: <span className="font-bold text-emerald-600">₺{Math.min(...chartData.map((d: any) => d.price))}</span>
                </div>
                <div className="text-[10px] text-slate-400 text-right">
                    En Yüksek: <span className="font-bold text-rose-600">₺{Math.max(...chartData.map((d: any) => d.price))}</span>
                </div>
            </div>
        </div>
    );
}
