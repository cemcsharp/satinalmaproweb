"use client";
import React from "react";

export const LucideIcon = ({ name, className }: { name: string, className?: string }) => {
    // Simple fallback for icons managed via CMS
    return <span className={className}>💎</span>;
};
