"use client";
import { useEffect, useState, useRef, ReactNode } from "react";
import { createPortal } from "react-dom";

type Props = {
    children: ReactNode;
    anchorRef: React.RefObject<HTMLElement | null>;
    isOpen: boolean;
    className?: string;
};

export default function DropdownPortal({ children, anchorRef, isOpen, className = "" }: Props) {
    const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!isOpen || !anchorRef.current) return;

        const updatePosition = () => {
            const rect = anchorRef.current?.getBoundingClientRect();
            if (rect) {
                setPosition({
                    top: rect.bottom + window.scrollY + 4,
                    left: rect.left + window.scrollX,
                    width: Math.max(rect.width, 320)
                });
            }
        };

        updatePosition();
        window.addEventListener("scroll", updatePosition, true);
        window.addEventListener("resize", updatePosition);

        return () => {
            window.removeEventListener("scroll", updatePosition, true);
            window.removeEventListener("resize", updatePosition);
        };
    }, [isOpen, anchorRef]);

    if (!mounted || !isOpen) return null;

    return createPortal(
        <div
            className={`fixed z-[9999] bg-white border border-slate-200 rounded-lg shadow-xl max-h-48 overflow-y-auto ${className}`}
            style={{
                top: position.top,
                left: position.left,
                width: position.width,
            }}
        >
            {children}
        </div>,
        document.body
    );
}
