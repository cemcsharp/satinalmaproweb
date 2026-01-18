"use client";
import React from "react";

type DashboardWidgetProps = {
    title: string;
    value: string | number;
    subtitle?: string;
    trend?: number; // percentage change
    icon?: React.ReactNode;
    color?: "blue" | "green" | "amber" | "red" | "purple" | "slate";
    loading?: boolean;
};

const colorStyles = {
    blue: {
        bg: "bg-blue-50",
        icon: "bg-blue-100 text-blue-600",
        text: "text-blue-700",
    },
    green: {
        bg: "bg-sky-50",
        icon: "bg-sky-100 text-blue-600",
        text: "text-blue-700",
    },
    amber: {
        bg: "bg-blue-50",
        icon: "bg-blue-100 text-blue-600",
        text: "text-blue-700",
    },
    red: {
        bg: "bg-red-50",
        icon: "bg-red-100 text-red-600",
        text: "text-red-700",
    },
    purple: {
        bg: "bg-indigo-50",
        icon: "bg-sky-100 text-indigo-600",
        text: "text-indigo-700",
    },
    slate: {
        bg: "bg-slate-50",
        icon: "bg-slate-100 text-slate-600",
        text: "text-slate-700",
    },
};

export default function DashboardWidget({
    title,
    value,
    subtitle,
    trend,
    icon,
    color = "blue",
    loading = false,
}: DashboardWidgetProps) {
    const styles = colorStyles[color];

    if (loading) {
        return (
            <div className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
                <div className="flex justify-between items-start">
                    <div className="space-y-3 flex-1">
                        <div className="h-4 bg-slate-200 rounded w-24"></div>
                        <div className="h-8 bg-slate-200 rounded w-16"></div>
                    </div>
                    <div className="w-12 h-12 bg-slate-200 rounded-xl"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
                <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-500">{title}</p>
                    <p className="text-2xl font-bold text-slate-800">{value}</p>
                    {(subtitle || trend !== undefined) && (
                        <div className="flex items-center gap-2 mt-1">
                            {trend !== undefined && (
                                <span
                                    className={`inline-flex items-center text-xs font-medium px-1.5 py-0.5 rounded ${trend >= 0
                                        ? "bg-sky-100 text-blue-700"
                                        : "bg-red-100 text-red-700"
                                        }`}
                                >
                                    {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
                                </span>
                            )}
                            {subtitle && (
                                <span className="text-xs text-slate-500">{subtitle}</span>
                            )}
                        </div>
                    )}
                </div>
                {icon && (
                    <div className={`w-12 h-12 rounded-xl ${styles.icon} flex items-center justify-center`}>
                        {icon}
                    </div>
                )}
            </div>
        </div>
    );
}

// Quick Activity Item component
export function ActivityItem({
    title,
    subtitle,
    status,
    time,
}: {
    title: string;
    subtitle?: string;
    status?: string;
    time?: string;
}) {
    const statusColors: Record<string, string> = {
        Beklemede: "bg-blue-100 text-blue-700",
        Pending: "bg-blue-100 text-blue-700",
        Onaylandı: "bg-sky-100 text-blue-700",
        Approved: "bg-sky-100 text-blue-700",
        Tamamlandı: "bg-sky-600 text-white",
        Completed: "bg-sky-600 text-white",
        İptal: "bg-red-100 text-red-700",
        Cancelled: "bg-red-100 text-red-700",
    };

    return (
        <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">{title}</p>
                {subtitle && (
                    <p className="text-xs text-slate-500">{subtitle}</p>
                )}
            </div>
            <div className="flex items-center gap-2 ml-4">
                {status && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[status] || "bg-slate-100 text-slate-600"}`}>
                        {status}
                    </span>
                )}
                {time && (
                    <span className="text-xs text-slate-400 whitespace-nowrap">{time}</span>
                )}
            </div>
        </div>
    );
}
