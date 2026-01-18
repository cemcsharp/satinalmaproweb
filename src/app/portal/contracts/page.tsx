"use client";
import React from "react";
import Icon from "@/components/ui/Icon";

export default function ContractsPage() {
    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sözleşmeler</h1>
                    <p className="text-slate-500 text-sm mt-1">Aktif sözleşmeleriniz ve şartnamelerinizi görüntüleyin.</p>
                </div>
            </div>

            <div className="bg-white/50 backdrop-blur-sm border border-slate-200 rounded-3xl p-12 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-purple-50 rounded-2xl flex items-center justify-center mb-6">
                    <Icon name="document" className="w-10 h-10 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">Dijital Sözleşme Yönetimi</h2>
                <p className="text-slate-500 max-w-md mx-auto mb-8">
                    Sözleşme onayı ve dijital imza süreçleri çok yakında aktif edilecektir.
                </p>
                <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-full text-[10px] font-bold uppercase tracking-widest">
                    <span className="w-2 h-2 bg-sky-500 rounded-full animate-pulse"></span>
                    Yakında Sizinle
                </div>
            </div>
        </div>
    );
}
