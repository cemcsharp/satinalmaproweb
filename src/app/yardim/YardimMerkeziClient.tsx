"use client";
import { useState } from "react";
import Link from "next/link";
import { SystemSettings } from "@/lib/settings";

const defaultModuleGuides = [
    {
        title: "Talep Yönetimi",
        icon: "📋",
        description: "Satın alma taleplerinin oluşturulması ve onay süreçleri",
        steps: [
            "Sol menüden 'Talep Oluştur' seçin",
            "Talep formunu doldurun (konu, açıklama, birim)",
            "Ürün/hizmet kalemlerini ekleyin",
            "Bütçe ve termin bilgilerini girin",
            "Onaya gönderin ve süreci takip edin"
        ]
    },
    {
        title: "RFQ & Teklif Toplama",
        icon: "📨",
        description: "Tedarikçilerden teklif alma ve karşılaştırma",
        steps: [
            "Onaylanan talepten RFQ oluşturun",
            "Teklif vermesini istediğiniz tedarikçileri seçin",
            "Son teklif tarihini belirleyin",
            "RFQ'yu tedarikçilere gönderin",
            "Gelen teklifleri karşılaştırma matrisinde değerlendirin"
        ]
    },
    {
        title: "Sipariş Yönetimi",
        icon: "🛒",
        description: "Siparişlerin oluşturulması ve takibi",
        steps: [
            "Kazanan tekliften sipariş oluşturun",
            "Teslimat adresini ve koşullarını belirtin",
            "Siparişi onaya gönderin",
            "PDF sipariş formunu indirin/gönderin",
            "Teslimat durumunu takip edin"
        ]
    },
    {
        title: "Teslimat & Mal Kabul",
        icon: "📦",
        description: "İrsaliye kaydı ve mal kabul işlemleri",
        steps: [
            "Tedarikçinin irsaliye girişini bekleyin",
            "Gelen bildirimi kontrol edin",
            "Fiziksel ürünleri teslim alın",
            "Mal kabul işlemini onaylayın",
            "Varsa fark/eksik bildirimi yapın"
        ]
    },
    {
        title: "Fatura İşlemleri",
        icon: "🧾",
        description: "Fatura eşleştirme ve ödeme takibi",
        steps: [
            "Gelen faturaları sisteme kaydedin",
            "Otomatik 3-yollu eşleştirmeyi kontrol edin",
            "Uyuşmazlıkları çözümleyin",
            "Faturayı ödemeye onaylayın",
            "Ödeme takibini yapın"
        ]
    }
];

