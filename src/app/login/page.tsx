"use client";
import { useState, useEffect, useRef } from "react";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ensureSessionReady } from "@/lib/sessionClient";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";

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

  // Auth guard
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
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.ok) {
        await fetch('/api/auth/rate-limit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: email, success: true })
        });
        if (!didNavigateRef.current) {
          didNavigateRef.current = true;
          await ensureSessionReady();
          router.replace("/");
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center p-4 animate-in fade-in duration-500">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-teal-600 rounded-2xl mb-4 shadow-lg shadow-blue-500/30">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">SatınalmaPRO</h1>
          <p className="text-slate-600">Hesabınıza giriş yapın</p>
        </div>

        <Card variant="glass" className="p-8 shadow-xl border-white/40">
          <form onSubmit={onSubmit} className="space-y-6">
            <Input
              label="E-posta"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ornek@firma.com"
              autoComplete="email"
              error={validationErrors.email}
            />

            <div>
              <label className="text-xs font-semibold text-slate-500 ml-1 uppercase tracking-wide mb-1.5 block">
                Şifre
              </label>
              <div className="relative group">
                <input
                  type={showPassword ? "text" : "password"}
                  className={`
                    flex w-full rounded-xl border border-slate-200/60 bg-white/50 backdrop-blur-sm px-4 py-3 pr-12
                    text-slate-700 font-medium placeholder:text-slate-400
                    hover:border-blue-300/50 hover:bg-white/80
                    focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10
                    transition-all duration-200 shadow-sm
                    ${validationErrors.password ? "border-red-300/50 focus:border-red-500/50 focus:ring-red-500/10 bg-red-50/30" : ""}
                  `}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
              {validationErrors.password && (
                <small className="text-xs font-medium text-red-500 ml-1 flex items-center gap-1 mt-1.5">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {validationErrors.password}
                </small>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p className="text-sm text-red-600 font-medium">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              variant="gradient"
              fullWidth
              size="lg"
              loading={loading}
              className="shadow-lg shadow-blue-500/20"
            >
              Giriş Yap
            </Button>

            <div className="text-center">
              <Link
                href="/login/forgot"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline transition-colors"
              >
                Şifremi unuttum
              </Link>
            </div>
          </form>
        </Card>

        <div className="text-center">
          <p className="text-sm text-slate-500">
            © 2024 Satın Alma Pro. Tüm hakları saklıdır.
          </p>
        </div>
      </div>
    </div>
  );
}
