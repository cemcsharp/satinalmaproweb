"use client";
import React from "react";

type CardProps = {
  children: React.ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
  onClick?: () => void;
  variant?: "default" | "gradient" | "glass";
  title?: string;
};

export default function Card({
  children,
  className = "",
  padding = "md",
  hover = false,
  onClick,
  variant = "default",
  title,
}: CardProps) {
  const paddingStyles = {
    none: "",
    sm: "p-4",
    md: "p-5",
    lg: "p-6",
  }[padding];

  const variantStyles = {
    default: "bg-white border border-slate-200",
    gradient: "bg-white border border-blue-100",
    glass: "bg-white/80 backdrop-blur-sm border border-slate-200",
  }[variant];

  const hoverStyles = hover
    ? "hover:shadow-md hover:border-slate-300 cursor-pointer transition-all"
    : "";

  return (
    <div
      className={`
        rounded-lg shadow-sm
        ${paddingStyles}
        ${variantStyles}
        ${hoverStyles}
        ${className}
      `}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {title && (
        <div className="mb-4 pb-3 border-b border-slate-100">
          <h3 className="text-base font-semibold text-slate-800">{title}</h3>
        </div>
      )}
      {children}
    </div>
  );
}
