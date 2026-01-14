"use client";
import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import ProfileMenu from "./sidebar/ProfileMenu";

import { SystemSettings, defaultSettings } from "@/lib/settings";

export default function PortalSidebar() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const [expanded, setExpanded] = useState(true);
    const [openRfqCount, setOpenRfqCount] = useState(0);

    const [siteSettings, setSiteSettings] = useState<Partial<SystemSettings>>(defaultSettings);
    const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
        "Genel": true,
        "Süreçler": true,
        "Arşiv": true,
        "Yönetim": true
    });

    // Fetch settings for dynamic branding
    useEffect(() => {
        fetch("/api/admin/settings")
            .then(res => res.json())
            .then(data => {
                if (data.ok && data.settings) {
                    setSiteSettings(data.settings);
                }
            })
            .catch(console.error);
    }, []);

    const siteName = siteSettings.siteName || defaultSettings.siteName;
    const siteDescription = siteSettings.siteDescription || defaultSettings.siteDescription;

    // Fetch open RFQ count for badge
    useEffect(() => {
        fetch("/api/portal/open-rfqs")
            .then(res => res.json())
            .then(data => {
                if (data.ok && Array.isArray(data.rfqs)) {
                    // Count RFQs that supplier hasn't participated in yet
                    const newRfqs = data.rfqs.filter((r: any) => !r.token);
                    setOpenRfqCount(newRfqs.length);
                }
            })
            .catch(() => { });
    }, []);

    const menuItems = [
        { label: "Dashboard", href: "/portal", icon: "home", category: "Genel" },
        { label: "Açık Talepler", href: "/portal/rfq/marketplace", icon: "search", category: "Süreçler", badge: openRfqCount > 0 ? openRfqCount : undefined },
        { label: "Tekliflerim", href: "/portal/rfq", icon: "file-plus", category: "Süreçler" },
        { label: "Siparişlerim", href: "/portal/orders", icon: "cart", category: "Süreçler" },
        { label: "Sözleşmeler", href: "/portal/contracts", icon: "document", category: "Süreçler" },
        { label: "Teklif Geçmişi", href: "/portal/rfq/history", icon: "history", category: "Arşiv" },
        { label: "Firma Profili", href: "/portal/profile", icon: "settings", category: "Yönetim" },
        { label: "Destek Merkezi", href: "/portal/support", icon: "star", category: "Yönetim" },
    ];

    const categories = ["Genel", "Süreçler", "Arşiv", "Yönetim"];
    const categoryColors: Record<string, string> = {
        "Genel": "from-blue-500 to-indigo-500",
        "Süreçler": "from-emerald-500 to-teal-500",
        "Arşiv": "from-orange-500 to-amber-500",
        "Yönetim": "from-slate-500 to-gray-500",
    };
    const categoryIcons: Record<string, string> = {
        "Genel": "home",
        "Süreçler": "file-plus",
        "Arşiv": "history",
        "Yönetim": "settings",
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
                    <Link href="/portal" className="flex items-center gap-3 group overflow-hidden">
                        <div className="relative shrink-0">
                            <div className="w-11 h-11 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-shadow">
                                <span className="text-white font-bold text-xl uppercase tracking-tighter">S</span>
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-900" />
                        </div>
                        {expanded && (
                            <div className="animate-in fade-in duration-300">
                                <div className="text-lg font-bold text-white whitespace-nowrap leading-tight">{siteName}</div>
                                <div className="text-[10px] text-slate-400 font-bold whitespace-nowrap uppercase tracking-widest">{siteDescription}</div>
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
                        const hasActiveItem = items.some(item =>
                            pathname === item.href || (item.href !== "/portal" && pathname.startsWith(item.href))
                        );

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
                                            const active = pathname === item.href || (item.href !== "/portal" && pathname.startsWith(item.href));
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
                                                        <span className="text-sm truncate flex items-center gap-2">
                                                            {item.label}
                                                            {item.badge && (
                                                                <span className="px-1.5 py-0.5 bg-emerald-500 text-white text-[10px] font-bold rounded-full animate-pulse">
                                                                    {item.badge}
                                                                </span>
                                                            )}
                                                        </span>
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
                <div className="p-3 border-t border-slate-700/50 shrink-0">
                    <ProfileMenu
                        expanded={expanded}
                        profileLink="/portal/profile"
                        settingsLink="/portal/support"
                    />
                </div>
            </div>
        </aside>
    );
}
