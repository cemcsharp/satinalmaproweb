import Link from "next/link";
import { getSystemSettings } from "@/lib/settings";

export const metadata = {
    title: "Gizlilik Politikası",
    description: "Kişisel verilerinizin korunması hakkında bilgilendirme"
};

export default async function GizlilikPolitikasiPage() {
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
                    <h1 className="text-4xl font-bold mt-4">Gizlilik Politikası</h1>
                    <p className="text-slate-300 mt-2">Son güncelleme: {new Date().toLocaleDateString("tr-TR")}</p>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-6 py-12">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 md:p-12 space-y-8">

                    <section>
                        <h2 className="text-2xl font-bold text-slate-800 mb-4">1. Giriş</h2>
                        <p className="text-slate-600 leading-relaxed">
                            {siteName} olarak, kişisel verilerinizin güvenliği konusunda azami hassasiyet gösteriyoruz.
                            Bu gizlilik politikası, platformumuzu kullanırken hangi verilerinizi topladığımızı,
                            bu verileri nasıl kullandığımızı ve koruduğumuzu açıklamaktadır.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-800 mb-4">2. Topladığımız Veriler</h2>

                        <div className="space-y-4">
                            <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
                                <h3 className="font-semibold text-slate-800 mb-2">Kimlik Bilgileri</h3>
                                <p className="text-slate-600 text-sm">Ad, soyad, e-posta adresi, telefon numarası, şirket bilgileri</p>
                            </div>

                            <div className="bg-green-50 border-l-4 border-green-500 p-4">
                                <h3 className="font-semibold text-slate-800 mb-2">İşlem Verileri</h3>
                                <p className="text-slate-600 text-sm">Satın alma talepleri, teklifler, siparişler, faturalar</p>
                            </div>

                            <div className="bg-purple-50 border-l-4 border-purple-500 p-4">
                                <h3 className="font-semibold text-slate-800 mb-2">Teknik Veriler</h3>
                                <p className="text-slate-600 text-sm">IP adresi, tarayıcı bilgisi, cihaz bilgisi, oturum verileri</p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-800 mb-4">3. Verilerin Kullanım Amaçları</h2>
                        <ul className="list-disc list-inside text-slate-600 space-y-2">
                            <li>Platformumuzun işlevselliğini sağlamak</li>
                            <li>Kullanıcı hesabınızı yönetmek</li>
                            <li>Satın alma süreçlerinizi kolaylaştırmak</li>
                            <li>Müşteri desteği sağlamak</li>
                            <li>Yasal yükümlülüklerimizi yerine getirmek</li>
                            <li>Platform güvenliğini sağlamak</li>
                            <li>Hizmetlerimizi geliştirmek</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-800 mb-4">4. Verilerin Paylaşımı</h2>
                        <p className="text-slate-600 leading-relaxed mb-4">
                            Kişisel verileriniz aşağıdaki durumlar haricinde üçüncü taraflarla paylaşılmaz:
                        </p>
                        <ul className="list-disc list-inside text-slate-600 space-y-2">
                            <li><strong>Tedarikçiler:</strong> RFQ ve sipariş süreçlerinde gerekli bilgiler</li>
                            <li><strong>Hizmet sağlayıcılar:</strong> E-posta, hosting, güvenlik hizmetleri</li>
                            <li><strong>Yasal zorunluluklar:</strong> Mahkeme kararı veya resmi talep durumunda</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-800 mb-4">5. Veri Güvenliği</h2>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="bg-slate-50 rounded-xl p-4">
                                <div className="text-2xl mb-2">🔐</div>
                                <h3 className="font-semibold text-slate-800">SSL Şifreleme</h3>
                                <p className="text-sm text-slate-600">Tüm veri transferleri şifreli</p>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-4">
                                <div className="text-2xl mb-2">🛡️</div>
                                <h3 className="font-semibold text-slate-800">Güvenli Sunucular</h3>
                                <p className="text-sm text-slate-600">Yetkisiz erişime karşı korumalı</p>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-4">
                                <div className="text-2xl mb-2">👤</div>
                                <h3 className="font-semibold text-slate-800">Rol Bazlı Erişim</h3>
                                <p className="text-sm text-slate-600">Sadece yetkili kişiler erişebilir</p>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-4">
                                <div className="text-2xl mb-2">📋</div>
                                <h3 className="font-semibold text-slate-800">Denetim Kayıtları</h3>
                                <p className="text-sm text-slate-600">Tüm işlemler kayıt altında</p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-800 mb-4">6. Haklarınız</h2>
                        <p className="text-slate-600 leading-relaxed mb-4">
                            KVKK kapsamında aşağıdaki haklara sahipsiniz:
                        </p>
                        <ul className="list-disc list-inside text-slate-600 space-y-2">
                            <li>Verilerinizin işlenip işlenmediğini öğrenme</li>
                            <li>Verileriniz hakkında bilgi talep etme</li>
                            <li>Verilerin düzeltilmesini isteme</li>
                            <li>Verilerin silinmesini talep etme</li>
                            <li>Veri işlemeye itiraz etme</li>
                            <li>Verilerinizi taşıma hakkı</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-800 mb-4">7. İletişim</h2>
                        <p className="text-slate-600 leading-relaxed">
                            Gizlilik politikamız veya verileriniz hakkında sorularınız için:
                        </p>
                        <div className="mt-4 p-4 bg-slate-50 rounded-xl">
                            <p className="text-slate-700"><strong>E-posta:</strong> {supportEmail}</p>
                            <p className="text-slate-700"><strong>Platform:</strong> {siteName}</p>
                        </div>
                    </section>

                    <section className="border-t border-slate-200 pt-8">
                        <div className="flex flex-wrap gap-4">
                            <Link href="/cerez-politikasi" className="text-blue-600 hover:text-blue-700 font-medium">
                                Çerez Politikası →
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
