import Link from "next/link";
import { getSystemSettings } from "@/lib/settings";

export const metadata = {
    title: "Çerez Politikası",
    description: "Çerez kullanımı hakkında bilgilendirme"
};

export default async function CerezPolitikasiPage() {
    const settings = await getSystemSettings();
    const { siteName, supportEmail } = settings;

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-slate-800 text-white py-16">
                <div className="max-w-4xl mx-auto px-6">
                    <Link href="/" className="text-blue-400 hover:text-blue-300 text-sm mb-4 inline-flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Ana Sayfa
                    </Link>
                    <h1 className="text-4xl font-bold mt-4">Çerez Politikası</h1>
                    <p className="text-slate-300 mt-2">Son güncelleme: {new Date().toLocaleDateString("tr-TR")}</p>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-6 py-12">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 md:p-12 space-y-8">

                    <section>
                        <h2 className="text-2xl font-bold text-slate-800 mb-4">1. Çerez Nedir?</h2>
                        <p className="text-slate-600 leading-relaxed">
                            Çerezler, web sitelerinin cihazınıza yerleştirdiği küçük metin dosyalarıdır.
                            Bu dosyalar, siteyi ziyaret ettiğinizde tercihlerinizi hatırlamamıza ve size
                            daha iyi bir deneyim sunmamıza yardımcı olur.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-800 mb-4">2. Hangi Çerezleri Kullanıyoruz?</h2>

                        <div className="space-y-6">
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
                                <h3 className="font-semibold text-blue-800 mb-2">🔒 Zorunlu Çerezler</h3>
                                <p className="text-slate-600 text-sm mb-3">
                                    Bu çerezler web sitesinin çalışması için gereklidir ve kapatılamazlar.
                                </p>
                                <ul className="text-sm text-slate-600 space-y-1">
                                    <li>• <strong>next-auth.session-token:</strong> Oturum yönetimi</li>
                                    <li>• <strong>next-auth.csrf-token:</strong> Güvenlik doğrulaması</li>
                                    <li>• <strong>cookie-consent:</strong> Çerez tercihleriniz</li>
                                </ul>
                            </div>

                            <div className="bg-amber-50 border border-amber-100 rounded-xl p-6">
                                <h3 className="font-semibold text-blue-800 mb-2">⚙️ İşlevsel Çerezler</h3>
                                <p className="text-slate-600 text-sm mb-3">
                                    Tercihlerinizi hatırlamamıza yardımcı olur.
                                </p>
                                <ul className="text-sm text-slate-600 space-y-1">
                                    <li>• <strong>theme:</strong> Tema tercihiniz (açık/koyu)</li>
                                    <li>• <strong>sidebar-collapsed:</strong> Menü durumu</li>
                                    <li>• <strong>locale:</strong> Dil tercihiniz</li>
                                </ul>
                            </div>

                            <div className="bg-purple-50 border border-purple-100 rounded-xl p-6">
                                <h3 className="font-semibold text-purple-800 mb-2">📊 Analitik Çerezler</h3>
                                <p className="text-slate-600 text-sm mb-3">
                                    Sitemizi nasıl kullandığınızı anlamamıza yardımcı olur. (İsteğe bağlı)
                                </p>
                                <ul className="text-sm text-slate-600 space-y-1">
                                    <li>• Sayfa görüntüleme sayıları</li>
                                    <li>• Ziyaret süreleri</li>
                                    <li>• Kullanılan özellikler</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-800 mb-4">3. Çerez Tercihlerinizi Nasıl Yönetirsiniz?</h2>
                        <p className="text-slate-600 leading-relaxed mb-4">
                            Çerez tercihlerinizi aşağıdaki yöntemlerle yönetebilirsiniz:
                        </p>
                        <ul className="list-disc list-inside text-slate-600 space-y-2">
                            <li>Sitemize ilk girişinizde çıkan çerez banner'ından tercihlerinizi belirleyebilirsiniz</li>
                            <li>Tarayıcınızın ayarlarından çerezleri silebilir veya engelleyebilirsiniz</li>
                            <li>Her tarayıcının farklı ayarları olduğunu unutmayın</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-800 mb-4">4. Çerez Saklama Süreleri</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200">
                                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Çerez</th>
                                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Süre</th>
                                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Amaç</th>
                                    </tr>
                                </thead>
                                <tbody className="text-slate-600">
                                    <tr className="border-b border-slate-100">
                                        <td className="py-3 px-4">session-token</td>
                                        <td className="py-3 px-4">30 gün</td>
                                        <td className="py-3 px-4">Oturum yönetimi</td>
                                    </tr>
                                    <tr className="border-b border-slate-100">
                                        <td className="py-3 px-4">cookie-consent</td>
                                        <td className="py-3 px-4">1 yıl</td>
                                        <td className="py-3 px-4">Tercih kaydetme</td>
                                    </tr>
                                    <tr className="border-b border-slate-100">
                                        <td className="py-3 px-4">theme</td>
                                        <td className="py-3 px-4">1 yıl</td>
                                        <td className="py-3 px-4">Tema tercihi</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-800 mb-4">5. İletişim</h2>
                        <p className="text-slate-600 leading-relaxed">
                            Çerez politikamız hakkında sorularınız için bizimle iletişime geçebilirsiniz:
                        </p>
                        <div className="mt-4 p-4 bg-slate-50 rounded-xl">
                            <p className="text-slate-700"><strong>E-posta:</strong> {supportEmail}</p>
                            <p className="text-slate-700"><strong>Platform:</strong> {siteName}</p>
                        </div>
                    </section>

                    <section className="border-t border-slate-200 pt-8">
                        <div className="flex flex-wrap gap-4">
                            <Link href="/gizlilik-politikasi" className="text-blue-600 hover:text-blue-700 font-medium">
                                Gizlilik Politikası →
                            </Link>
                            <Link href="/kvkk" className="text-blue-600 hover:text-blue-700 font-medium">
                                KVKK Aydınlatma Metni →
                            </Link>
                        </div>
                    </section>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-slate-800 text-slate-400 py-8">
                <div className="max-w-4xl mx-auto px-6 text-center text-sm">
                    © {new Date().getFullYear()} {siteName}. Tüm hakları saklıdır.
                </div>
            </footer>
        </div>
    );
}
