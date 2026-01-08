"use client";
import React from "react";
import Icon from "@/components/ui/Icon";

export default function OrdersPage() {
    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Siparişlerim</h1>
                    <p className="text-slate-500 text-sm mt-1">Onaylanmış ve aktif siparişlerinizin takibini buradan yapabilirsiniz.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm">
                        <Icon name="history" className="w-4 h-4" />
                        Geçmiş
                    </button>
                </div>
            </div>

            {/* Empty State / Coming Soon */}
            <div className="bg-white/50 backdrop-blur-sm border border-slate-200 rounded-3xl p-12 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                    <Icon name="cart" className="w-10 h-10 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">Sipariş Yönetimi Hazırlanıyor</h2>
                <p className="text-slate-500 max-w-md mx-auto mb-8">
                    Tedarikçi sipariş yönetim modülü şu an geliştirme aşamasındadır. Çok yakında tüm siparişlerinizi buradan yönetebileceksiniz.
                </p>
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-[10px] font-bold uppercase tracking-widest">
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                    Geliştirme Aşamasında
                </div>
            </div>
        </div>
    );
}
