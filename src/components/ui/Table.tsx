"use client";
import React from "react";
import { usePreferences } from "@/providers/PreferencesProvider";

// Table Container
type TableContainerProps = {
  children: React.ReactNode;
  className?: string;
};

export function TableContainer({ children, className = "" }: TableContainerProps) {
  return (
    <div className={`
      bg-white
      border border-slate-200
      rounded-lg
      overflow-hidden
      shadow-sm
      ${className}
    `}>
      {children}
    </div>
  );
}

// Table
type TableProps = {
  children: React.ReactNode;
  className?: string;
};

export function Table({ children, className = "" }: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table className={`w-full border-collapse ${className}`}>
        {children}
      </table>
    </div>
  );
}

// Table Head
type THeadProps = {
  children: React.ReactNode;
  className?: string;
};

export function THead({ children, className = "" }: THeadProps) {
  return (
    <thead className={`bg-slate-50 ${className}`}>
      {children}
    </thead>
  );
}

// Table Header Cell
// Table Header Cell
type THProps = {
  children?: React.ReactNode;
  className?: string;
  align?: "left" | "center" | "right";
  sortable?: boolean;
  direction?: "asc" | "desc" | "ascending" | "descending" | null;
  onSort?: () => void;
};

export function TH({ children, className = "", align = "left", sortable, direction, onSort }: THProps) {
  const { preferences } = usePreferences();
  const isCompact = preferences.compactView;

  const alignClass = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  }[align];

  return (
    <th
      className={`
        ${isCompact ? "px-2 py-1.5" : "px-4 py-3"}
        text-[10px] sm:text-xs font-semibold uppercase tracking-wider
        text-slate-500
        border-b border-slate-200
        ${alignClass}
        ${sortable ? "cursor-pointer hover:bg-slate-100 hover:text-slate-700 select-none group" : ""}
        ${className}
      `}
      onClick={sortable ? onSort : undefined}
    >
      <div className={`flex items-center gap-1 ${align === "right" ? "justify-end" : align === "center" ? "justify-center" : ""}`}>
        {children}
        {sortable && (
          <span className="flex flex-col opacity-50 text-[8px] leading-[8px] group-hover:opacity-100 transition-opacity">
            <span className={`${(direction === "asc" || direction === "ascending") ? "text-blue-600 opacity-100" : ""}`}>▲</span>
            <span className={`${(direction === "desc" || direction === "descending") ? "text-blue-600 opacity-100" : ""}`}>▼</span>
          </span>
        )}
      </div>
    </th>
  );
}

// Table Body
type TBodyProps = {
  children: React.ReactNode;
  className?: string;
};

export function TBody({ children, className = "" }: TBodyProps) {
  return (
    <tbody className={`divide-y divide-slate-100 ${className}`}>
      {children}
    </tbody>
  );
}

// Table Row
type TRProps = {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  highlight?: boolean;
};

export function TR({ children, className = "", onClick, highlight = false }: TRProps) {
  return (
    <tr
      className={`
        transition-colors
        ${highlight
          ? 'bg-blue-50'
          : 'hover:bg-slate-50'
        }
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

// Table Data Cell
type TDProps = {
  children?: React.ReactNode;
  className?: string;
  align?: "left" | "center" | "right";
  colSpan?: number;
};

export function TD({ children, className = "", align = "left", colSpan }: TDProps) {
  const { preferences } = usePreferences();
  const isCompact = preferences.compactView;

  const alignClass = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  }[align];

  return (
    <td
      className={`
        ${isCompact ? "px-2 py-1.5" : "px-4 py-3"}
        ${isCompact ? "text-[12px] sm:text-xs" : "text-sm"}
        text-slate-700
        ${alignClass}
        ${className}
      `}
      colSpan={colSpan}
    >
      {children}
    </td>
  );
}

// Empty State
type TableEmptyProps = {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  colSpan?: number;
};

export function TableEmpty({
  title = "Kayıt bulunamadı",
  description = "Aradığınız kriterlere uygun veri bulunmuyor.",
  icon,
  action,
  colSpan = 1,
}: TableEmptyProps) {
  return (
    <TR>
      <TD colSpan={colSpan} className="py-12">
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center mb-3">
            {icon || (
              <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            )}
          </div>
          <h3 className="text-sm font-medium text-slate-700 mb-1">
            {title}
          </h3>
          <p className="text-sm text-slate-500 max-w-xs">
            {description}
          </p>
          {action && <div className="mt-3">{action}</div>}
        </div>
      </TD>
    </TR>
  );
}
