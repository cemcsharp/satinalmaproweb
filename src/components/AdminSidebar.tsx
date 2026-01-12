"use client";
import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Icon from "@/components/ui/Icon";

export default function AdminSidebar() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const [expanded, setExpanded] = useState(true);

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

    return (
        <aside className={`shrink-0 h-screen transition-all duration-300 ${expanded ? "w-64" : "w-20"}`}>
            <div className={`
                fixed left-0 top-0 bottom-0 
                bg-gradient-to-b from-red-900 via-red-900 to-red-800
                flex flex-col 
                transition-all duration-300 z-40 
                ${expanded ? "w-64" : "w-20"}
            `}>
                {/* Logo Header */}
                <div className="p-4 border-b border-red-700/50 flex items-center justify-between">
                    <Link href="/admin" className="flex items-center gap-3 group overflow-hidden">
                        <div className="relative shrink-0">
                            <div className="w-11 h-11 bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                                <span className="text-white font-bold text-xl">A</span>
                            </div>
                        </div>
                        {expanded && (
                            <div className="animate-in fade-in duration-300">
                                <div className="text-lg font-bold text-white whitespace-nowrap">Admin Panel</div>
                                <div className="text-[10px] text-red-300 font-medium whitespace-nowrap uppercase tracking-wider">Sistem Yönetimi</div>
                            </div>
                        )}
                    </Link>

                    {expanded && (
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className="p-1.5 rounded-lg text-red-300 hover:text-white hover:bg-red-800 transition-all shrink-0"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                            </svg>
                        </button>
                    )}
                </div>

                {!expanded && (
                    <div className="w-full flex justify-center py-2 border-b border-red-700/50">
                        <button
                            onClick={() => setExpanded(true)}
                            className="p-2 rounded-lg text-red-300 hover:text-white hover:bg-red-800 transition-all"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                )}

                {/* Menu Items */}
                <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-4">
                    {categories.map((category) => {
                        const items = menuItems.filter(item => item.category === category);
                        return (
                            <div key={category} className="space-y-1">
                                {expanded && (
                                    <div className="px-3 py-2 text-xs font-semibold text-red-400 uppercase tracking-wider">
                                        {category}
                                    </div>
                                )}
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
                                                    : "text-red-200 hover:bg-white/5 hover:text-white"
                                                }
                                            `}
                                            title={!expanded ? item.label : undefined}
                                        >
                                            <Icon name={item.icon} className="h-4 w-4 flex-shrink-0" />
                                            {expanded && (
                                                <span className="text-sm truncate">{item.label}</span>
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        );
                    })}
                </nav>

                {/* Bottom Section */}
                <div className="p-3 border-t border-red-700/50 shrink-0">
                    <div className={`flex items-center ${expanded ? "gap-3" : "justify-center"}`}>
                        <div className="w-10 h-10 bg-red-700 rounded-full flex items-center justify-center text-white font-bold">
                            {session?.user?.email?.charAt(0).toUpperCase() || "A"}
                        </div>
                        {expanded && (
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">
                                    {session?.user?.email || "Admin"}
                                </p>
                                <p className="text-xs text-red-300">Sistem Yöneticisi</p>
                            </div>
                        )}
                    </div>
                    {expanded && (
                        <button
                            onClick={() => signOut({ callbackUrl: "/admin/login" })}
                            className="w-full mt-3 px-3 py-2 text-sm text-red-200 hover:text-white hover:bg-red-800 rounded-xl transition-colors flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Çıkış Yap
                        </button>
                    )}
                </div>
            </div>
        </aside>
    );
}
