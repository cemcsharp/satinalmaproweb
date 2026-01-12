import Link from "next/link";

export default function RegistrationPendingPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center p-6">
            <div className="w-full max-w-md text-center">
                {/* Success Icon */}
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>

                <h1 className="text-2xl font-bold text-slate-900 mb-2">Kayıt Başarılı!</h1>
                <p className="text-slate-600 mb-8">
                    Tedarikçi kayıt talebiniz alınmıştır. Hesabınız admin tarafından incelenecek
                    ve onaylandığında e-posta ile bilgilendirileceksiniz.
                </p>

                {/* Info Card */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100 mb-8">
                    <h3 className="font-bold text-slate-800 mb-4">Sonraki Adımlar</h3>
                    <ul className="text-left text-sm text-slate-600 space-y-3">
                        <li className="flex items-start gap-3">
                            <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xs font-bold flex-shrink-0">1</span>
                            <span>Kayıt bilgileriniz admin tarafından incelenecek</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xs font-bold flex-shrink-0">2</span>
                            <span>Onay sonrası e-posta ile bilgilendirileceksiniz</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xs font-bold flex-shrink-0">3</span>
                            <span>Kayıt e-postanız ve şifreniz ile giriş yapabilirsiniz</span>
                        </li>
                    </ul>
                </div>

                {/* Buttons */}
                <div className="flex flex-col gap-3">
                    <Link
                        href="/"
                        className="px-6 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
                    >
                        Ana Sayfaya Dön
                    </Link>
                    <Link
                        href="/portal/login"
                        className="text-sm text-emerald-600 font-semibold hover:underline"
                    >
                        Giriş Sayfasına Git
                    </Link>
                </div>
            </div>
        </div>
    );
}
