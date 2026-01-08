"use client";
import React from "react";
import PortalSidebar from "@/components/PortalSidebar";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-blue-50/30">
            <div className="flex h-screen w-screen overflow-hidden">
                {/* Dedicated Supplier Sidebar */}
                <PortalSidebar />

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    {/* Top Header (Subtle & Compact) */}
                    <header className="sticky top-0 z-30 backdrop-blur-xl bg-white/80 border-b border-slate-200/50">
                        <nav className="flex items-center justify-between h-16 px-6">
                            <div className="flex items-center gap-4">
                                <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Tedarikçi İşlem Merkezi</span>
                            </div>

                            <div className="flex items-center gap-6 text-right">
                                <div className="hidden sm:flex items-center gap-3 pr-4 border-r border-slate-100">
                                    <div className="flex flex-col items-end">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Erişim</p>
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                            <p className="text-xs font-bold text-slate-700 leading-none uppercase">Güvenli Seans</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </nav>
                    </header>

                    {/* Main Content Scroll Area */}
                    <main id="main-content" className="flex-1 p-6 md:p-8 overflow-y-auto overflow-x-hidden animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {children}

                        {/* Compact Footer inside main content */}
                        <footer className="mt-12 py-8 border-t border-slate-200/50">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                                <div className="flex flex-col items-center md:items-start">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                                        SatınalmaPRO Enterprise Portal v2.0
                                    </p>
                                    <p className="text-[9px] text-slate-300 font-medium">© {new Date().getFullYear()} Tüm Hakları Saklıdır.</p>
                                </div>
                                <div className="flex items-center gap-6">
                                    <a href="#" className="text-[10px] font-bold text-slate-400 hover:text-blue-600 uppercase tracking-widest transition-colors">Yardım</a>
                                    <a href="#" className="text-[10px] font-bold text-slate-400 hover:text-blue-600 uppercase tracking-widest transition-colors">KVKK</a>
                                    <a href="#" className="text-[10px] font-bold text-slate-400 hover:text-blue-600 uppercase tracking-widest transition-colors">Gizlilik Sözleşmesi</a>
                                </div>
                            </div>
                        </footer>
                    </main>
                </div>
            </div>
        </div>
    );
}
