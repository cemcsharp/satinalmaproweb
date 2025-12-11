"use client";
import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import { hasPermission } from "@/lib/permissions";
import { LanguageSwitcher } from "@/lib/i18n";

type MenuItem = {
    label: string;
    href: string;
    icon: string;
    category: string;
    requiredPermission?: string | string[];
};

const menuItems: MenuItem[] = [
    { label: "Dashboard", href: "/", icon: "home", category: "Ana" },
    { label: "Talep Oluştur", href: "/talep/olustur", icon: "file-plus", category: "Talep", requiredPermission: "talep:create" },
    { label: "Talep Listesi", href: "/talep/liste", icon: "file-text", category: "Talep", requiredPermission: "talep:read" },
    { label: "Sipariş Oluştur", href: "/siparis/olustur", icon: "cart", category: "Sipariş", requiredPermission: "siparis:create" },
    { label: "Sipariş Listesi", href: "/siparis/liste", icon: "package", category: "Sipariş", requiredPermission: "siparis:read" },

    // Teslimat
    { label: "Bekleyen Teslimatlar", href: "/teslimat/bekleyen", icon: "truck", category: "Teslimat", requiredPermission: "teslimat:read" },
    { label: "Onay Bekleyenler", href: "/teslimat/onay", icon: "clipboard-check", category: "Teslimat", requiredPermission: "teslimat:read" },
    { label: "Teslimat Geçmişi", href: "/teslimat/gecmis", icon: "history", category: "Teslimat", requiredPermission: "teslimat:read" },

    { label: "Sözleşme Oluştur", href: "/sozlesme/olustur", icon: "document", category: "Sözleşme", requiredPermission: "sozlesme:create" },
    { label: "Sözleşme Listesi", href: "/sozlesme/liste", icon: "clipboard", category: "Sözleşme", requiredPermission: "sozlesme:read" },
    { label: "Fatura Oluştur", href: "/fatura/olustur", icon: "receipt", category: "Fatura", requiredPermission: "fatura:create" },
    { label: "Fatura Listesi", href: "/fatura/liste", icon: "document", category: "Fatura", requiredPermission: "fatura:read" },
    { label: "Toplantı Oluştur", href: "/toplanti/olustur", icon: "calendar", category: "Toplantı" },
    { label: "Toplantı Listesi", href: "/toplanti/liste", icon: "list", category: "Toplantı" },
    { label: "Tedarikçi Oluştur", href: "/tedarikci/olustur", icon: "user-plus", category: "Tedarikçi", requiredPermission: "tedarikci:create" },
    { label: "Tedarikçi Listesi", href: "/tedarikci/liste", icon: "users", category: "Tedarikçi", requiredPermission: "tedarikci:read" },
    { label: "Tedarikçi Değerlendirme", href: "/tedarikci/degerlendirme", icon: "star", category: "Tedarikçi", requiredPermission: "evaluation:submit" },
    { label: "Değerlendirmeler", href: "/tedarikci/degerlendirmeler", icon: "bar-chart", category: "Tedarikçi", requiredPermission: "tedarikci:read" },
    { label: "Raporlar", href: "/raporlama/raporlar", icon: "clipboard", category: "Raporlama", requiredPermission: "rapor:read" },
    { label: "Dashboard", href: "/raporlama/dashboard", icon: "pie-chart", category: "Raporlama", requiredPermission: "rapor:read" },
    { label: "Genel Ayarlar", href: "/ayarlar", icon: "settings", category: "Ayarlar" },
    // Meeting module removed
    // Calendar module removed
];

// Restricted menu for birim_evaluator role
const evaluatorMenuItems: MenuItem[] = [
    { label: "Dashboard", href: "/", icon: "home", category: "Ana" },
    { label: "Değerlendirmelerim", href: "/birim/degerlendirmeler", icon: "star", category: "Değerlendirme" },
    { label: "Değerlendirme Yap", href: "/tedarikci/degerlendirme", icon: "check-square", category: "Değerlendirme" },
];

