"use client";
import { useDemoModal } from "./LandingProvider";
import { ReactNode } from "react";

interface DemoTriggerProps {
    children: ReactNode;
    className?: string;
}

export default function DemoTrigger({ children, className }: DemoTriggerProps) {
    const openModal = useDemoModal();
    return (
        <button onClick={openModal} className={className}>
            {children}
        </button>
    );
}
