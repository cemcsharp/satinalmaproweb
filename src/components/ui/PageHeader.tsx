"use client";
import React from "react";

type PageHeaderProps = {
  title: string;
  description?: string;
  breadcrumbs?: { label: string; href?: string }[];
  actions?: React.ReactNode;
  children?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "gradient" | "glass" | "minimal";
  icon?: React.ReactNode;
};

export default function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  children,
  size = "md",
  variant = "default",
  icon,
}: PageHeaderProps) {
  const titleSizes = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-3xl",
  }[size];

  const paddingSizes = {
    sm: "p-5",
    md: "p-6",
    lg: "p-8",
  }[size];

  return (
    <div className="mb-6">
      {/* Breadcrumbs - Outside the box */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-sm mb-4" aria-label="Breadcrumb">
          <a href="/" className="text-slate-400 hover:text-blue-600 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </a>
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              {crumb.href ? (
                <a href={crumb.href} className="text-slate-500 hover:text-blue-600 transition-colors">
                  {crumb.label}
                </a>
              ) : (
                <span className="text-slate-700 font-medium">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Main Card Container */}
      <div className={`
        relative overflow-hidden
        bg-white
        border border-slate-200
        rounded-2xl
        shadow-sm hover:shadow-md
        transition-shadow duration-300
        ${paddingSizes}
      `}>
        {/* Background Pattern */}
        <div className="absolute inset-0 -z-10">
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50/30" />
          {/* Decorative circles */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-100/50 rounded-full blur-3xl" />
          <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-indigo-100/40 rounded-full blur-2xl" />
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.015]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}
          />
        </div>

        {/* Content */}
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Left side - Title area */}
          <div className="flex items-start gap-4">
            {/* Icon */}
            {icon && (
              <div className="relative flex-shrink-0">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
                  {icon}
                </div>
              </div>
            )}

            <div className="space-y-1">
              <h1 className={`${titleSizes} font-bold text-slate-800`}>
                {title}
              </h1>
              {description && (
                <p className="text-slate-500 max-w-xl">
                  {description}
                </p>
              )}
            </div>
          </div>

          {/* Right side - Actions */}
          {(actions || children) && (
            <div className="flex items-center gap-3 flex-shrink-0">
              {actions || children}
            </div>
          )}
        </div>

        {/* Bottom accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-80" />
      </div>
    </div>
  );
}
