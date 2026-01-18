import Link from "next/link";
import { getSystemSettings } from "@/lib/settings";

export const metadata = {
    title: "KVKK Aydınlatma Metni",
    description: "6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında aydınlatma metni"
};

export default async function KVKKPage() {
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
                    <h1 className="text-4xl font-bold mt-4">KVKK Aydınlatma Metni</h1>
                    <p className="text-slate-300 mt-2">6698 Sayılı Kişisel Verilerin Korunması Kanunu</p>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-6 py-12">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 md:p-12 space-y-8">

                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
                        <p className="text-blue-800 font-medium">
                            Bu aydınlatma metni, 6698 sayılı Kişisel Verilerin Korunması Kanunu&apos;nun (&quot;KVKK&quot;)
                            10. maddesi gereğince veri sorumlusu sıfatıyla hazırlanmıştır.
                        </p>
                    </div>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-800 mb-4">1. Veri Sorumlusu</h2>
                        <p className="text-slate-600 leading-relaxed">
                            <strong>{siteName}</strong> platformu olarak, kişisel verilerinizin güvenliği konusunda
                            6698 sayılı Kanun kapsamında &quot;Veri Sorumlusu&quot; sıfatıyla hareket etmekteyiz.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-800 mb-4">2. İşlenen Kişisel Veriler</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-slate-50">
                                        <th className="text-left py-3 px-4 font-semibold text-slate-700 border-b">Veri Kategorisi</th>
                                        <th className="text-left py-3 px-4 font-semibold text-slate-700 border-b">Veri Türleri</th>
                                    </tr>
                                </thead>
                                <tbody className="text-slate-600">
                                    <tr className="border-b">
                                        <td className="py-3 px-4 font-medium">Kimlik Bilgileri</td>
                                        <td className="py-3 px-4">Ad, soyad, T.C. kimlik numarası, vergi numarası</td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="py-3 px-4 font-medium">İletişim Bilgileri</td>
                                        <td className="py-3 px-4">E-posta, telefon, adres</td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="py-3 px-4 font-medium">Mesleki Bilgiler</td>
                                        <td className="py-3 px-4">Şirket adı, unvan, departman</td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="py-3 px-4 font-medium">İşlem Güvenliği</td>
                                        <td className="py-3 px-4">IP adresi, oturum bilgileri, log kayıtları</td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="py-3 px-4 font-medium">Finansal Bilgiler</td>
                                        <td className="py-3 px-4">Banka bilgileri, fatura bilgileri (sadece işlem için)</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-800 mb-4">3. Veri İşleme Amaçları</h2>
                        <ul className="list-disc list-inside text-slate-600 space-y-2">
                            <li>Satın alma süreçlerinin yürütülmesi</li>
                            <li>Sözleşme ve hukuki yükümlülüklerin yerine getirilmesi</li>
                            <li>Tedarikçi ilişkilerinin yönetimi</li>
                            <li>Fatura ve ödeme işlemlerinin gerçekleştirilmesi</li>
                            <li>Müşteri hizmetleri ve destek sunulması</li>
                            <li>Yasal düzenlemelere uyum sağlanması</li>
                            <li>Bilgi güvenliğinin temini</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-800 mb-4">4. Hukuki Dayanaklar</h2>
                        <p className="text-slate-600 leading-relaxed mb-4">
                            Kişisel verileriniz, KVKK&apos;nın 5. maddesinde belirtilen aşağıdaki hukuki sebeplere dayalı olarak işlenmektedir:
                        </p>
                        <div className="space-y-3">
                            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                                <span className="text-blue-600 font-bold">a)</span>
                                <span className="text-slate-600">Açık rızanızın bulunması</span>
                            </div>
                            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                                <span className="text-blue-600 font-bold">b)</span>
                                <span className="text-slate-600">Kanunlarda açıkça öngörülmesi</span>
                            </div>
                            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                                <span className="text-blue-600 font-bold">c)</span>
                                <span className="text-slate-600">Sözleşmenin ifası için zorunlu olması</span>
                            </div>
                            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                                <span className="text-blue-600 font-bold">ç)</span>
                                <span className="text-slate-600">Veri sorumlusunun hukuki yükümlülüğü</span>
                            </div>
                            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                                <span className="text-blue-600 font-bold">d)</span>
                                <span className="text-slate-600">Meşru menfaatlerimiz için zorunlu olması</span>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-800 mb-4">5. Verilerin Aktarımı</h2>
                        <p className="text-slate-600 leading-relaxed mb-4">
                            Kişisel verileriniz, işleme amaçları doğrultusunda aşağıdaki taraflara aktarılabilir:
                        </p>
                        <ul className="list-disc list-inside text-slate-600 space-y-2">
                            <li>Tedarikçi firmalar (satın alma süreçleri kapsamında)</li>
                            <li>İş ortaklarımız ve hizmet sağlayıcılarımız</li>
                            <li>Kanunen yetkili kamu kurum ve kuruluşları</li>
                            <li>Kanunen yetkili özel hukuk kişileri</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-800 mb-4">6. Veri Saklama Süreleri</h2>
                        <p className="text-slate-600 leading-relaxed">
                            Kişisel verileriniz, işleme amaçlarının gerektirdiği süre boyunca ve ilgili mevzuatta
                            öngörülen zamanaşımı süreleri boyunca saklanmaktadır. Saklama süresi sona erdiğinde
                            verileriniz silinir, yok edilir veya anonim hale getirilir.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-800 mb-4">7. KVKK Kapsamında Haklarınız</h2>
                        <p className="text-slate-600 leading-relaxed mb-4">
                            KVKK&apos;nın 11. maddesi uyarınca aşağıdaki haklara sahipsiniz:
                        </p>
                        <div className="bg-slate-50 rounded-xl p-6">
                            <ul className="space-y-3 text-slate-600">
                                <li className="flex items-start gap-2">
                                    <span className="text-green-500 mt-1">✓</span>
                                    Kişisel veri işlenip işlenmediğini öğrenme
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-500 mt-1">✓</span>
                                    Kişisel veriler işlenmişse buna ilişkin bilgi talep etme
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-500 mt-1">✓</span>
                                    İşlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-500 mt-1">✓</span>
                                    Yurt içinde veya yurt dışında kişisel verilerin aktarıldığı üçüncü kişileri bilme
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-500 mt-1">✓</span>
                                    Kişisel verilerin eksik veya yanlış işlenmiş olması hâlinde bunların düzeltilmesini isteme
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-500 mt-1">✓</span>
                                    KVKK 7. maddedeki şartlar çerçevesinde kişisel verilerin silinmesini veya yok edilmesini isteme
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-500 mt-1">✓</span>
                                    İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle kişinin kendisi aleyhine bir sonucun ortaya çıkmasına itiraz etme
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-500 mt-1">✓</span>
                                    Kanuna aykırı olarak işlenmesi sebebiyle zarara uğraması hâlinde zararın giderilmesini talep etme
                                </li>
                            </ul>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-800 mb-4">8. Başvuru Yöntemi</h2>
                        <p className="text-slate-600 leading-relaxed mb-4">
                            Yukarıda belirtilen haklarınızı kullanmak için aşağıdaki yöntemlerle başvurabilirsiniz:
                        </p>
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
                            <p className="text-slate-700 mb-2"><strong>E-posta:</strong> {supportEmail}</p>
                            <p className="text-slate-700"><strong>Konu:</strong> &quot;KVKK Bilgi Talebi&quot;</p>
                            <p className="text-slate-600 text-sm mt-4">
                                Başvurunuzda; adınız, soyadınız, T.C. kimlik numaranız, iletişim bilgileriniz ve
                                talebinizin konusunu belirtmeniz gerekmektedir.
                            </p>
                        </div>
                    </section>

                    <section className="border-t border-slate-200 pt-8">
                        <div className="flex flex-wrap gap-4">
                            <Link href="/cerez-politikasi" className="text-blue-600 hover:text-blue-700 font-medium">
                                Çerez Politikası →
                            </Link>
                            <Link href="/gizlilik-politikasi" className="text-blue-600 hover:text-blue-700 font-medium">
                                Gizlilik Politikası →
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
