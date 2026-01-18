"use client";
import { useState, useEffect, useRef } from "react";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ensureSessionReady } from "@/lib/sessionClient";

import { SystemSettings, defaultSettings } from "@/lib/settings";

export default function LoginPage() {
  const { status } = useSession();
  const router = useRouter();
  const didNavigateRef = useRef(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    password?: string;
    general?: string;
  }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTimeRemaining, setBlockTimeRemaining] = useState(0);
  const [rememberMe, setRememberMe] = useState(false);

  const [siteSettings, setSiteSettings] = useState<Partial<SystemSettings>>(defaultSettings);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then(res => res.json())
      .then(data => {
        if (data.ok && data.settings) {
          setSiteSettings(data.settings);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      if (!didNavigateRef.current) {
        didNavigateRef.current = true;
        (async () => {
          await ensureSessionReady();
          router.replace("/");
        })();
      }
    }
  }, [status]);

  const validateForm = () => {
    const errors: { email?: string; password?: string; general?: string } = {};
    if (!email.trim()) {
      errors.email = "E-posta gereklidir";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = "Geçerli bir e-posta giriniz";
    }
    if (!password) {
      errors.password = "Şifre gereklidir";
    } else if (password.length < 4) {
      errors.password = "Şifre en az 4 karakter olmalıdır";
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const checkRateLimit = async () => {
    try {
      const response = await fetch('/api/auth/rate-limit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: email })
      });
      if (response.ok) {
        const data = await response.json();
        setRemainingAttempts(data.remainingAttempts);
        setIsBlocked(data.blocked);
        setBlockTimeRemaining(data.blockTimeRemaining || 0);
        return !data.blocked;
      }
    } catch (error) {
      console.error('Rate limit check failed:', error);
    }
    return true;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const canAttempt = await checkRateLimit();
    if (!canAttempt) {
      setError(`Çok fazla başarısız giriş denemesi. ${Math.ceil(blockTimeRemaining / 60000)} dakika sonra tekrar deneyiniz.`);
      return;
    }

    setLoading(true);
    setError(null);
    setValidationErrors({});

    try {
      const res = await signIn("credentials", { email, password, redirect: false });

      if (res?.ok) {
        await fetch('/api/auth/rate-limit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: email, success: true })
        });
        if (!didNavigateRef.current) {
          didNavigateRef.current = true;
          await ensureSessionReady();
          const sessionRes = await fetch('/api/auth/session');
          const sessionData = await sessionRes.json();
          const userRole = sessionData?.user?.role;

          if (userRole === 'supplier') {
            router.replace("/portal");
          } else if (userRole === 'admin') {
            router.replace("/admin");
          } else {
            router.replace("/dashboard");
          }
        }
      } else {
        const rateLimitResponse = await fetch('/api/auth/rate-limit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: email, success: false })
        });

        if (rateLimitResponse.ok) {
          const rateLimitData = await rateLimitResponse.json();
          setRemainingAttempts(rateLimitData.remainingAttempts);
          if (rateLimitData.blocked) {
            setError(`Çok fazla başarısız giriş denemesi. ${Math.ceil(rateLimitData.blockDuration / 60000)} dakika sonra tekrar deneyiniz.`);
            setIsBlocked(true);
            setBlockTimeRemaining(rateLimitData.blockDuration);
          } else {
            setError(`Giriş bilgileri hatalı. ${rateLimitData.remainingAttempts} deneme hakkınız kaldı.`);
          }
        } else {
          setError('Giriş bilgileri hatalı. Lütfen e-posta ve şifrenizi kontrol ediniz.');
        }
      }
    } catch (e: any) {
      setError('Beklenmeyen bir hata oluştu. Lütfen tekrar deneyiniz.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Column: Branding/Hero */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 relative items-center justify-center p-12 overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-sky-600/20 rounded-full blur-[120px]"></div>
        </div>

        <div className="relative z-10 w-full max-w-lg">
          <Link href="/" className="inline-flex items-center gap-3 group mb-12">
            <div className="w-12 h-12 bg-sky-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">{siteSettings.siteName}</span>
          </Link>

          <div className="space-y-6">
            <h1 className="text-5xl font-extrabold text-white leading-tight">
              Satın almayı <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-500">yeniden tanımlayan</span> platform.
            </h1>
            <p className="text-xl text-slate-400 leading-relaxed">
              Tedarikçi ağınızı, taleplerinizi ve tüm operasyonel süreçlerinizi tek merkezden, akıllıca yönetin.
            </p>

            <div className="grid grid-cols-2 gap-6 mt-12">
              {[
                { label: 'Akıllı Analiz', desc: 'AI destekli veriler' },
                { label: 'Hızlı Tedarik', desc: 'Saniyeler içinde teklif' },
                { label: 'Şeffaf İletişim', desc: 'Anlık takip sistemi' },
                { label: 'Tam Kontrol', desc: 'Uçtan uca yönetim' }
              ].map((item, i) => (
                <div key={i} className="space-y-1">
                  <div className="text-sky-400 font-bold">{item.label}</div>
                  <div className="text-slate-500 text-sm">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer info for left side */}
        <div className="absolute bottom-12 left-12 text-slate-500 text-sm">
          &copy; {new Date().getFullYear()} {siteSettings.siteName} | Kurumsal Tedarik Çözümleri
        </div>
      </div>

      {/* Right Column: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-10">
            <Link href="/" className="inline-flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-sky-600 rounded-xl flex items-center justify-center shadow-md">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <span className="text-xl font-bold text-slate-900">{siteSettings.siteName}</span>
            </Link>
          </div>

          <div className="bg-white rounded-3xl p-8 lg:p-10 shadow-xl shadow-slate-200/50 border border-slate-100">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-slate-900">Tekrar Hoş Geldiniz</h2>
              <p className="text-slate-500 mt-2 text-sm font-medium">Hemen giriş yapın ve yönetmeye başlayın.</p>
            </div>

            <form onSubmit={onSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">E-posta Adresi</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className={`w-full px-4 py-3.5 bg-slate-50 border rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all ${validationErrors.email ? "border-red-500 bg-red-50 text-red-900" : "border-slate-200 hover:border-slate-300"}`}
                />
                {validationErrors.email && <p className="text-xs text-red-500 mt-1 ml-1 font-medium">{validationErrors.email}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">Şifre</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full px-4 py-3.5 bg-slate-50 border rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all ${validationErrors.password ? "border-red-500 bg-red-50 text-red-900" : "border-slate-200 hover:border-slate-300"}`}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-sky-600 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" /></svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    )}
                  </button>
                </div>
                {validationErrors.password && <p className="text-xs text-red-500 mt-1 ml-1 font-medium">{validationErrors.password}</p>}
              </div>

              <div className="flex items-center justify-between px-1">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 transition-all"
                  />
                  <label htmlFor="rememberMe" className="ml-2 text-sm text-slate-600 cursor-pointer">Beni Hatırla</label>
                </div>
                <Link href="/login/forgot" className="text-sm font-semibold text-sky-600 hover:text-sky-700 transition-colors">Şifremi Unuttum</Link>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <p className="text-sm text-red-800 font-medium">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-2xl shadow-lg shadow-sky-600/25 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    Giriş Yap
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-8 border-t border-slate-100 text-center">
              <p className="text-slate-600 text-sm">
                Henüz bir hesabınız yok mu?{" "}
                <Link href="/register" className="text-sky-600 hover:text-sky-700 font-bold underline-offset-4 hover:underline transition-all">
                  Ücretsiz Katılın
                </Link>
              </p>
            </div>
          </div>

          <div className="mt-8 text-center text-slate-400 text-xs font-medium">
            Güvenli protokol (SSL) ile korunmaktadır.
          </div>
        </div>
      </div>
    </div>
  );
}
