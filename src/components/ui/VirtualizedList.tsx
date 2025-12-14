"use client";
import React from "react";

type VirtualizedListProps<T> = {
    items: T[];
    height: number;
    itemHeight: number;
    renderItem: (item: T, index: number) => React.ReactNode;
    className?: string;
    overscanCount?: number;
};

/**
 * VirtualizedList - Simple list component (virtualization disabled due to missing dependency)
 * 
 * Kullanım:
 * ```tsx
 * <VirtualizedList
 *   items={data}
 *   height={400}
 *   itemHeight={50}
 *   renderItem={(item, index) => <div>{item.name}</div>}
 * />
 * ```
 */
export default function VirtualizedList<T>({
    items,
    height,
    // itemHeight,
    renderItem,
    className = "",
    // overscanCount = 5,
}: VirtualizedListProps<T>) {
    if (items.length === 0) {
        return (
            <div className={`flex items-center justify-center text-slate-500 ${className}`} style={{ height }}>
                Veri bulunamadı
            </div>
        );
    }

    // Simple scroll list (virtualization requires react-window package)
    return (
        <div className={className} style={{ maxHeight: height, overflowY: "auto" }}>
            {items.map((item, index) => (
                <div key={index}>{renderItem(item, index)}</div>
            ))}
        </div>
    );
}
