import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/authOptions";

export default async function LandingPage() {
    const session = await getServerSession(authOptions);
    if (session) {
        const role = (session as any)?.role;
        if (role === "supplier") redirect("/portal");
        redirect("/dashboard");
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100">
                <nav className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <div>
                            <span className="text-xl font-bold text-slate-900">SatınalmaPRO</span>
                            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Kurumsal Satınalma</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/portal/login" className="px-5 py-2.5 text-sm font-semibold text-slate-700 border-2 border-slate-200 rounded-xl hover:border-blue-400 hover:text-blue-600 transition-all">
                            <span>Tedarikçi Portalı</span>
                        </Link>
                        <Link href="/login" className="px-6 py-2.5 bg-blue-600 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/30">
                            <span className="text-sm font-bold text-white">Giriş Yap</span>
                        </Link>
                    </div>
                </nav>
            </header>

            {/* Hero */}
            <section className="pt-32 pb-16 px-6 bg-gradient-to-b from-blue-50/80 to-white">
                <div className="max-w-6xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-8">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Kurumsal Satınalma Yönetim Sistemi
                    </div>

                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight mb-6">
                        Satınalma Süreçlerinizde
                        <span className="text-blue-600"> Çözüm Ortağınız</span>
                    </h1>

                    <p className="text-lg md:text-xl text-slate-600 leading-relaxed mb-10 max-w-3xl mx-auto">
                        Talepten siparişe, teslimatdan faturaya tüm satınalma süreçlerinizi
                        tek platform üzerinden yönetin.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
                        <Link href="/login" className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-blue-600 rounded-xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/30">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
                            </svg>
                            <span className="text-white font-bold">Kurumsal Giriş</span>
                        </Link>
                        <Link href="/portal/login" className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-white rounded-xl border-2 border-slate-200 hover:border-emerald-400 transition-all">
                            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="text-slate-700 font-bold">Tedarikçi Girişi</span>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Kurumsal Kullanıcılar İçin */}
            <section className="py-20 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12">
                        <p className="text-blue-600 font-semibold text-sm uppercase tracking-wider mb-2">Kurumsal Kullanıcılar İçin</p>
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
                            Satınalma Yönetimi
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Talep Yönetimi */}
                        <div className="p-6 bg-white rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-xl transition-all group">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">Talep Yönetimi</h3>
                            <ul className="text-sm text-slate-500 space-y-1">
                                <li>• Talep oluşturma</li>
                                <li>• Çok seviyeli onay akışları</li>
                                <li>• Talep takibi</li>
                            </ul>
                        </div>

                        {/* Teklif (RFQ) */}
                        <div className="p-6 bg-white rounded-2xl border border-slate-200 hover:border-purple-300 hover:shadow-xl transition-all group">
                            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l3-3m-3 3L9 8m-5 5h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293h3.172a1 1 0 00.707-.293l2.414-2.414a1 1 0 01.707-.293H20" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-purple-600 transition-colors">Teklif Toplama (RFQ)</h3>
                            <ul className="text-sm text-slate-500 space-y-1">
                                <li>• RFQ oluşturma</li>
                                <li>• Tedarikçilere teklif gönderimi</li>
                                <li>• Teklif karşılaştırma</li>
                            </ul>
                        </div>

                        {/* Sipariş */}
                        <div className="p-6 bg-white rounded-2xl border border-slate-200 hover:border-orange-300 hover:shadow-xl transition-all group">
                            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-orange-600 transition-colors">Sipariş Yönetimi</h3>
                            <ul className="text-sm text-slate-500 space-y-1">
                                <li>• Sipariş oluşturma</li>
                                <li>• Sipariş takibi</li>
                                <li>• Barkod desteği</li>
                            </ul>
                        </div>

                        {/* Teslimat */}
                        <div className="p-6 bg-white rounded-2xl border border-slate-200 hover:border-cyan-300 hover:shadow-xl transition-all group">
                            <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-cyan-600 transition-colors">Teslimat Takibi</h3>
                            <ul className="text-sm text-slate-500 space-y-1">
                                <li>• Bekleyen teslimatlar</li>
                                <li>• Teslimat onayı</li>
                                <li>• Teslimat geçmişi</li>
                            </ul>
                        </div>

                        {/* Sözleşme */}
                        <div className="p-6 bg-white rounded-2xl border border-slate-200 hover:border-violet-300 hover:shadow-xl transition-all group">
                            <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-violet-600 transition-colors">Sözleşme Yönetimi</h3>
                            <ul className="text-sm text-slate-500 space-y-1">
                                <li>• Sözleşme oluşturma</li>
                                <li>• Sözleşme takibi</li>
                            </ul>
                        </div>

                        {/* Fatura */}
                        <div className="p-6 bg-white rounded-2xl border border-slate-200 hover:border-rose-300 hover:shadow-xl transition-all group">
                            <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-rose-600 transition-colors">Fatura Yönetimi</h3>
                            <ul className="text-sm text-slate-500 space-y-1">
                                <li>• Fatura oluşturma</li>
                                <li>• Fatura takibi</li>
                            </ul>
                        </div>

                        {/* Tedarikçi */}
                        <div className="p-6 bg-white rounded-2xl border border-slate-200 hover:border-emerald-300 hover:shadow-xl transition-all group">
                            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-emerald-600 transition-colors">Tedarikçi Yönetimi</h3>
                            <ul className="text-sm text-slate-500 space-y-1">
                                <li>• Tedarikçi veritabanı</li>
                                <li>• Performans değerlendirme</li>
                                <li>• Kategori yönetimi</li>
                            </ul>
                        </div>

                        {/* Raporlama */}
                        <div className="p-6 bg-white rounded-2xl border border-slate-200 hover:border-fuchsia-300 hover:shadow-xl transition-all group">
                            <div className="w-12 h-12 bg-fuchsia-100 rounded-xl flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-fuchsia-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-fuchsia-600 transition-colors">Raporlama</h3>
                            <ul className="text-sm text-slate-500 space-y-1">
                                <li>• Detaylı raporlar</li>
                                <li>• Dashboard</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Tedarikçiler İçin */}
            <section className="py-20 px-6 bg-emerald-50">
                <div className="max-w-6xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <p className="text-emerald-600 font-semibold text-sm uppercase tracking-wider mb-2">Tedarikçiler İçin</p>
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
                                Tedarikçi Portalı
                            </h2>
                            <p className="text-lg text-slate-600 leading-relaxed mb-8">
                                Tedarikçileriniz için özel portal ile RFQ cevaplama, sipariş görüntüleme
                                ve destek talebi oluşturabilirler.
                            </p>
                            <ul className="space-y-4">
                                <li className="flex items-start gap-3">
                                    <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <span className="text-slate-700 font-medium">Açık RFQ&apos;lara teklif verme</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <span className="text-slate-700 font-medium">Teklif geçmişini görüntüleme</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <span className="text-slate-700 font-medium">Siparişleri takip etme</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <span className="text-slate-700 font-medium">Firma profili yönetimi</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <span className="text-slate-700 font-medium">Destek talebi oluşturma</span>
                                </li>
                            </ul>
                        </div>
                        <div className="flex justify-center">
                            <div className="bg-white rounded-3xl p-8 shadow-2xl shadow-emerald-500/10 border border-emerald-100 max-w-sm w-full">
                                <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg shadow-emerald-500/30">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 text-center mb-4">Tedarikçi Portalına Giriş</h3>
                                <p className="text-sm text-slate-500 text-center mb-6">Tedarikçi hesabınızla giriş yaparak portala erişin</p>
                                <Link href="/portal/login" className="block w-full px-6 py-3 bg-emerald-500 rounded-xl hover:bg-emerald-600 transition-all text-center">
                                    <span className="text-white font-bold">Portala Git</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Ek Özellikler */}
            <section className="py-20 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Ek Özellikler</h2>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="p-6 bg-slate-50 rounded-2xl text-center">
                            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
                                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Ürün Kataloğu</h3>
                            <p className="text-sm text-slate-500">Ürün listesi ve kategori yönetimi</p>
                        </div>
                        <div className="p-6 bg-slate-50 rounded-2xl text-center">
                            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
                                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Rol Bazlı Yetkilendirme</h3>
                            <p className="text-sm text-slate-500">Kullanıcı rolleri ve izin yönetimi</p>
                        </div>
                        <div className="p-6 bg-slate-50 rounded-2xl text-center">
                            <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
                                <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Sistem Ayarları</h3>
                            <p className="text-sm text-slate-500">Modül ve sistem yapılandırması</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 px-6 bg-blue-600">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                        Hemen Başlayın
                    </h2>
                    <p className="text-lg text-blue-100 mb-10">
                        Satınalma süreçlerinizi dijitalleştirmek için giriş yapın
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/login" className="inline-flex items-center justify-center px-8 py-4 bg-white rounded-xl shadow-xl">
                            <span className="text-blue-600 font-bold">Kurumsal Giriş</span>
                        </Link>
                        <Link href="/portal/login" className="inline-flex items-center justify-center px-8 py-4 rounded-xl border-2 border-white/40 hover:bg-white/10 transition-all">
                            <span className="text-white font-bold">Tedarikçi Portalı</span>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-6 bg-slate-900">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <span className="text-white font-semibold">SatınalmaPRO</span>
                    </div>
                    <div className="flex items-center gap-8 text-sm text-slate-400">
                        <a href="#" className="hover:text-white transition-colors">Gizlilik</a>
                        <a href="#" className="hover:text-white transition-colors">Kullanım Koşulları</a>
                        <a href="#" className="hover:text-white transition-colors">Destek</a>
                    </div>
                    <p className="text-sm text-slate-500">© {new Date().getFullYear()} Tüm hakları saklıdır.</p>
                </div>
            </footer>
        </div>
    );
}