const categories = ["Ana", "Talep", "Sipariş", "Teslimat", "Sözleşme", "Fatura", "Toplantı", "Tedarikçi", "Raporlama", "Ayarlar"];
const evaluatorCategories = ["Ana", "Değerlendirme"];

const categoryColors: Record<string, string> = {
    "Ana": "from-blue-500 to-indigo-500",
    "Talep": "from-emerald-500 to-teal-500",
    "Sipariş": "from-orange-500 to-amber-500",
    "Teslimat": "from-blue-600 to-cyan-600",
    "Sözleşme": "from-purple-500 to-violet-500",
    "Fatura": "from-rose-500 to-pink-500",
    "Toplantı": "from-cyan-500 to-sky-500",
    "Tedarikçi": "from-lime-500 to-green-500",
    "Raporlama": "from-fuchsia-500 to-purple-500",
    "Ayarlar": "from-slate-500 to-gray-500",
    "Değerlendirme": "from-emerald-500 to-green-500",
};

const categoryIcons: Record<string, string> = {
    "Ana": "home",
    "Talep": "file-plus",
    "Sipariş": "cart",
    "Teslimat": "truck",
    "Sözleşme": "document",
    "Fatura": "receipt",
    "Toplantı": "calendar",
    "Tedarikçi": "users",
    "Raporlama": "bar-chart",
    "Ayarlar": "settings",
    "Değerlendirme": "star",
};

