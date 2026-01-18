"use client";
import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import ProfileMenu from "./sidebar/ProfileMenu";
import { SystemSettings, defaultSettings } from "@/lib/settings";

export default function AdminSidebar({ settings }: { settings?: SystemSettings }) {
    const { data: session } = useSession();
    const pathname = usePathname();
    const [expanded, setExpanded] = useState(true);
    const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
        "Genel": true,
        "Yönetim": true,
        "Sistem": true
    });

    const siteName = settings?.siteName || defaultSettings.siteName;
    const siteDescription = "Sistem Yönetimi";

    const menuItems = [
        { label: "Dashboard", href: "/admin", icon: "home", category: "Genel" },
        { label: "Tedarikçiler", href: "/admin/tedarikciler", icon: "truck", category: "Yönetim" },
        { label: "Firmalar", href: "/admin/firmalar", icon: "building", category: "Yönetim" },
        { label: "Kullanıcılar", href: "/admin/kullanicilar", icon: "users", category: "Yönetim" },
        { label: "Roller & Yetkiler", href: "/admin/roller", icon: "settings", category: "Yönetim" },
        { label: "E-posta Ayarları", href: "/admin/e-posta", icon: "mail", category: "Sistem" },
        { label: "Modüller", href: "/admin/moduller", icon: "module", category: "Sistem" },
        { label: "Sistem Logları", href: "/admin/loglar", icon: "history", category: "Sistem" },
        { label: "Genel Ayarlar", href: "/admin/genel", icon: "settings", category: "Sistem" },
    ];

    const categories = ["Genel", "Yönetim", "Sistem"];
    // Ocean Blue Corporate Theme - consistent with main app
    const categoryColors: Record<string, string> = {
        "Genel": "from-slate-600 to-slate-700",
        "Yönetim": "from-sky-600 to-blue-700",
        "Sistem": "from-indigo-600 to-blue-700",
    };
    const categoryIcons: Record<string, string> = {
        "Genel": "home",
        "Yönetim": "building",
        "Sistem": "settings",
    };

    const toggleCategory = (category: string) => {
        setOpenCategories(prev => ({ ...prev, [category]: !prev[category] }));
    };

    return (
        <aside className={`shrink-0 h-screen transition-all duration-300 ${expanded ? "w-72" : "w-20"}`}>
            <div className={`
                fixed left-0 top-0 bottom-0 
                bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800
                flex flex-col 
                transition-all duration-300 z-40 
                ${expanded ? "w-72" : "w-20"}
            `}>
                {/* Logo Header & Toggle */}
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                    <Link href="/admin" className="flex items-center gap-3 group overflow-hidden">
                        <div className="relative shrink-0">
                            <div className="w-11 h-11 bg-gradient-to-br from-sky-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-sky-500/30 group-hover:shadow-sky-500/50 transition-shadow">
                                <span className="text-white font-bold text-xl uppercase tracking-tighter">A</span>
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-sky-500 rounded-full border-2 border-slate-900" />
                        </div>
                        {expanded && (
                            <div className="animate-in fade-in duration-300">
                                <div className="text-lg font-bold text-white whitespace-nowrap leading-tight">{siteName}</div>
                                <div className="text-[10px] text-sky-400 font-bold whitespace-nowrap uppercase tracking-widest">{siteDescription}</div>
                            </div>
                        )}
                    </Link>

                    {expanded && (
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all shrink-0"
                            aria-label="Menüyü daralt"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                            </svg>
                        </button>
                    )}
                </div>

                {!expanded && (
                    <div className="w-full flex justify-center py-2 border-b border-white/5">
                        <button
                            onClick={() => setExpanded(true)}
                            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                            aria-label="Menüyü genişlet"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                )}

                {/* Menu Items */}
                <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-2 custom-scrollbar">
                    {categories.map((category) => {
                        const items = menuItems.filter(item => item.category === category);
                        const isOpen = openCategories[category] ?? false;
                        const hasActiveItem = items.some(item => pathname === item.href);

                        return (
                            <div key={category} className="space-y-1">
                                {expanded ? (
                                    <button
                                        onClick={() => toggleCategory(category)}
                                        className={`
                                            w-full flex items-center justify-between 
                                            px-3 py-2.5 rounded-xl
                                            text-xs font-semibold uppercase tracking-wider 
                                            transition-all duration-200
                                            ${hasActiveItem
                                                ? `bg-gradient-to-r ${categoryColors[category]} text-white shadow-lg shadow-black/20`
                                                : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                            }
                                        `}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Icon name={categoryIcons[category]} className="w-4 h-4" />
                                            <span>{category}</span>
                                        </div>
                                        <svg
                                            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                ) : (
                                    <div className={`py-2 px-3 flex justify-center ${hasActiveItem ? `text-white` : "text-slate-400"}`}>
                                        <div className={`p-2 rounded-xl ${hasActiveItem ? `bg-gradient-to-r ${categoryColors[category]} shadow-lg` : "hover:bg-slate-800"} transition-all`}>
                                            <Icon name={categoryIcons[category]} className="w-5 h-5" />
                                        </div>
                                    </div>
                                )}

                                {(isOpen || !expanded) && (
                                    <div className={`space-y-0.5 ${expanded ? "ml-2 pl-3 border-l border-white/5" : ""}`}>
                                        {items.map((item) => {
                                            const active = pathname === item.href;
                                            return (
                                                <Link
                                                    key={item.href}
                                                    href={item.href}
                                                    className={`
                                                        group relative flex items-center gap-3 rounded-xl transition-all duration-200
                                                        ${expanded ? "px-3 py-2" : "px-2 py-2 justify-center"}
                                                        ${active
                                                            ? "bg-white/10 text-white font-medium"
                                                            : "text-slate-300 hover:bg-white/5 hover:text-white"
                                                        }
                                                    `}
                                                    title={!expanded ? item.label : undefined}
                                                >
                                                    {active && (
                                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                                                    )}
                                                    <Icon name={item.icon} className={`h-4 w-4 flex-shrink-0 ${active ? "text-white" : ""}`} />
                                                    {expanded && (
                                                        <span className="text-sm truncate">{item.label}</span>
                                                    )}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>

                {/* Bottom Profile Section */}
                <div className="p-3 border-t border-white/5 shrink-0">
                    <ProfileMenu
                        expanded={expanded}
                        profileLink="/admin/kullanicilar"
                        settingsLink="/admin/genel"
                    />
                </div>
            </div>
        </aside>
    );
}
