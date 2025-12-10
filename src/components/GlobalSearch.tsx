"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

type SearchResult = {
    id: string;
    type: "talep" | "siparis" | "sozlesme" | "fatura" | "tedarikci";
    title: string;
    subtitle?: string;
    href: string;
};

const typeLabels: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    talep: {
        label: "Talep",
        color: "bg-blue-100 text-blue-700",
        icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
        ),
    },
    siparis: {
        label: "Sipariş",
        color: "bg-green-100 text-green-700",
        icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
        ),
    },
    sozlesme: {
        label: "Sözleşme",
        color: "bg-purple-100 text-purple-700",
        icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        ),
    },
    fatura: {
        label: "Fatura",
        color: "bg-amber-100 text-amber-700",
        icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
        ),
    },
    tedarikci: {
        label: "Tedarikçi",
        color: "bg-sky-100 text-sky-700",
        icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
        ),
    },
};

const quickLinks = [
    { label: "Yeni Talep", href: "/talep/olustur", icon: "📝" },
    { label: "Sipariş Oluştur", href: "/siparis/olustur", icon: "🛒" },
    { label: "Sözleşme Ekle", href: "/sozlesme/olustur", icon: "📄" },
    { label: "Tedarikçiler", href: "/tedarikci/liste", icon: "👥" },
];

export default function GlobalSearch() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Keyboard shortcut to open search
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setIsOpen(true);
            }
            if (e.key === "Escape") {
                setIsOpen(false);
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, []);

    // Focus input when modal opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    // Search function
    const search = useCallback(async (q: string) => {
        if (!q.trim()) {
            setResults([]);
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
            if (res.ok) {
                const data = await res.json();
                setResults(data.results || []);
            } else {
                setResults([]);
            }
        } catch (e) {
            console.error("Search error:", e);
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            search(query);
        }, 300);
        return () => clearTimeout(timer);
    }, [query, search]);

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedIndex((prev) => Math.max(prev - 1, 0));
        } else if (e.key === "Enter" && results[selectedIndex]) {
            e.preventDefault();
            router.push(results[selectedIndex].href);
            setIsOpen(false);
            setQuery("");
        }
    };

    const handleResultClick = (href: string) => {
        router.push(href);
        setIsOpen(false);
        setQuery("");
    };

    return (
        <>
            {/* Search Trigger Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 text-sm transition-colors min-w-[200px] md:min-w-[280px]"
            >
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="flex-1 text-left text-slate-400">Ara...</span>
                <kbd className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-xs text-slate-400">
                    Ctrl+K
                </kbd>
            </button>

            {/* Search Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsOpen(false)} />

                    {/* Modal */}
                    <div
                        ref={containerRef}
                        className="relative w-full max-w-xl bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-200"
                    >
                        {/* Search Input */}
                        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200">
                            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={(e) => {
                                    setQuery(e.target.value);
                                    setSelectedIndex(0);
                                }}
                                onKeyDown={handleKeyDown}
                                placeholder="Talep, sipariş, sözleşme veya tedarikçi ara..."
                                className="flex-1 bg-transparent text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none"
                            />
                            {loading && (
                                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            )}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1 rounded hover:bg-slate-100 transition-colors"
                            >
                                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Results */}
                        <div className="max-h-[400px] overflow-y-auto">
                            {query.trim() === "" ? (
                                // Quick Links when no query
                                <div className="p-4">
                                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                                        Hızlı Erişim
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {quickLinks.map((link) => (
                                            <button
                                                key={link.href}
                                                onClick={() => handleResultClick(link.href)}
                                                className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-slate-100 hover:bg-slate-50 hover:border-slate-200 transition-colors text-left"
                                            >
                                                <span className="text-xl">{link.icon}</span>
                                                <span className="text-sm font-medium text-slate-700">{link.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : results.length === 0 && !loading ? (
                                // No results
                                <div className="p-8 text-center">
                                    <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    <p className="text-sm text-slate-500">
                                        <span className="font-medium">"{query}"</span> için sonuç bulunamadı
                                    </p>
                                    <p className="text-xs text-slate-400 mt-1">
                                        Farklı anahtar kelimeler deneyin
                                    </p>
                                </div>
                            ) : (
                                // Search results
                                <div className="py-2">
                                    {results.map((result, index) => {
                                        const typeInfo = typeLabels[result.type];
                                        return (
                                            <button
                                                key={result.id}
                                                onClick={() => handleResultClick(result.href)}
                                                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${index === selectedIndex ? "bg-blue-50" : "hover:bg-slate-50"
                                                    }`}
                                            >
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${typeInfo?.color || "bg-slate-100 text-slate-600"}`}>
                                                    {typeInfo?.icon}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-medium text-slate-800 truncate">
                                                        {result.title}
                                                    </div>
                                                    {result.subtitle && (
                                                        <div className="text-xs text-slate-500 truncate">
                                                            {result.subtitle}
                                                        </div>
                                                    )}
                                                </div>
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${typeInfo?.color || "bg-slate-100 text-slate-600"}`}>
                                                    {typeInfo?.label}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between px-4 py-2 border-t border-slate-100 bg-slate-50 text-xs text-slate-400">
                            <div className="flex items-center gap-4">
                                <span className="flex items-center gap-1">
                                    <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded">↑</kbd>
                                    <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded">↓</kbd>
                                    <span className="ml-1">gezin</span>
                                </span>
                                <span className="flex items-center gap-1">
                                    <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded">Enter</kbd>
                                    <span className="ml-1">seç</span>
                                </span>
                            </div>
                            <span className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded">Esc</kbd>
                                <span className="ml-1">kapat</span>
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
