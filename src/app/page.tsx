import Link from "next/link";
import Image from "next/image";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";

import { getSystemSettings, defaultSettings } from "@/lib/settings";

export default async function LandingPage() {
    const session = await getServerSession(authOptions);
    if (session) {
        const role = (session as any)?.role;
        if (role === "supplier") redirect("/portal");
        redirect("/dashboard");
    }

    // Get system settings
    const settings = await getSystemSettings();
    const siteName = settings.siteName || defaultSettings.siteName;
    const siteDescription = settings.siteDescription || defaultSettings.siteDescription;
    const supportEmail = settings.supportEmail || defaultSettings.supportEmail;
    const supportPhone = settings.supportPhone || defaultSettings.supportPhone;

    return (
        <div className="min-h-screen bg-white font-sans selection:bg-indigo-100 selection:text-indigo-900">
            {/* Navigation */}
            <header className="fixed top-0 left-0 right-0 z-[100] bg-white/80 backdrop-blur-md border-b border-slate-100">
                <nav className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3 group cursor-pointer">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#2E248F] to-[#4F46E5] rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 group-hover:scale-110 transition-transform">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xl font-bold text-[#2E248F] tracking-tight">{siteName}</span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] -mt-1">Enterprise Solution</span>
                        </div>
                    </div>

                    <div className="hidden lg:flex items-center gap-8 text-sm font-semibold text-slate-600">
                        <a href="#solutions" className="hover:text-[#4F46E5] transition-colors">Çözümler</a>
                        <a href="#why-us" className="hover:text-[#4F46E5] transition-colors">Neden Biz?</a>
                        <a href="#integration" className="hover:text-[#4F46E5] transition-colors">Entegrasyon</a>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link href="/login" className="px-5 py-2.5 text-sm font-bold text-slate-700 hover:text-[#4F46E5] transition-colors">
                            Giriş Yap
                        </Link>
                        <Link href="/login" className="hidden sm:block px-6 py-2.5 bg-[#4F46E5] text-white text-sm font-bold rounded-full hover:bg-[#2E248F] shadow-lg shadow-indigo-200 transition-all active:scale-95">
                            Demo İste
                        </Link>
                    </div>
                </nav>
            </header>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 mesh-gradient-bg overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
                    <div className="absolute top-20 right-20 w-96 h-96 bg-white rounded-full blur-[120px] animate-pulse"></div>
                    <div className="absolute bottom-20 left-20 w-72 h-72 bg-indigo-400 rounded-full blur-[100px]"></div>
                </div>

                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div className="text-center lg:text-left">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-indigo-100 text-xs font-bold uppercase tracking-widest mb-6 border border-white/10">
                                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping"></span>
                                Yeni Nesil Satınalma Platformu
                            </div>
                            <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-[1.1] mb-8 drop-shadow-sm">
                                Akıllı e-Satınalma ile <br />
                                <span className="text-gradient">Verimliliğinizi Artırın</span>
                            </h1>
                            <p className="text-lg md:text-xl text-indigo-100/80 leading-relaxed mb-10 max-w-xl mx-auto lg:mx-0">
                                {siteDescription}
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                                <Link href="/login" className="group flex items-center justify-center gap-3 px-8 py-4 bg-white text-[#2E248F] rounded-2xl font-bold shadow-2xl hover:bg-slate-50 transition-all hover:-translate-y-1">
                                    <span>Kurumsal Giriş</span>
                                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </Link>
                                <Link href="/portal/login" className="flex items-center justify-center gap-3 px-8 py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-2xl font-bold hover:bg-white/20 transition-all hover:-translate-y-1">
                                    <svg className="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
                                    </svg>
                                    <span>Tedarikçi Portalı</span>
                                </Link>
                            </div>

                            {/* Live Stats Mini-Panel */}
                            <div className="mt-12 flex items-center gap-8 justify-center lg:justify-start">
                                <div>
                                    <p className="text-3xl font-extrabold text-white">+250</p>
                                    <p className="text-xs text-indigo-200/60 font-bold uppercase tracking-wider">Aktif Firma</p>
                                </div>
                                <div className="w-px h-10 bg-white/10"></div>
                                <div>
                                    <p className="text-3xl font-extrabold text-white">15K</p>
                                    <p className="text-xs text-indigo-200/60 font-bold uppercase tracking-wider">Tedarikçi Ağı</p>
                                </div>
                                <div className="w-px h-10 bg-white/10"></div>
                                <div>
                                    <p className="text-3xl font-extrabold text-white">%30</p>
                                    <p className="text-xs text-indigo-200/60 font-bold uppercase tracking-wider">Maliyet Tasarrufu</p>
                                </div>
                            </div>
                        </div>

                        {/* Hero Image / Mockup */}
                        <div className="relative animate-float hidden lg:block">
                            <div className="absolute -inset-4 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 blur-2xl rounded-[3rem]"></div>
                            <div className="relative glass-card p-4 rounded-[2.5rem] border-white/20 overflow-hidden shadow-3xl">
                                <img
                                    src="/hero_procurement_dashboard_1768214190575.png"
                                    alt="SatınalmaPRO Dashboard"
                                    className="rounded-[1.8rem] shadow-inner"
                                />
                            </div>

                            {/* Floating UI Elements */}
                            <div className="absolute -top-10 -right-10 glass-card p-6 rounded-2xl border-white/20 shadow-xl animate-float [animation-delay:1s]">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                                        <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-indigo-300 font-bold uppercase">Onay Bekleyen</p>
                                        <p className="text-xl font-bold text-white">12 Yeni Talep</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Trusted By */}
            <div className="py-12 bg-slate-50 border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-6">
                    <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-[0.3em] mb-8">Endüstri Liderleri Tarafından Güvenilen</p>
                    <div className="flex flex-wrap justify-center gap-12 opacity-40 grayscale group hover:grayscale-0 transition-all duration-700">
                        {/* Mock Logos */}
                        <div className="text-xl font-black text-slate-900 border-2 border-slate-900 px-3 py-1">CORE-TECH</div>
                        <div className="text-xl font-serif font-black text-slate-900 italic tracking-tighter">logistik.</div>
                        <div className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <div className="w-6 h-6 bg-slate-900 rounded-full"></div> GLOBEX
                        </div>
                        <div className="text-xl font-black text-slate-900 underline decoration-indigo-500 underline-offset-4">PRIME IND.</div>
                    </div>
                </div>
            </div>

            {/* Solutions Grid */}
            <section id="solutions" className="py-24 lg:py-32 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center lg:text-left">
                        <h2 className="text-3xl md:text-5xl font-bold text-slate-900 leading-tight mb-8">
                            Küresel Standartlarda <br />
                            <span className="text-[#4F46E5]">Satınalma Gücü</span>
                        </h2>
                        <p className="text-lg text-slate-600 leading-relaxed mb-10">
                            {siteName}, karmaşık operasyonları basitleştirmek ve veriye dayalı kararlar almanızı sağlamak için tasarlandı.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Satınalma Yönetimi */}
                        <div className="group p-10 bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 hover-lift relative overflow-hidden transition-colors hover:bg-[#2E248F]">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-[100px] -mr-8 -mt-8 group-hover:bg-white/10 transition-colors duration-500"></div>
                            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mb-8 relative z-10 group-hover:bg-white/20 group-hover:scale-110 transition-all">
                                <svg className="w-8 h-8 text-[#2E248F] group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-4 relative z-10 group-hover:text-white transition-colors duration-500">Satınalma Yönetimi</h3>
                            <p className="text-slate-600 leading-relaxed relative z-10 group-hover:text-indigo-100 transition-colors duration-500">
                                Tüm talepleri merkezi bir havuzda toplayın, bütçe kontrollerini yapın ve onay akışlarını dijitalleştirin.
                            </p>
                            <div className="mt-8 flex items-center gap-2 text-indigo-600 font-bold relative z-10 group-hover:text-white cursor-pointer transition-colors">
                                <span>Detaylı İncele</span>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </div>
                        </div>

                        {/* İhale & RFQ */}
                        <div className="group p-10 bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 hover-lift relative overflow-hidden transition-colors hover:bg-[#4F46E5]">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-bl-[100px] -mr-8 -mt-8 group-hover:bg-white/10 transition-colors duration-500"></div>
                            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-8 relative z-10 group-hover:bg-white/20 group-hover:scale-110 transition-all">
                                <svg className="w-8 h-8 text-purple-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-4 relative z-10 group-hover:text-white transition-colors duration-500">İhale & RFQ</h3>
                            <p className="text-slate-600 leading-relaxed relative z-10 group-hover:text-indigo-100 transition-colors duration-500">
                                Tedarikçilerden teklifleri saniyeler içinde toplayın. Fiyat, kalite ve teslimat skoruna göre karşılaştırın.
                            </p>
                            <div className="mt-8 flex items-center gap-2 text-[#4F46E5] font-bold relative z-10 group-hover:text-white cursor-pointer transition-colors">
                                <span>Detaylı İncele</span>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </div>
                        </div>

                        {/* Tedarikçi Portalı */}
                        <div className="group p-10 bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 hover-lift relative overflow-hidden transition-colors hover:bg-emerald-600">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-[100px] -mr-8 -mt-8 group-hover:bg-white/10 transition-colors duration-500"></div>
                            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-8 relative z-10 group-hover:bg-white/20 group-hover:scale-110 transition-all">
                                <svg className="w-8 h-8 text-emerald-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-4 relative z-10 group-hover:text-white transition-colors duration-500">Tedarikçi Portalı</h3>
                            <p className="text-slate-600 leading-relaxed relative z-10 group-hover:text-indigo-100 transition-colors duration-500">
                                Tedarikçileriniz kendi panelleri üzerinden teklif verir, siparişleri görür ve irsaliye girişlerini yapar.
                            </p>
                            <div className="mt-8 flex items-center gap-2 text-emerald-600 font-bold relative z-10 group-hover:text-white cursor-pointer transition-colors">
                                <span>Detaylı İncele</span>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </div>
                        </div>

                        {/* Diğer Özellikler (Alt Satır) */}
                        <div className="bg-slate-50 flex flex-col justify-center rounded-[2.5rem] p-10 border border-slate-100 lg:col-span-1">
                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-indigo-600">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900">Sözleşme Yönetimi</h4>
                                        <p className="text-xs text-slate-500">Dijital arşiv ve hatırlatmalar.</p>
                                    </div>
                                </div>
                                <div className="w-full h-px bg-slate-200"></div>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-rose-600">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" /></svg>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900">Fatura & Ödeme</h4>
                                        <p className="text-xs text-slate-500">Otomatik eşleme ve onay.</p>
                                    </div>
                                </div>
                                <div className="w-full h-px bg-slate-200"></div>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-cyan-600">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900">Teslimat & İrsaliye</h4>
                                        <p className="text-xs text-slate-500">Gerçek zamanlı mal kabul.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ERP Entegrasyon Highlight */}
                        <div id="integration" className="lg:col-span-2 bg-gradient-to-br from-[#2E248F] to-[#4F46E5] rounded-[2.5rem] p-12 relative overflow-hidden">
                            <div className="absolute right-0 bottom-0 opacity-10 blur-sm translate-x-1/4 translate-y-1/4">
                                <svg className="w-96 h-96 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" /></svg>
                            </div>
                            <div className="relative z-10 max-w-sm">
                                <h3 className="text-3xl font-bold text-white mb-4">ERP & Muhasebe Entegrasyonu</h3>
                                <p className="text-indigo-100 mb-8">SAP, Logo, Mikro ve diğer tüm ERP sistemleriyle %100 uyumlu API altyapısı.</p>
                                <button className="px-6 py-3 bg-white text-[#2E248F] font-bold rounded-xl hover:bg-slate-50 transition-colors">
                                    Entegrasyon Listesi
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Why Us / Productivity */}
            <section id="why-us" className="py-24 bg-slate-900 overflow-hidden relative">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid lg:grid-cols-2 gap-20 items-center">
                        <div>
                            <h2 className="text-indigo-500 font-bold text-sm uppercase tracking-[0.2em] mb-4">Küresel Standartlar</h2>
                            <p className="text-3xl md:text-5xl font-extrabold text-white mb-8 border-l-4 border-indigo-600 pl-8">
                                İşe Alım Değil, <br />
                                <span className="text-indigo-500">Değer Kazandırıyoruz</span>
                            </p>
                            <p className="text-lg text-slate-300 leading-relaxed mb-10">
                                {siteName}, kurumsal şirketlerin tedarik zinciri süreçlerini uçtan uca dijitalleştirerek insan hatasını sıfıra indirir ve operasyonel hızı %60 artırır.
                            </p>

                            <div className="space-y-6">
                                {[
                                    { t: "Hızlı Onay Süreçleri", d: "Mobil uyumlu yapıyla saniyeler içinde onay verin." },
                                    { t: "Şeffaf Tedarik Ağı", d: "Tüm tedarikçileri performansına göre puanlayın." },
                                    { t: "Stratejik Tasarruf", d: "Veri madenciliği ile gizli kalmış tasarruf fırsatlarını yakalayın." }
                                ].map((item, idx) => (
                                    <div key={idx} className="flex gap-4">
                                        <div className="flex-shrink-0 w-6 h-6 bg-indigo-500/20 rounded flex items-center justify-center mt-1">
                                            <svg className="w-4 h-4 text-indigo-400" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" /></svg>
                                        </div>
                                        <div>
                                            <h4 className="text-white font-bold">{item.t}</h4>
                                            <p className="text-sm text-slate-300 font-medium">{item.d}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="relative">
                            <div className="absolute -inset-10 bg-indigo-500/10 blur-[120px] rounded-full"></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-white/10 text-center">
                                    <p className="text-4xl font-black text-white mb-2 tracking-tighter">20+</p>
                                    <p className="text-xs text-slate-500 font-bold uppercase">Yıllık Deneyim</p>
                                </div>
                                <div className="bg-indigo-600 p-8 rounded-3xl text-center translate-y-8">
                                    <p className="text-4xl font-black text-white mb-2 tracking-tighter">35K</p>
                                    <p className="text-xs text-indigo-100 font-bold uppercase">Onaylı Tedarikçi</p>
                                </div>
                                <div className="bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-white/10 text-center">
                                    <p className="text-4xl font-black text-white mb-2 tracking-tighter">200K</p>
                                    <p className="text-xs text-slate-500 font-bold uppercase">Tamamlanan İhale</p>
                                </div>
                                <div className="bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-white/10 text-center translate-y-8">
                                    <p className="text-4xl font-black text-white mb-2 tracking-tighter">$2B+</p>
                                    <p className="text-xs text-slate-500 font-bold uppercase">Yıllık İşlem</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Final */}
            <section className="py-24 px-6 relative overflow-hidden">
                <div className="max-w-5xl mx-auto bg-gradient-to-br from-[#2E248F] to-[#4F46E5] rounded-[3rem] p-12 lg:p-20 text-center shadow-3xl relative z-10">
                    <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-8 leading-tight">
                        Dijital Satınalma Dönüşümüne <br /> Bugün Başlayın
                    </h2>
                    <p className="text-xl text-indigo-100 mb-12 max-w-2xl mx-auto">
                        Süreçlerinizi optimize etmek ve kontrolü elinize almak için hemen demo talebinde bulunun.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/login" className="px-10 py-5 bg-white text-[#2E248F] rounded-2xl font-bold text-lg shadow-xl hover:scale-105 transition-transform">
                            Ücretsiz Demo İste
                        </Link>
                        <Link href="/portal/login" className="px-10 py-5 bg-transparent border-2 border-white/20 text-white rounded-2xl font-bold text-lg hover:bg-white/10 transition-all">
                            Tedarikçi Girişi
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-20 px-6 bg-white border-t border-slate-100">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-4 gap-12 mb-16">
                        <div className="col-span-2">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-8 h-8 bg-[#2E248F] rounded-lg"></div>
                                <span className="text-2xl font-black text-[#2E248F] tracking-tight">{siteName}</span>
                            </div>
                            <p className="text-slate-500 text-sm leading-relaxed mb-8">
                                {siteDescription}
                            </p>
                        </div>

                        <div>
                            <h4 className="font-bold text-slate-900 mb-6">Kurumsal</h4>
                            <ul className="space-y-4 text-sm text-slate-500">
                                <li><a href="#" className="hover:text-[#4F46E5] transition-colors text-slate-400">Hakkımızda</a></li>
                                <li><a href="#" className="hover:text-[#4F46E5] transition-colors text-slate-400">Kariyer</a></li>
                                <li><a href="#" className="hover:text-[#4F46E5] transition-colors text-slate-400">İletişim</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-slate-900 mb-6">Destek</h4>
                            <ul className="space-y-4 text-sm text-slate-500">
                                <li><a href="#" className="hover:text-[#4F46E5] transition-colors text-slate-400">Yardım Merkezi</a></li>
                                <li><a href="#" className="hover:text-[#4F46E5] transition-colors text-slate-400">API Dökümantasyonu</a></li>
                                <li><a href="#" className="hover:text-[#4F46E5] transition-colors text-slate-400">Güvenlik</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-slate-900 mb-6">İletişim</h4>
                            <ul className="space-y-4 text-sm text-slate-500">
                                <li>{supportPhone}</li>
                                <li>{supportEmail}</li>
                                <li>İstanbul, Türkiye</li>
                            </ul>
                        </div>
                    </div>

                    <div className="pt-10 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
                        <p className="text-sm text-slate-400">© {new Date().getFullYear()} {siteName}. Tüm hakları saklıdır.</p>
                        <div className="flex gap-6 mt-4 md:mt-0 text-xs font-bold text-slate-400 uppercase tracking-widest">
                            <a href="#" className="hover:text-slate-900 transition-colors">KVKK</a>
                            <a href="#" className="hover:text-slate-900 transition-colors">Kullanım Koşulları</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
