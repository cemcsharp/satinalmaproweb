"use client";
import { useState, useEffect } from "react";
import PageHeader from "@/components/ui/PageHeader";
import TalepRaporu from "@/components/raporlama/TalepRaporu";
import SiparisRaporu from "@/components/raporlama/SiparisRaporu";
import SozlesmeRaporu from "@/components/raporlama/SozlesmeRaporu";
import FaturaRaporu from "@/components/raporlama/FaturaRaporu";
import DegerlendirmeRaporu from "@/components/raporlama/DegerlendirmeRaporu";

export default function RaporlarPage() {
  const [activeTab, setActiveTab] = useState<"talep" | "siparis" | "sozlesme" | "fatura" | "degerlendirme">("talep");

  return (
    <div className="space-y-8">
      <PageHeader
        title="Raporlar"
        description="Detaylı analizler ve operasyonel metrikler."
        variant="gradient"
      />

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 p-1 bg-slate-100/50 backdrop-blur-sm rounded-xl border border-slate-200/60 w-full md:w-fit">
        {[
          { id: "talep", label: "Talep Raporları", icon: "📝" },
          { id: "siparis", label: "Sipariş Raporları", icon: "📦" },
          { id: "sozlesme", label: "Sözleşme Raporları", icon: "📄" },
          { id: "fatura", label: "Fatura Raporları", icon: "🧾" },
          { id: "degerlendirme", label: "Tedarikçi Değerlendirme", icon: "⭐" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${activeTab === tab.id
              ? "bg-white text-blue-600 shadow-sm ring-1 ring-black/5"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="min-h-[400px]">
        {activeTab === "talep" && <TalepRaporu />}
        {activeTab === "siparis" && <SiparisRaporu />}
        {activeTab === "sozlesme" && <SozlesmeRaporu />}
        {activeTab === "fatura" && <FaturaRaporu />}
        {activeTab === "degerlendirme" && <DegerlendirmeRaporu />}
      </div>
    </div>
  );
}
