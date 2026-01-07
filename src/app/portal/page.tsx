import Link from "next/link";
import Button from "@/components/ui/Button";

export default function PortalDashboard() {
    return (
        <div className="space-y-8">
            {/* Welcome Banner */}
            <div className="bg-gradient-to-br from-blue-700 to-indigo-800 rounded-3xl p-8 md:p-12 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl animate-pulse" />
                <div className="relative z-10 max-w-2xl">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
                        Tedarikçi Portalı'na Hoş Geldiniz
                    </h1>
                    <p className="text-blue-100 text-lg md:text-xl mb-8 leading-relaxed">
                        Kurumumuzun satın alma süreçlerine dahil olmak, teklif vermek ve mevcut talepleri takip etmek için bu paneli kullanabilirsiniz.
                    </p>
                    <div className="flex flex-wrap gap-4">
                        <Link href="/portal/rfq">
                            <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50 border-none px-8 font-bold shadow-lg shadow-blue-900/20">
                                Açık Teklifler
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center text-2xl mb-4">
                        📩
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Hızlı Teklif</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">
                        Size iletilen magic-link ile giriş yaparak şifre gerektirmeden teklifinizi anında iletebilirsiniz.
                    </p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center text-2xl mb-4">
                        📊
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Süreç Takibi</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">
                        Verdiğiniz tekliflerin durumunu, onaylanıp onaylanmadığını portal üzerinden anlık izleyebilirsiniz.
                    </p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center text-2xl mb-4">
                        🛡️
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Güvenli İşlem</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">
                        Tüm işlemleriniz dijital olarak kayıt altına alınır ve kurumsal standartlarda korunur.
                    </p>
                </div>
            </div>

            {/* Getting Started Section */}
            <div className="bg-slate-900 rounded-3xl p-8 text-white">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <span className="text-amber-400">💡</span> Nasıl Teklif Verilir?
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {[
                        { step: "01", title: "RFQ Seçin", desc: "Size atanan aktif teklif isteklerini listeleyin." },
                        { step: "02", title: "Fiyat Girin", desc: "Her bir kalem için birim fiyat ve KDV belirtin." },
                        { step: "03", title: "Zaman Belirleyin", desc: "Ürünlerin teslim tarihlerini (termin) girin." },
                        { step: "04", title: "Gönderin", desc: "Teklifinizi onaylayıp sisteme nihai olarak iletin." },
                    ].map((item, idx) => (
                        <div key={idx} className="relative">
                            <span className="text-5xl font-black text-white/5 absolute -top-4 -left-2 select-none">
                                {item.step}
                            </span>
                            <h4 className="text-lg font-bold mb-2 relative z-10">{item.title}</h4>
                            <p className="text-slate-400 text-sm leading-relaxed relative z-10">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
