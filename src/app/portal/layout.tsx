import React from "react";
import Link from "next/link";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
            {/* Specific Header for Suppliers */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-sm">
                            S
                        </div>
                        <span className="text-xl font-bold tracking-tight text-slate-800">
                            Satınalma<span className="text-blue-600">Pro</span> <span className="text-slate-400 font-medium text-sm ml-1">Portal</span>
                        </span>
                    </div>

                    <nav className="hidden md:flex items-center gap-6">
                        <Link href="/portal" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">
                            Pano
                        </Link>
                        <Link href="/portal/rfq" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">
                            Teklif İstekleri
                        </Link>
                    </nav>

                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-xs font-semibold text-slate-700">Tedarikçi Girişi</p>
                            <p className="text-[10px] text-slate-400">Portal Erişimi Aktif</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full animate-in fade-in slide-in-from-bottom-2 duration-500">
                {children}
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-slate-200 py-6">
                <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-slate-400">
                        &copy; {new Date().getFullYear()} Satınalma Pro v2.0 - Tedarikçi Portalı
                    </p>
                    <div className="flex items-center gap-6">
                        <Link href="#" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">Destek</Link>
                        <Link href="#" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">Kullanım Koşulları</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
