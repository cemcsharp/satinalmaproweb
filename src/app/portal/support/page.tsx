"use client";
import React from "react";
import Icon from "@/components/ui/Icon";

export default function SupportPage() {
    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Destek Merkezi</h1>
                    <p className="text-slate-500 text-sm mt-1">Herhangi bir sorun yaşarsanız bizimle iletişime geçebilirsiniz.</p>
                </div>
            </div>

            <div className="bg-white/50 backdrop-blur-sm border border-slate-200 rounded-3xl p-12 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6">
                    <Icon name="star" className="w-10 h-10 text-emerald-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">Süreç Desteği</h2>
                <p className="text-slate-500 max-w-md mx-auto mb-8">
                    Teklif verme veya sipariş süreçleriyle ilgili yardım dokümanları yakında eklenecektir.
                </p>
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold uppercase tracking-widest">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                    Bilgi Merkezi
                </div>
            </div>
        </div>
    );
}
