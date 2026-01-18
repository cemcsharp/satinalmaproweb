"use client";
import { useState } from "react";
import { FAQItem } from "@/lib/settings";

export default function FAQSection({ faqItems }: { faqItems: FAQItem[] }) {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    if (!faqItems || faqItems.length === 0) return null;

    return (
        <section className="py-24 bg-white relative overflow-hidden">
            <div className="max-w-4xl mx-auto px-6 relative z-10">
                <div className="text-center mb-16">
                    <p className="text-sm font-semibold text-[#1e3a8a] uppercase tracking-wider mb-3">Destek</p>
                    <h2 className="text-3xl md:text-4xl font-bold text-[#0f172a]">Sıkça Sorulan Sorular</h2>
                </div>

                <div className="space-y-4">
                    {faqItems.map((item, index) => {
                        const isOpen = openIndex === index;
                        return (
                            <div key={index} className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden transition-all duration-300 hover:border-slate-300">
                                <button
                                    onClick={() => setOpenIndex(isOpen ? null : index)}
                                    className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-slate-100 transition-colors"
                                >
                                    <span className="text-lg font-semibold text-[#0f172a]">{item.question}</span>
                                    <div className={`w-8 h-8 rounded-full bg-[#0f172a] flex items-center justify-center transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </button>
                                {isOpen && (
                                    <div className="px-6 pb-6 text-slate-600 leading-relaxed text-base">
                                        {item.answer}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
