"use client";

export default function ListSkeleton({ rows = 5, cols = 4, className = "" }: { rows?: number; cols?: number; className?: string }) {
    return (
        <div className={`w-full ${className}`}>
            {Array.from({ length: rows }).map((_, i) => (
                <div
                    key={i}
                    className="flex items-center gap-4 border-b border-[var(--table-border)] py-4 last:border-0"
                >
                    <div className="grid w-full gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
                        {Array.from({ length: cols }).map((_, j) => (
                            <div
                                key={j}
                                className="h-5 animate-pulse rounded bg-[var(--muted)]"
                                style={{
                                    width: j === 0 ? "85%" : "65%",
                                    opacity: 1 - (j * 0.1) // Slight fade effect for columns
                                }}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