export default function YardimMerkeziClient({ settings }: { settings: SystemSettings }) {
    const [searchQuery, setSearchQuery] = useState("");
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const [selectedGuide, setSelectedGuide] = useState<number | null>(null);
    const [ticketForm, setTicketForm] = useState({ subject: "", message: "", priority: "normal" });
    const [ticketSubmitted, setTicketSubmitted] = useState(false);

    const faqItems = settings.faqItems || [];

    const filteredFaq = faqItems.filter(
        item => item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.answer.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleTicketSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Submit to API or similar
        setTicketSubmitted(true);
        setTimeout(() => {
            setTicketSubmitted(false);
            setTicketForm({ subject: "", message: "", priority: "normal" });
        }, 3000);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-[#075985] to-[#0369A1] text-white py-16 px-6">
                <div className="max-w-5xl mx-auto text-center">
                    <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Yardım Merkezi</h1>
                    <p className="text-xl text-sky-100 mb-8">Size nasıl yardımcı olabiliriz?</p>

                    {/* Search */}
                    <div className="max-w-2xl mx-auto relative">
                        <input
                            type="text"
                            placeholder="Soru veya konu ara..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-6 py-4 rounded-2xl text-slate-900 placeholder-slate-400 shadow-xl focus:outline-none focus:ring-4 focus:ring-white/30"
                        />
                        <svg className="absolute right-5 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-12">
                {/* Quick Links */}
                <div className="grid md:grid-cols-4 gap-4 mb-12">
                    <a href="#faq" className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:border-sky-300 hover:shadow-lg transition-all">
                        <div className="w-10 h-10 bg-sky-100 rounded-lg flex items-center justify-center text-xl">❓</div>
                        <div>
                            <div className="font-bold text-slate-900">SSS</div>
                            <div className="text-xs text-slate-500">Sıkça Sorulan Sorular</div>
                        </div>
                    </a>
                    <a href="#guides" className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:border-sky-300 hover:shadow-lg transition-all">
                        <div className="w-10 h-10 bg-sky-100 rounded-lg flex items-center justify-center text-xl">📚</div>
                        <div>
                            <div className="font-bold text-slate-900">Kılavuzlar</div>
                            <div className="text-xs text-slate-500">Modül Rehberleri</div>
                        </div>
                    </a>
                    <a href="#contact" className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-xl">💬</div>
                        <div>
                            <div className="font-bold text-slate-900">İletişim</div>
                            <div className="text-xs text-slate-500">Destek Talebi</div>
                        </div>
                    </a>
                    <Link href="/api-docs" className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:border-sky-300 hover:shadow-lg transition-all">
                        <div className="w-10 h-10 bg-sky-100 rounded-lg flex items-center justify-center text-xl">🔌</div>
                        <div>
                            <div className="font-bold text-slate-900">API Docs</div>
                            <div className="text-xs text-slate-500">Entegrasyon Rehberi</div>
                        </div>
                    </Link>
                </div>

                {/* FAQ Section */}
                <section id="faq" className="mb-16">
                    <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                        <span className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center">❓</span>
                        Sıkça Sorulan Sorular
                    </h2>

                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                        <div className="divide-y divide-slate-100">
                            {filteredFaq.length > 0 ? filteredFaq.map((item, idx) => {
                                const isOpen = openFaq === idx;
                                return (
                                    <div key={idx}>
                                        <button
                                            onClick={() => setOpenFaq(isOpen ? null : idx)}
                                            className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                                        >
                                            <span className="font-semibold text-slate-900">{item.question}</span>
                                            <svg className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>
                                        {isOpen && (
                                            <div className="px-6 pb-6 text-slate-600 leading-relaxed animate-in slide-in-from-top-2 duration-200">
                                                {item.answer}
                                            </div>
                                        )}
                                    </div>
                                );
                            }) : (
                                <div className="p-12 text-center text-slate-400">
                                    Sonuç bulunamadı.
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Module Guides */}
                <section id="guides" className="mb-16">
                    <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                        <span className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center">📚</span>
                        Kullanım Kılavuzları
                    </h2>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {defaultModuleGuides.map((guide, idx) => (
                            <div
                                key={idx}
                                className={`bg-white rounded-2xl border-2 transition-all p-6 cursor-pointer ${selectedGuide === idx
                                    ? 'border-sky-500 shadow-xl shadow-sky-100'
                                    : 'border-slate-200 hover:border-sky-300'
                                    }`}
                                onClick={() => setSelectedGuide(selectedGuide === idx ? null : idx)}
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="text-3xl">{guide.icon}</span>
                                    <h3 className="font-bold text-slate-900">{guide.title}</h3>
                                </div>
                                <p className="text-sm text-slate-600 mb-4">{guide.description}</p>

                                {selectedGuide === idx && (
                                    <div className="mt-4 pt-4 border-t border-slate-100 animate-in slide-in-from-top-2 duration-200">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Adım Adım</h4>
                                        <ol className="space-y-3">
                                            {guide.steps.map((step, stepIdx) => (
                                                <li key={stepIdx} className="flex items-start gap-3 text-sm">
                                                    <span className="w-6 h-6 bg-sky-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                                                        {stepIdx + 1}
                                                    </span>
                                                    <span className="text-slate-700">{step}</span>
                                                </li>
                                            ))}
                                        </ol>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                <section id="contact" className="grid lg:grid-cols-2 gap-8">
                    {/* Contact Info */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
                        <h2 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                            <span className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">💬</span>
                            İletişim Kanalları
                        </h2>

                        <div className="space-y-8">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center shrink-0">
                                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900">E-posta Desteği</h4>
                                    <p className="text-slate-600">{settings.supportEmail || "destek@satinalma.app"}</p>
                                    <p className="text-xs text-slate-400 mt-1">Yanıt süresi: 1-2 iş günü</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center shrink-0">
                                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900">Telefon</h4>
                                    <p className="text-slate-600">{settings.supportPhone || "+90 212 000 00 00"}</p>
                                    <p className="text-xs text-slate-400 mt-1">Pzt-Cuma 09:00-18:00</p>
                                </div>
                            </div>

                            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex gap-3 text-blue-800 text-sm">
                                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p>Kritik sistem sorunları için Premium destek hattına başvurabilirsiniz.</p>
                            </div>
                        </div>
                    </div>

                    {/* Ticket Form */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
                        <h2 className="text-2xl font-bold text-slate-900 mb-8">Destek Talebi Oluştur</h2>

                        {ticketSubmitted ? (
                            <div className="text-center py-12">
                                <div className="w-20 h-20 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 mb-3">Talebiniz Alındı!</h3>
                                <p className="text-slate-600">Müşteri temsilcilerimiz en kısa sürede sizinle iletişime geçecektir.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleTicketSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Konu</label>
                                    <input
                                        type="text"
                                        required
                                        value={ticketForm.subject}
                                        onChange={(e) => setTicketForm(p => ({ ...p, subject: e.target.value }))}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 outline-none transition-all"
                                        placeholder="Yardım almak istediğiniz konuyu yazın"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Öncelik Seviyesi</label>
                                    <select
                                        value={ticketForm.priority}
                                        onChange={(e) => setTicketForm(p => ({ ...p, priority: e.target.value }))}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 outline-none transition-all"
                                    >
                                        <option value="low">Düşük</option>
                                        <option value="normal">Normal</option>
                                        <option value="high">Yüksek</option>
                                        <option value="urgent">Acil</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Sorunuzu Detaylandırın</label>
                                    <textarea
                                        required
                                        rows={6}
                                        value={ticketForm.message}
                                        onChange={(e) => setTicketForm(p => ({ ...p, message: e.target.value }))}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 outline-none transition-all resize-none"
                                        placeholder="Yaşadığınız sorunu veya sormak istediğiniz detayı buraya yazın..."
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-4 bg-gradient-to-r from-[#075985] to-[#0369A1] text-white font-extrabold rounded-xl hover:shadow-xl hover:shadow-sky-100 transition-all active:scale-[0.98]"
                                >
                                    Talebi Gönder
                                </button>
                            </form>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
