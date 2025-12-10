"use client";
import React from "react";

type PaginationProps = {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    showPageNumbers?: boolean;
    className?: string;
    pageSize?: number;
    totalItems?: number;
    onPageSizeChange?: (size: number) => void;
};

export default function Pagination({
    currentPage,
    totalPages,
    onPageChange,
    showPageNumbers = true,
    className = "",
    pageSize,
    totalItems,
    onPageSizeChange
}: PaginationProps) {
    const pages = React.useMemo(() => {
        const items: (number | string)[] = [];

        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) {
                items.push(i);
            }
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 5; i++) items.push(i);
                items.push("...");
                items.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                items.push(1);
                items.push("...");
                for (let i = totalPages - 4; i <= totalPages; i++) items.push(i);
            } else {
                items.push(1);
                items.push("...");
                for (let i = currentPage - 1; i <= currentPage + 1; i++) items.push(i);
                items.push("...");
                items.push(totalPages);
            }
        }

        return items;
    }, [currentPage, totalPages]);

    const buttonBase = `
    min-w-[36px] h-9
    flex items-center justify-center
    text-sm font-medium
    rounded-lg
    border
    transition-all duration-150
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

    return (
        <div className={`flex flex-wrap items-center gap-2 ${className}`}>
            {/* Page Size Selector */}
            {onPageSizeChange && pageSize && (
                <div className="flex items-center gap-2">
                    <span className="text-sm text-[var(--text-secondary)]">Sayfa:</span>
                    <select
                        value={pageSize}
                        onChange={(e) => onPageSizeChange(Number(e.target.value))}
                        className="px-2 py-1.5 text-sm bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
                    >
                        {[10, 20, 50, 100].map(size => (
                            <option key={size} value={size}>{size}</option>
                        ))}
                    </select>
                </div>
            )}

            {/* Total Items */}
            {totalItems !== undefined && (
                <span className="text-sm text-[var(--text-muted)]">
                    Toplam: {totalItems} kayıt
                </span>
            )}

            <div className="flex-1" />

            {/* Previous */}
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`
          ${buttonBase}
          px-3
          bg-[var(--bg-primary)]
          text-[var(--text-secondary)]
          border-[var(--border-default)]
          hover:bg-[var(--bg-tertiary)]
          hover:border-[var(--border-strong)]
        `}
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
            </button>

            {/* Page Numbers */}
            {showPageNumbers && pages.map((page, index) => (
                page === "..." ? (
                    <span key={`ellipsis-${index}`} className="px-2 text-[var(--text-muted)]">...</span>
                ) : (
                    <button
                        key={page}
                        onClick={() => onPageChange(page as number)}
                        className={`
              ${buttonBase}
              ${currentPage === page
                                ? "bg-[var(--brand-primary)] text-white border-[var(--brand-primary)]"
                                : "bg-[var(--bg-primary)] text-[var(--text-secondary)] border-[var(--border-default)] hover:bg-[var(--bg-tertiary)] hover:border-[var(--border-strong)]"
                            }
            `}
                    >
                        {page}
                    </button>
                )
            ))}

            {/* Next */}
            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`
          ${buttonBase}
          px-3
          bg-[var(--bg-primary)]
          text-[var(--text-secondary)]
          border-[var(--border-default)]
          hover:bg-[var(--bg-tertiary)]
          hover:border-[var(--border-strong)]
        `}
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </button>
        </div>
    );
}

