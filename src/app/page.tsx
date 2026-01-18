import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/authOptions";
import Link from "next/link";
import FAQSection from "@/components/FAQSection";
import { getSystemSettings } from "@/lib/settings";
import DemoTrigger from "@/components/landing/DemoTrigger";

export default async function LandingPage() {
    const session = await getServerSession(authOptions);
    if (session) {
        const role = (session as any)?.role;
        if (role === "supplier") redirect("/portal");
        redirect("/dashboard");
    }

    const settings = await getSystemSettings();
    const { siteName, siteDescription, supportEmail, supportPhone, faqItems } = settings;

    return (
        <div className="min-h-screen bg-slate-100 font-sans antialiased overflow-x-hidden">
            {/* Navigation - Dark Premium */}
            <header className="fixed top-0 left-0 right-0 z-[100] bg-slate-800 shadow-lg">
                <nav className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between py-4">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-all">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <span className="text-xl font-bold text-white">{siteName}</span>
                    </Link>

                    <div className="hidden md:flex items-center gap-8">
                        <a href="#ozellikler" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Özellikler</a>
                        <a href="#nasil-calisir" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Nasıl Çalışır?</a>
                        <a href="#alicilar" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Alıcılar</a>
                        <a href="#tedarikciler" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Tedarikçiler</a>
                        <Link href="/yardim" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Yardım</Link>
                    </div>

                    <div className="flex items-center gap-2 md:gap-4">
                        <Link href="/login" className="px-4 py-2.5 text-sm font-medium text-white border border-white/20 rounded-xl hover:bg-white/10 transition-all">
                            Alıcı Girişi
                        </Link>
                        <Link href="/login" className="px-4 py-2.5 text-sm font-medium text-white border border-white/20 rounded-xl hover:bg-white/10 transition-all">
                            Tedarikçi Girişi
                        </Link>
                        <DemoTrigger className="hidden md:block px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5 transition-all">
                            Demo Talep Et
                        </DemoTrigger>
                    </div>
                </nav>
            </header>

            {/* Hero Section */}
            <section className="relative min-h-screen pt-32 pb-20 overflow-hidden bg-gradient-to-b from-slate-800 via-slate-700 to-slate-100">
                <div className="absolute top-40 right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-40 left-20 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl"></div>

                <div className="relative z-10 max-w-7xl mx-auto px-6">
                    <div className="grid lg:grid-cols-2 gap-16 items-center min-h-[80vh]">
                        <div>
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur border border-white/20 rounded-full mb-8">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-400"></span>
                                </span>
                                <span className="text-sm font-medium text-white/90">Uçtan Uca Satın Alma Platformu</span>
                            </div>

                            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-8">
                                <span className="text-white">Satın Almayı</span>
                                <br />
                                <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">Yeniden Tanımlayın</span>
                            </h1>

                            <p className="text-xl text-slate-300 mb-10 leading-relaxed max-w-xl">
                                Talep oluşturmadan sipariş teslimatına kadar tüm satın alma süreçlerinizi tek platformda yönetin.
                                <span className="text-blue-400 font-semibold"> 6 ana modül</span> ile eksiksiz kontrol sağlayın.
                            </p>

                            <div className="flex flex-wrap gap-4 mb-12">
                                <DemoTrigger className="group px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-lg font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:-translate-y-1 transition-all flex items-center gap-3">
                                    Ücretsiz Demo Al
                                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </DemoTrigger>
                                <Link href="/login" className="px-8 py-4 bg-white/10 backdrop-blur text-white text-lg font-semibold rounded-xl border border-white/30 hover:bg-white/20 hover:-translate-y-1 transition-all">
                                    Giriş Yap
                                </Link>
                            </div>

                            <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-lg">
                                    <svg className="w-5 h-5 text-sky-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-slate-300">KVKK Uyumlu</span>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-lg">
                                    <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-slate-300">7/24 Destek</span>
                                </div>
                            </div>
                        </div>

                        <div className="hidden lg:block">
                            <div className="bg-white rounded-2xl shadow-2xl shadow-black/20 border border-slate-200 overflow-hidden transform hover:scale-[1.02] transition-transform duration-500">
                                <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center gap-2">
                                    <div className="flex gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                        <div className="w-3 h-3 rounded-full bg-sky-400"></div>
                                        <div className="w-3 h-3 rounded-full bg-green-400"></div>
                                    </div>
                                </div>
                                <img src="/screenshots/dashboard.png" alt="Dashboard" className="w-full" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-16 bg-slate-800">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {[
                            { value: "6", label: "Ana Modül" },
                            { value: "1.200+", label: "Tedarikçi" },
                            { value: "₺5M+", label: "İşlem Hacmi" },
                            { value: "%30", label: "Tasarruf" },
                        ].map((stat, i) => (
                            <div key={i} className="text-center p-6">
                                <p className="text-4xl md:text-5xl font-bold text-white mb-2">{stat.value}</p>
                                <p className="text-slate-400 font-medium">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works - Process Flow */}
            <section id="nasil-calisir" className="py-24 bg-slate-100">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-4">Süreç Akışı</p>
                        <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-6">
                            Nasıl <span className="text-blue-600">Çalışır?</span>
                        </h2>
                        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                            Talep oluşturmadan teslimat onayına kadar 6 adımlı süreç yönetimi
                        </p>
                    </div>

                    {/* Process Steps */}
                    <div className="relative">
                        {/* Connection Line */}
                        <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 transform -translate-y-1/2 rounded-full"></div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[
                                { step: "1", icon: "📋", title: "Talep Oluşturma", desc: "Departmanlar ihtiyaçlarını sisteme girer. Bütçe kontrolü ve onay akışı otomatik başlar.", link: "/talep/olustur", color: "bg-blue-500" },
                                { step: "2", icon: "📊", title: "RFQ & Teklif Toplama", desc: "Onaylanan talepler için tedarikçilere otomatik teklif talebi gönderilir.", link: "/rfq/olustur", color: "bg-blue-600" },
                                { step: "3", icon: "⚖️", title: "Teklif Karşılaştırma", desc: "Gelen teklifler yan yana karşılaştırılır, en uygun teklif seçilir.", link: "/rfq/liste", color: "bg-violet-500" },
                                { step: "4", icon: "🛒", title: "Sipariş Oluşturma", desc: "Seçilen teklif siparişe dönüştürülür, tedarikçiye bildirim gider.", link: "/siparis/olustur", color: "bg-sky-500" },
                                { step: "5", icon: "📦", title: "Teslimat Takibi", desc: "Teslimat durumu anlık takip edilir, irsaliye ve belgeler eklenir.", link: "/teslimat/bekleyen", color: "bg-fuchsia-500" },
                                { step: "6", icon: "📄", title: "Fatura & Ödeme", desc: "Faturalar sisteme işlenir, ödeme takibi yapılır, süreç tamamlanır.", link: "/fatura/liste", color: "bg-pink-500" },
                            ].map((item, i) => (
                                <div key={i} className="relative group">
                                    <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 h-full">
                                        <div className={`w-16 h-16 rounded-2xl ${item.color} flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                                            {item.icon}
                                        </div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className={`w-8 h-8 rounded-full ${item.color} text-white font-bold text-sm flex items-center justify-center`}>{item.step}</span>
                                            <h3 className="text-xl font-semibold text-slate-800">{item.title}</h3>
                                        </div>
                                        <p className="text-slate-600 leading-relaxed">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Platform Features */}
            <section id="ozellikler" className="py-24 bg-slate-800">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <p className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-4">Platform Özellikleri</p>
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                            Tüm İhtiyaçlarınız <span className="text-blue-400">Tek Platformda</span>
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { icon: "👥", title: "Tedarikçi Yönetimi", desc: "Tedarikçi kayıt, değerlendirme ve kategorizasyon", link: "/tedarikci/liste" },
                            { icon: "🔔", title: "Bildirimler", desc: "Anlık e-posta ve sistem bildirimleri", link: "/bildirimler" },
                            { icon: "📈", title: "Raporlama", desc: "Detaylı analiz ve dashboard raporları", link: "/analitik" },
                            { icon: "⚙️", title: "Ayarlar", desc: "Şirket, kullanıcı ve sistem ayarları", link: "/ayarlar" },
                            { icon: "🔐", title: "Rol Yönetimi", desc: "Esnek yetkilendirme ve erişim kontrolü", link: "/ayarlar" },
                            { icon: "📁", title: "Döküman Yönetimi", desc: "Sözleşme ve belge arşivi", link: "/sozlesme/liste" },
                            { icon: "💬", title: "Mesajlaşma", desc: "Tedarikçilerle anlık iletişim", link: "/portal" },
                            { icon: "📱", title: "Mobil Uyumlu", desc: "Her cihazdan erişim imkanı", link: "/" },
                        ].map((item, i) => (
                            <div key={i} className="p-6 bg-slate-700/50 rounded-xl border border-slate-600 hover:bg-slate-700 transition-colors group">
                                <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">{item.icon}</div>
                                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                                <p className="text-slate-400 text-sm">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* For Buyers */}
            <section id="alicilar" className="py-24 bg-slate-100">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-4">Alıcı Firmalar İçin</p>
                            <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-6 leading-tight">
                                Satın Alma Süreçlerinizi <span className="text-blue-600">Dijitalleştirin</span>
                            </h2>
                            <p className="text-lg text-slate-600 mb-10 leading-relaxed">
                                Tüm departmanların taleplerini merkezi olarak yönetin, onay süreçlerini otomatikleştirin.
                            </p>

                            <div className="space-y-4 mb-10">
                                {[
                                    "Departman bazlı talep yönetimi",
                                    "Otomatik onay akışları",
                                    "Çoklu tedarikçi teklif karşılaştırma",
                                    "Sipariş ve teslimat takibi",
                                    "Fatura ve ödeme yönetimi",
                                    "Detaylı raporlama ve analiz"
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-white border border-slate-200 shadow-sm">
                                        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <span className="text-slate-700 font-medium">{item}</span>
                                    </div>
                                ))}
                            </div>

                            <Link href="/login" className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:-translate-y-1 transition-all group">
                                Alıcı Olarak Başla
                                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </Link>
                        </div>

                        <div className="hidden lg:block">
                            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-3">
                                <img src="/screenshots/rfq.png" alt="RFQ" className="rounded-xl w-full" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* For Suppliers */}
            <section id="tedarikciler" className="py-24 bg-slate-800">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div className="order-2 lg:order-1 hidden lg:block">
                            <div className="bg-white rounded-2xl shadow-2xl p-3">
                                <img src="/screenshots/supplier_portal.png" alt="Tedarikçi Portalı" className="rounded-xl w-full" />
                            </div>
                        </div>

                        <div className="order-1 lg:order-2">
                            <p className="text-sm font-semibold text-indigo-400 uppercase tracking-wider mb-4">Tedarikçi Firmalar İçin</p>
                            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                                Yeni İş Fırsatlarına <span className="text-indigo-400">Ulaşın</span>
                            </h2>
                            <p className="text-lg text-slate-300 mb-10 leading-relaxed">
                                Kurumsal müşterilerin taleplerini görün, teklif verin ve sipariş alın.
                            </p>

                            <div className="space-y-4 mb-10">
                                {[
                                    "Ücretsiz tedarikçi kaydı",
                                    "Anlık teklif talebi bildirimleri",
                                    "Kolay teklif oluşturma arayüzü",
                                    "Sipariş ve teslimat takibi",
                                    "Fatura yükleme ve ödeme takibi",
                                    "Performans değerlendirme görüntüleme"
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-slate-700/50 border border-slate-600">
                                        <div className="w-6 h-6 rounded-full bg-sky-500 flex items-center justify-center flex-shrink-0">
                                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <span className="text-white font-medium">{item}</span>
                                    </div>
                                ))}
                            </div>

                            <Link href="/portal/register" className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl shadow-lg hover:-translate-y-1 transition-all group">
                                Tedarikçi Olarak Kayıt Ol
                                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-24 bg-slate-100">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-4">Referanslar</p>
                        <h2 className="text-4xl md:text-5xl font-bold text-slate-800">
                            Müşterilerimiz <span className="text-blue-600">Ne Diyor?</span>
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { name: "Ahmet Yılmaz", role: "Satın Alma Müdürü", company: "ABC Holding", text: "Satın alma süreçlerimizde ciddi verimlilik artışı yaşadık. Tüm akış artık dijital.", avatar: "AY", color: "bg-blue-500" },
                            { name: "Mehmet Kaya", role: "Genel Müdür", company: "MK Ticaret", text: "Tedarikçi portalı sayesinde yeni kurumsal müşterilere ulaştık.", avatar: "MK", color: "bg-blue-600" },
                            { name: "Ayşe Demir", role: "Finans Direktörü", company: "XYZ Sanayi", text: "Şeffaf raporlama ile yıllık %25 tasarruf sağladık.", avatar: "AD", color: "bg-sky-500" },
                        ].map((item, i) => (
                            <div key={i} className="p-8 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all">
                                <div className="flex gap-1 mb-6">
                                    {[...Array(5)].map((_, j) => (
                                        <svg key={j} className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                    ))}
                                </div>
                                <p className="text-slate-600 mb-8 leading-relaxed">&ldquo;{item.text}&rdquo;</p>
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-full ${item.color} flex items-center justify-center text-white font-bold`}>
                                        {item.avatar}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-800">{item.name}</p>
                                        <p className="text-sm text-slate-500">{item.role}, {item.company}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section id="sss" className="py-24 bg-slate-800">
                <div className="max-w-4xl mx-auto px-6">
                    <div className="text-center mb-12">
                        <p className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-4">Sıkça Sorulan Sorular</p>
                        <h2 className="text-4xl font-bold text-white mb-4">Aklınıza Takılanlar</h2>
                        <p className="text-slate-400">Daha fazla soru için <Link href="/yardim" className="text-blue-400 hover:underline">Yardım Merkezi</Link>&apos;ni ziyaret edin</p>
                    </div>
                    <div className="bg-slate-700/50 rounded-2xl border border-slate-600 p-8">
                        <FAQSection faqItems={faqItems} />
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                        Satın Alma Süreçlerinizi Dijitalleştirmeye Hazır mısınız?
                    </h2>
                    <p className="text-xl text-blue-100 mb-10">
                        Hemen ücretsiz demo talep edin, uzmanlarımız sizinle iletişime geçsin.
                    </p>
                    <div className="flex flex-wrap gap-4 justify-center">
                        <DemoTrigger className="px-10 py-5 bg-white text-blue-600 text-lg font-bold rounded-xl shadow-xl hover:-translate-y-1 transition-all">
                            Ücretsiz Demo İsteyin
                        </DemoTrigger>
                        <Link href="/login" className="px-10 py-5 bg-transparent text-white text-lg font-semibold rounded-xl border-2 border-white/40 hover:border-white hover:bg-white/10 transition-all">
                            Hemen Başlayın
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-16 bg-slate-900">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="grid md:grid-cols-5 gap-8 mb-12">
                        <div className="md:col-span-2">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <span className="text-xl font-bold text-white">{siteName}</span>
                            </div>
                            <p className="text-slate-400 text-sm mb-6">{siteDescription}</p>
                        </div>

                        <div>
                            <h4 className="font-semibold text-white mb-4">Platform</h4>
                            <ul className="space-y-2 text-sm text-slate-400">
                                <li><a href="#ozellikler" className="hover:text-white transition-colors">Özellikler</a></li>
                                <li><a href="#nasil-calisir" className="hover:text-white transition-colors">Nasıl Çalışır?</a></li>
                                <li><a href="#alicilar" className="hover:text-white transition-colors">Alıcılar</a></li>
                                <li><a href="#tedarikciler" className="hover:text-white transition-colors">Tedarikçiler</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold text-white mb-4">Destek</h4>
                            <ul className="space-y-2 text-sm text-slate-400">
                                <li><Link href="/yardim" className="hover:text-white transition-colors">Yardım Merkezi</Link></li>
                                <li><a href="#sss" className="hover:text-white transition-colors">SSS</a></li>
                                <li><Link href="/api-docs" className="hover:text-white transition-colors">API Dökümanları</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold text-white mb-4">Yasal</h4>
                            <ul className="space-y-2 text-sm text-slate-400">
                                <li><Link href="/kvkk" className="hover:text-white transition-colors">KVKK Aydınlatma</Link></li>
                                <li><Link href="/gizlilik-politikasi" className="hover:text-white transition-colors">Gizlilik Politikası</Link></li>
                                <li><Link href="/cerez-politikasi" className="hover:text-white transition-colors">Çerez Politikası</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold text-white mb-4">İletişim</h4>
                            <ul className="space-y-2 text-sm text-slate-400">
                                <li className="flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    {supportPhone}
                                </li>
                                <li className="flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    {supportEmail}
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-slate-800 pt-8 text-center text-sm text-slate-500">
                        © {new Date().getFullYear()} {siteName}. Tüm hakları saklıdır.
                    </div>
                </div>
            </footer>
        </div>
    );
}
