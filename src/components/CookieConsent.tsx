"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function CookieConsent() {
    const [showBanner, setShowBanner] = useState(false);
    const [showDetails, setShowDetails] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem("cookie-consent");
        if (!consent) {
            // Small delay to avoid layout shift on load
            const timer = setTimeout(() => setShowBanner(true), 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAcceptAll = () => {
        localStorage.setItem("cookie-consent", JSON.stringify({
            necessary: true,
            functional: true,
            analytics: true,
            acceptedAt: new Date().toISOString()
        }));
        setShowBanner(false);
    };

    const handleAcceptNecessary = () => {
        localStorage.setItem("cookie-consent", JSON.stringify({
            necessary: true,
            functional: false,
            analytics: false,
            acceptedAt: new Date().toISOString()
        }));
        setShowBanner(false);
    };

    if (!showBanner) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[9999] animate-in slide-in-from-bottom-5 duration-500">
            <div className="bg-white border-t border-slate-200 shadow-2xl shadow-black/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6">
                        {/* Icon & Text */}
                        <div className="flex-1">
                            <div className="flex items-start gap-3">
                                <div className="hidden sm:flex w-10 h-10 bg-blue-100 rounded-xl items-center justify-center flex-shrink-0">
                                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-800 mb-1">Çerezleri Kullanıyoruz</h3>
                                    <p className="text-sm text-slate-600 leading-relaxed">
                                        Size en iyi deneyimi sunmak için çerezler kullanıyoruz.
                                        {!showDetails && (
                                            <button
                                                onClick={() => setShowDetails(true)}
                                                className="text-blue-600 hover:text-blue-700 font-medium ml-1"
                                            >
                                                Detaylar
                                            </button>
                                        )}
                                    </p>
                                </div>
                            </div>

                            {/* Details Section */}
                            {showDetails && (
                                <div className="mt-4 p-4 bg-slate-50 rounded-xl text-sm space-y-3 animate-in fade-in duration-300">
                                    <div className="flex items-start gap-3">
                                        <div className="w-5 h-5 rounded bg-blue-500 flex items-center justify-center flex-shrink-0">
                                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div>
                                            <span className="font-medium text-slate-800">Zorunlu Çerezler</span>
                                            <span className="text-slate-500 ml-2">(Her zaman aktif)</span>
                                            <p className="text-slate-500 mt-0.5">Sitenin çalışması için gerekli</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-5 h-5 rounded bg-sky-500 flex items-center justify-center flex-shrink-0">
                                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div>
                                            <span className="font-medium text-slate-800">İşlevsel Çerezler</span>
                                            <p className="text-slate-500 mt-0.5">Tercihlerinizi hatırlar</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-5 h-5 rounded bg-sky-500 flex items-center justify-center flex-shrink-0">
                                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <span className="font-medium text-slate-800">Analitik Çerezler</span>
                                            <p className="text-slate-500 mt-0.5">Kullanım istatistikleri</p>
                                        </div>
                                    </div>
                                    <Link href="/cerez-politikasi" className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1 mt-2">
                                        Çerez Politikası
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Buttons */}
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 flex-shrink-0">
                            <button
                                onClick={handleAcceptNecessary}
                                className="px-5 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                            >
                                Yalnızca Zorunlu
                            </button>
                            <button
                                onClick={handleAcceptAll}
                                className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-lg shadow-blue-500/25"
                            >
                                Tümünü Kabul Et
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
