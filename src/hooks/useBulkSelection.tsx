"use client";
import { useState, useCallback, useMemo } from "react";

type UseBulkSelectionProps<T> = {
    items: T[];
    getItemId: (item: T) => string;
};

type UseBulkSelectionReturn<T> = {
    selectedIds: Set<string>;
    selectedItems: T[];
    isSelected: (id: string) => boolean;
    isAllSelected: boolean;
    isSomeSelected: boolean;
    toggle: (id: string) => void;
    toggleAll: () => void;
    select: (id: string) => void;
    deselect: (id: string) => void;
    selectAll: () => void;
    deselectAll: () => void;
    selectMany: (ids: string[]) => void;
    count: number;
};

/**
 * Hook for managing bulk selection in tables
 * 
 * Usage:
 * ```tsx
 * const { 
 *   selectedIds, 
 *   isSelected, 
 *   toggle, 
 *   toggleAll, 
 *   isAllSelected,
 *   count 
 * } = useBulkSelection({
 *   items: data,
 *   getItemId: (item) => item.id
 * });
 * ```
 */
export function useBulkSelection<T>({
    items,
    getItemId,
}: UseBulkSelectionProps<T>): UseBulkSelectionReturn<T> {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const allIds = useMemo(
        () => new Set(items.map(getItemId)),
        [items, getItemId]
    );

    const selectedItems = useMemo(
        () => items.filter((item) => selectedIds.has(getItemId(item))),
        [items, selectedIds, getItemId]
    );

    const isSelected = useCallback(
        (id: string) => selectedIds.has(id),
        [selectedIds]
    );

    const isAllSelected = useMemo(
        () => items.length > 0 && selectedIds.size === items.length,
        [items.length, selectedIds.size]
    );

    const isSomeSelected = useMemo(
        () => selectedIds.size > 0 && selectedIds.size < items.length,
        [selectedIds.size, items.length]
    );

    const toggle = useCallback((id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }, []);

    const toggleAll = useCallback(() => {
        setSelectedIds((prev) => {
            if (prev.size === items.length) {
                return new Set();
            }
            return new Set(allIds);
        });
    }, [items.length, allIds]);

    const select = useCallback((id: string) => {
        setSelectedIds((prev) => new Set(prev).add(id));
    }, []);

    const deselect = useCallback((id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });
    }, []);

    const selectAll = useCallback(() => {
        setSelectedIds(new Set(allIds));
    }, [allIds]);

    const deselectAll = useCallback(() => {
        setSelectedIds(new Set());
    }, []);

    const selectMany = useCallback((ids: string[]) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            ids.forEach((id) => next.add(id));
            return next;
        });
    }, []);

    return {
        selectedIds,
        selectedItems,
        isSelected,
        isAllSelected,
        isSomeSelected,
        toggle,
        toggleAll,
        select,
        deselect,
        selectAll,
        deselectAll,
        selectMany,
        count: selectedIds.size,
    };
}

/**
 * Bulk Actions Bar Component
 */
export function BulkActionsBar({
    selectedCount,
    onDelete,
    onExport,
    onClear,
    children,
}: {
    selectedCount: number;
    onDelete?: () => void;
    onExport?: () => void;
    onClear: () => void;
    children?: React.ReactNode;
}) {
    if (selectedCount === 0) return null;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-4 duration-300">
            <span className="text-sm font-medium">
                {selectedCount} öğe seçildi
            </span>
            <div className="h-4 w-px bg-slate-600" />
            <div className="flex items-center gap-2">
                {children}
                {onExport && (
                    <button
                        onClick={onExport}
                        className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                    >
                        Dışa Aktar
                    </button>
                )}
                {onDelete && (
                    <button
                        onClick={onDelete}
                        className="px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                    >
                        Sil
                    </button>
                )}
            </div>
            <button
                onClick={onClear}
                className="ml-2 p-1.5 hover:bg-slate-700 rounded-lg transition-colors"
                title="Seçimi temizle"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
}
