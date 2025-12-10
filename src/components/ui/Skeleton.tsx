"use client";
import React from "react";

type SkeletonProps = {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
  animation?: "pulse" | "wave" | "none";
};

export default function Skeleton({
  className = "",
  variant = "rectangular",
  width,
  height,
  animation = "pulse"
}: SkeletonProps) {
  const variantStyles = {
    text: "rounded",
    circular: "rounded-full",
    rectangular: "rounded-lg",
  }[variant];

  const animationStyles = {
    pulse: "animate-pulse",
    wave: "skeleton-wave",
    none: "",
  }[animation];

  const style: React.CSSProperties = {
    width: width ?? "100%",
    height: height ?? (variant === "text" ? "1em" : "100%"),
  };

  return (
    <div
      className={`
        bg-[var(--bg-tertiary)]
        ${variantStyles}
        ${animationStyles}
        ${className}
      `}
      style={style}
    />
  );
}

// Pre-built skeleton patterns
export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`
      bg-[var(--card-bg)] 
      border border-[var(--card-border)] 
      rounded-xl p-6
      ${className}
    `}>
      <div className="flex items-start gap-4">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="flex-1 space-y-3">
          <Skeleton variant="text" height={20} width="60%" />
          <Skeleton variant="text" height={16} width="40%" />
        </div>
      </div>
      <div className="mt-6 space-y-3">
        <Skeleton variant="text" height={14} />
        <Skeleton variant="text" height={14} />
        <Skeleton variant="text" height={14} width="80%" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="
      bg-[var(--card-bg)] 
      border border-[var(--table-border)] 
      rounded-xl 
      overflow-hidden
    ">
      {/* Header */}
      <div className="flex bg-[var(--table-header-bg)] border-b border-[var(--table-border)] p-4 gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} variant="text" height={14} className="flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="flex p-4 gap-4 border-b border-[var(--border-light)] last:border-b-0"
        >
          {Array.from({ length: cols }).map((_, colIndex) => (
            <Skeleton key={colIndex} variant="text" height={16} className="flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}