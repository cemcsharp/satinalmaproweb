"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/ui/Icon";

interface CommandItem {
    id: string;
    label: string;
    description: string;
    icon: string;
    action: () => void;
    category: string;
}

export default function CommandCenter() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);

    const commands: CommandItem[] = [
        { id: "nav-dash", label: "Dashboard", description: "Control Tower paneline git", icon: "home", category: "Navigasyon", action: () => router.push("/dashboard") },
        { id: "nav-analiz", label: "Analiz Dashboard", description: "Analitik ve AI tahminlerine git", icon: "bar-chart", category: "Navigasyon", action: () => router.push("/analitik") },
        { id: "nav-talep", label: "Yeni Talep Oluştur", description: "Hızlıca yeni bir satın alma talebi aç", icon: "file-plus", category: "Aksiyon", action: () => router.push("/talep/olustur") },
        { id: "nav-orders", label: "Siparişlerim", description: "Tüm siparişleri listele", icon: "package", category: "Navigasyon", action: () => router.push("/siparis/liste") },
        { id: "nav-suppliers", label: "Tedarikçiler", description: "Tedarikçi havuzuna göz at", icon: "users", category: "Navigasyon", action: () => router.push("/tedarikci/liste") },
        { id: "act-budget", label: "Bütçe Durumu", description: "Departman bütçelerini incele", icon: "pie-chart", category: "Finans", action: () => router.push("/finans/butce") },
    ];

    const filtered = commands.filter(c =>
        c.label.toLowerCase().includes(query.toLowerCase()) ||
        c.category.toLowerCase().includes(query.toLowerCase()) ||
        c.description.toLowerCase().includes(query.toLowerCase())
    );

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
            if (e.key === "Escape") setIsOpen(false);
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 50);
            setSelectedIndex(0);
        }
    }, [isOpen]);

    const handleSelect = (cmd: CommandItem) => {
        cmd.action();
        setIsOpen(false);
        setQuery("");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % filtered.length);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + filtered.length) % filtered.length);
        } else if (e.key === "Enter") {
            if (filtered[selectedIndex]) handleSelect(filtered[selectedIndex]);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsOpen(false)} />

            <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center px-4 py-3 border-b border-slate-100">
                    <Icon name="search" className="w-5 h-5 text-slate-400 mr-3" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Nereye gitmek istersiniz? (Örn: Talep, Bütçe...)"
                        className="flex-1 bg-transparent border-none outline-none text-slate-700 font-medium text-lg placeholder:text-slate-300"
                    />
                    <div className="flex items-center gap-1">
                        <kbd className="px-2 py-1 bg-slate-100 border border-slate-200 rounded text-[10px] font-bold text-slate-500 uppercase">ESC</kbd>
                    </div>
                </div>

                <div className="max-h-[60vh] overflow-y-auto p-2">
                    {filtered.length > 0 ? (
                        <div className="space-y-4">
                            {/* Grouping could be added here if needed */}
                            <div className="grid grid-cols-1">
                                {filtered.map((cmd, idx) => (
                                    <button
                                        key={cmd.id}
                                        onClick={() => handleSelect(cmd)}
                                        onMouseEnter={() => setSelectedIndex(idx)}
                                        className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all text-left ${idx === selectedIndex ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50 text-slate-600'
                                            }`}
                                    >
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${idx === selectedIndex ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-slate-100 text-slate-400'
                                            }`}>
                                            <Icon name={cmd.icon} className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-bold text-sm tracking-tight">{cmd.label}</div>
                                            <div className={`text-[11px] font-medium opacity-70 ${idx === selectedIndex ? 'text-blue-500' : 'text-slate-400'}`}>
                                                {cmd.description}
                                            </div>
                                        </div>
                                        <div className="text-[10px] font-black uppercase tracking-widest opacity-30">{cmd.category}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="py-20 text-center text-slate-400 italic">Sonuç bulunamadı...</div>
                    )}
                </div>

                <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <span className="flex items-center gap-1"><kbd className="bg-white border rounded px-1.5">↵</kbd> Seç</span>
                        <span className="flex items-center gap-1"><kbd className="bg-white border rounded px-1.5">↑↓</kbd> Gezin</span>
                    </div>
                    <div className="text-[10px] font-black text-slate-300 uppercase letter-spacing-2">Satınalmacı.ai Command Center</div>
                </div>
            </div>
        </div>
    );
}