export default function Sidebar() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const [expanded, setExpanded] = useState(true);
    const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});
    const [userPermissions, setUserPermissions] = useState<string[]>([]);
    const [permissionsLoaded, setPermissionsLoaded] = useState(false);

    // Fetch user permissions from profile API
    useEffect(() => {
        if (session?.user) {
            fetch("/api/profile")
                .then(r => r.ok ? r.json() : null)
                .then(data => {
                    if (data?.permissions) {
                        setUserPermissions(data.permissions);
                    }
                    setPermissionsLoaded(true);
                })
                .catch(() => {
                    setPermissionsLoaded(true);
                });
        }
    }, [session?.user]);

    // Check user role
    const userRole = (session?.user as any)?.role;
    const isAdmin = userRole === "admin";

    // Filter menu items based on permissions for ALL roles (including birim_evaluator)
    // Show all items as requested
    const filteredMenuItems = menuItems;

    // Add evaluator-specific menu items if user has evaluation:submit permission
    const evaluatorExtraItems: MenuItem[] = [];
    if (hasPermission(userPermissions, "evaluation:submit", userRole) || !permissionsLoaded) {
        // Check if evaluator items already exist in filtered items
        const hasEvaluatorDashboard = filteredMenuItems.some(i => i.href === "/birim/degerlendirmeler");
        if (!hasEvaluatorDashboard) {
            evaluatorExtraItems.push(
                { label: "Değerlendirmelerim", href: "/birim/degerlendirmeler", icon: "star", category: "Değerlendirme" }
            );
        }
    }

    const activeMenuItems = [...filteredMenuItems, ...evaluatorExtraItems];

    // Determine active categories based on what's in the filtered menu
    const usedCategories = new Set(activeMenuItems.map(item => item.category));
    const activeCategories = categories.filter(cat => usedCategories.has(cat));

    useEffect(() => {
        const matchingCategory = activeMenuItems.find(item =>
            pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
        )?.category;

        if (matchingCategory) {
            setOpenCategories(prev => ({ ...prev, [matchingCategory]: true }));
        }
    }, [pathname, activeMenuItems]);

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
                <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 group overflow-hidden">
                        <div className="relative shrink-0">
                            <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-shadow">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-900" />
                        </div>
                        {expanded && (
                            <div className="animate-in fade-in duration-300">
                                <div className="text-lg font-bold text-white whitespace-nowrap">SatınalmaPRO</div>
                                <div className="text-[10px] text-slate-400 font-medium whitespace-nowrap">Kurumsal Çözümler</div>
                            </div>
                        )}
                    </Link>

                    {/* Collapse Button (Only visible when expanded, or adjust logic) */}
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

                {/* Mobile/Collapsed Toggle (Centered if collapsed) */}
                {!expanded && (
                    <div className="w-full flex justify-center py-2 border-b border-slate-700/50">
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
                    {activeCategories.map((category) => {
                        const items = activeMenuItems.filter(item => item.category === category);
                        const isOpen = openCategories[category] ?? false;
                        const hasActiveItem = items.some(item =>
                            pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
                        );

                        return (
                            <div key={category} className="space-y-1">
                                {/* Category Header */}
                                {expanded ? (
                                    <button
                                        onClick={() => toggleCategory(category)}
                                        className={`
                                            w-full flex items-center justify-between 
                                            px-3 py-2.5 rounded-xl
                                            text-xs font-semibold uppercase tracking-wider 
                                            transition-all duration-200
                                            ${hasActiveItem
                                                ? `bg-gradient-to-r ${categoryColors[category]} text-white shadow-lg`
                                                : "text-slate-300 hover:bg-slate-800 hover:text-white"
                                            }
                                        `}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Icon name={categoryIcons[category] || "folder"} className="w-4 h-4" />
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
                                    <div className={`py-2 flex justify-center ${hasActiveItem ? `text-white` : "text-slate-400"}`}>
                                        <div className={`p-2 rounded-xl ${hasActiveItem ? `bg-gradient-to-r ${categoryColors[category]}` : "hover:bg-slate-800"} transition-all`}>
                                            <Icon name={categoryIcons[category] || "folder"} className="w-5 h-5" />
                                        </div>
                                    </div>
                                )}

                                {/* Category Items */}
                                {(isOpen || !expanded) && (
                                    <div className={`space-y-0.5 ${expanded ? "ml-2 pl-3 border-l border-slate-700" : ""}`}>
                                        {items.map((item) => {
                                            const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

                                            return (
                                                <Link
                                                    key={item.href}
                                                    href={item.href}
                                                    prefetch={false}
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
                <div className="p-3 border-t border-slate-700/50 shrink-0 space-y-2">
                    {/* Language Switcher */}
                    {expanded && (
                        <div className="px-2">
                            <LanguageSwitcher />
                        </div>
                    )}
                    <ProfileMenu expanded={expanded} />
                </div>
            </div>
        </aside>
    );
}

function ProfileMenu({ expanded }: { expanded: boolean }) {
    const [open, setOpen] = useState(false);
    const { data: session } = useSession();
    const [userName, setUserName] = useState<string>("Kullanıcı");
    const menuRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        async function loadProfile() {
            try {
                const res = await fetch("/api/profile");
                if (res.ok) {
                    const data = await res.json();
                    setUserName(data.username || session?.user?.name || "Kullanıcı");
                }
            } catch {
                setUserName(session?.user?.name || "Kullanıcı");
            }
        }
        loadProfile();
    }, [session]);

    React.useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }
        if (open) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [open]);

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setOpen(!open)}
                className={`
                    w-full flex items-center gap-3 
                    rounded-xl 
                    bg-slate-800 hover:bg-slate-700
                    border border-slate-700
                    transition-all duration-200
                    ${expanded ? "px-3 py-2.5" : "px-2 py-2.5 justify-center"}
                `}
            >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-lg shadow-emerald-500/20">
                    {userName.charAt(0).toUpperCase()}
                </div>
                {expanded && (
                    <div className="flex-1 min-w-0 text-left">
                        <div className="text-sm font-semibold text-white truncate">{userName}</div>
                        <div className="text-xs text-slate-400 truncate">Yönetici</div>
                    </div>
                )}
                {expanded && (
                    <svg className={`w-4 h-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                )}
            </button>

            {open && (
                <div className="absolute bottom-full left-0 right-0 mb-2 rounded-xl border border-slate-700 bg-slate-800 shadow-xl overflow-hidden">
                    <Link
                        href="/profile"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Profil
                    </Link>
                    <Link
                        href="/ayarlar"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors border-t border-slate-700"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Ayarlar
                    </Link>
                    <button
                        onClick={() => {
                            setOpen(false);
                            signOut({ callbackUrl: "/login" });
                        }}
                        className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors border-t border-slate-700"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Çıkış Yap
                    </button>
                </div>
            )}
        </div>
    );
}
