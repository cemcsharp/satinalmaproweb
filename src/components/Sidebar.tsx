"use client";
import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import { hasPermission } from "@/lib/permissions";
import { useModuleAccess } from "@/contexts/ModuleAccessContext";

import { menuItems, evaluatorMenuItems, categories, categoryColors, categoryIcons, type MenuItem } from "./sidebar/menuData";
import ProfileMenu from "./sidebar/ProfileMenu";

export default function Sidebar() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const [expanded, setExpanded] = useState(true);
    const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});
    const [userPermissions, setUserPermissions] = useState<string[]>([]);
    const [permissionsLoaded, setPermissionsLoaded] = useState(false);

    // Modül erişim kontrolü için context (sadece aktif/pasif kontrolü)
    const { isModuleEnabled, loading: moduleLoading } = useModuleAccess();

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

    // Filter menu items based on permissions and module status
    const filteredMenuItems = menuItems.filter(item => {
        // Admin sees everything
        if (isAdmin) return true;

        // Show everything by default if permissions not loaded yet
        if (!permissionsLoaded || moduleLoading) return true;

        // Check if module is enabled (from Module Management)
        if (item.moduleKey) {
            if (!isModuleEnabled(item.moduleKey)) return false;
        }

        // Check role restriction (if defined on menu item)
        if (item.requiredRole && item.requiredRole.length > 0) {
            if (!item.requiredRole.includes(userRole)) return false;
        }

        // Check permission (from Role Management)
        if (item.requiredPermission) {
            return hasPermission(userPermissions, item.requiredPermission, userRole);
        }

        return true;
    });

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
                <div className="p-3 border-t border-slate-700/50 shrink-0">
                    <ProfileMenu expanded={expanded} />
                </div>
            </div>
        </aside>
    );
}


