"use client";
import React, { useCallback } from "react";
import { FixedSizeList, ListChildComponentProps } from "react-window";

type VirtualizedListProps<T> = {
    items: T[];
    height: number;
    itemHeight: number;
    renderItem: (item: T, index: number) => React.ReactNode;
    className?: string;
    overscanCount?: number;
};

/**
 * VirtualizedList - Büyük listeler için sanal kaydırma bileşeni
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
    itemHeight,
    renderItem,
    className = "",
    overscanCount = 5,
}: VirtualizedListProps<T>) {
    const Row = useCallback(
        ({ index, style }: ListChildComponentProps) => (
            <div style={style}>{renderItem(items[index], index)}</div>
        ),
        [items, renderItem]
    );

    if (items.length === 0) {
        return (
            <div className={`flex items-center justify-center text-slate-500 ${className}`} style={{ height }}>
                Veri bulunamadı
            </div>
        );
    }

    // Küçük listeler için normal render
    if (items.length <= 20) {
        return (
            <div className={className} style={{ maxHeight: height, overflowY: "auto" }}>
                {items.map((item, index) => (
                    <div key={index}>{renderItem(item, index)}</div>
                ))}
            </div>
        );
    }

    // Büyük listeler için virtualization
    return (
        <FixedSizeList
            className={className}
            height={height}
            width="100%"
            itemCount={items.length}
            itemSize={itemHeight}
            overscanCount={overscanCount}
        >
            {Row}
        </FixedSizeList>
    );
}
