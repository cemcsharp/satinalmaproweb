"use client";
import React from "react";

type StatCardProps = {
    label?: string;
    title?: string;
    value: string | number;
    icon?: React.ReactNode;
    trend?: { value: string; direction: "up" | "down" } | string;
    change?: { value: string; direction: "up" | "down" } | string;
    variant?: "default" | "primary" | "success" | "warning" | "error" | "info";
    gradient?: boolean;
    className?: string;
};

export default function StatCard({
    label,
    title,
    value,
    icon,
    trend,
    change,
    variant = "default",
    gradient = false,
    className = "",
}: StatCardProps) {
    const displayLabel = label || title;
    const trendData = trend || change;

    const getTrendDirection = () => {
        if (!trendData) return null;
        if (typeof trendData === "string") {
            return trendData.startsWith("+") ? "up" : trendData.startsWith("-") ? "down" : "up";
        }
        return trendData.direction;
    };

    const getTrendValue = () => {
        if (!trendData) return null;
        if (typeof trendData === "string") return trendData;
        return trendData.value;
    };

    const direction = getTrendDirection();
    const trendValue = getTrendValue();

    // Colorful card backgrounds
    const cardStyles = {
        default: "bg-white border-slate-200",
        primary: "bg-gradient-to-br from-blue-500 to-blue-600 border-blue-400",
        success: "bg-gradient-to-br from-sky-500 to-sky-600 border-sky-400",
        warning: "bg-gradient-to-br from-sky-400 to-sky-500 border-sky-300",
        error: "bg-gradient-to-br from-red-500 to-red-600 border-red-400",
        info: "bg-gradient-to-br from-blue-500 to-blue-600 border-blue-400",
    }[variant];

    const isColored = variant !== "default";

    const iconStyles = isColored
        ? "bg-white/20 text-white"
        : {
            default: "bg-slate-100 text-slate-600",
            primary: "bg-blue-100 text-blue-600",
            success: "bg-sky-100 text-blue-600",
            warning: "bg-blue-100 text-blue-600",
            error: "bg-red-100 text-red-600",
            info: "bg-sky-100 text-indigo-600",
        }[variant];

    const textColor = isColored ? "text-white" : "text-slate-800";
    const labelColor = isColored ? "text-white/80" : "text-slate-500";

    return (
        <div
            className={`
                relative overflow-hidden
                border rounded-2xl p-5
                shadow-sm hover:shadow-lg
                transition-all duration-300
                hover:-translate-y-1
                ${cardStyles}
                ${className}
            `}
        >
            {/* Background pattern for colored cards */}
            {isColored && (
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-24 h-24 bg-white/10 rounded-full blur-xl" />
                    <div className="absolute -bottom-10 -left-10 w-20 h-20 bg-white/10 rounded-full blur-lg" />
                </div>
            )}

            <div className="relative">
                <div className="flex items-start justify-between mb-3">
                    {icon && (
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconStyles}`}>
                            {icon}
                        </div>
                    )}

                    {trendValue && (
                        <div className={`
                            flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold
                            ${isColored
                                ? "bg-white/20 text-white"
                                : direction === "up"
                                    ? "bg-green-100 text-green-600"
                                    : "bg-red-100 text-red-600"
                            }
                        `}>
                            {direction === "up" && (
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                </svg>
                            )}
                            {direction === "down" && (
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                </svg>
                            )}
                            {trendValue}
                        </div>
                    )}
                </div>

                <div className="space-y-1">
                    <div className={`text-3xl font-bold ${textColor}`}>
                        {value}
                    </div>
                    {displayLabel && (
                        <div className={`text-sm font-medium ${labelColor}`}>
                            {displayLabel}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
