"use client";
import React from "react";

type BadgeProps = {
  children: React.ReactNode;
  variant?: "default" | "primary" | "success" | "warning" | "error" | "info" | "gradient";
  size?: "sm" | "md";
  className?: string;
  dot?: boolean;
};

export default function Badge({
  children,
  variant = "default",
  size = "sm",
  className = "",
  dot = false,
}: BadgeProps) {
  const sizeStyles = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
  }[size];

  const variantStyles = {
    default: "bg-slate-100 text-slate-600",
    primary: "bg-blue-100 text-blue-700",
    success: "bg-sky-500 text-white",
    warning: "bg-sky-100 text-blue-700",
    error: "bg-red-100 text-red-700",
    info: "bg-sky-100 text-blue-700",
    gradient: "bg-blue-600 text-white",
  }[variant];

  const dotColors = {
    default: "bg-slate-400",
    primary: "bg-blue-500",
    success: "bg-white",
    warning: "bg-blue-500",
    error: "bg-red-500",
    info: "bg-sky-500",
    gradient: "bg-white",
  }[variant];

  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        font-medium rounded-full
        ${sizeStyles}
        ${variantStyles}
        ${className}
      `}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColors}`} />
      )}
      {children}
    </span>
  );
}

// Status Badge with predefined status mappings
type StatusBadgeProps = {
  status: string;
  className?: string;
};

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const statusMap: Record<string, { variant: BadgeProps["variant"]; label: string }> = {
    // Turkish statuses
    "Beklemede": { variant: "warning", label: "Beklemede" },
    "Onaylandı": { variant: "success", label: "Onaylandı" },
    "Reddedildi": { variant: "error", label: "Reddedildi" },
    "İptal": { variant: "error", label: "İptal" },
    "Tamamlandı": { variant: "success", label: "Tamamlandı" },
    "Devam Ediyor": { variant: "info", label: "Devam Ediyor" },
    "Taslak": { variant: "default", label: "Taslak" },
    "Aktif": { variant: "success", label: "Aktif" },
    "Pasif": { variant: "default", label: "Pasif" },
    "Ödendi": { variant: "success", label: "Ödendi" },
    "Ödenmedi": { variant: "error", label: "Ödenmedi" },
    "Kısmi Ödeme": { variant: "warning", label: "Kısmi Ödeme" },
    // English statuses
    "pending": { variant: "warning", label: "Beklemede" },
    "approved": { variant: "success", label: "Onaylandı" },
    "rejected": { variant: "error", label: "Reddedildi" },
    "cancelled": { variant: "error", label: "İptal" },
    "completed": { variant: "success", label: "Tamamlandı" },
    "in_progress": { variant: "info", label: "Devam Ediyor" },
    "draft": { variant: "default", label: "Taslak" },
    "active": { variant: "success", label: "Aktif" },
    "inactive": { variant: "default", label: "Pasif" },
    "paid": { variant: "success", label: "Ödendi" },
    "unpaid": { variant: "error", label: "Ödenmedi" },
    "partial": { variant: "warning", label: "Kısmi Ödeme" },
  };

  const config = statusMap[status] || { variant: "default" as const, label: status };

  return (
    <Badge variant={config.variant} className={className} dot>
      {config.label}
    </Badge>
  );
}