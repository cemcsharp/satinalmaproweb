"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";

export default function ResetPasswordPage() {
  const params = useParams();
  const token = String((params as any)?.token || "");
  const [valid, setValid] = useState<boolean | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    async function verify() {
      try {
        const res = await fetch(`/api/auth/reset?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Doğrulama başarısız");
        setValid(Boolean(data.valid));
        setUserId(String(data.userId || ""));
      } catch (e: any) {
        setValid(false);
        setError(e?.message || "Beklenmeyen hata");
      }
    }
    if (token) verify();
  }, [token]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "İşlem başarısız");
      setDone(true);
    } catch (e: any) {
      setError(e?.message || "Beklenmeyen hata");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center p-4 animate-in fade-in duration-500">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-teal-600 rounded-2xl mb-4 shadow-lg shadow-blue-500/30">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11.543 12l-1.88 1.88a2 2 0 01-2.828 0l-.66-.66a2 2 0 010-2.828L9 7.543A6 6 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l-3-3" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Şifre Sıfırlama</h1>
          <p className="text-slate-600">Yeni şifrenizi belirleyin</p>
        </div>

        <Card variant="glass" className="p-8 shadow-xl border-white/40">
          {valid === null && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-slate-500 font-medium">Bağlantı doğrulanıyor...</p>
            </div>
          )}

          {valid === false && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Geçersiz Bağlantı</h3>
                <p className="text-slate-600">
                  Bu şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş.
                </p>
                {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
              </div>
              <Link href="/login">
                <Button variant="outline" fullWidth>Giriş Ekranına Dön</Button>
              </Link>
            </div>
          )}

          {valid && !done && (
            <form onSubmit={submit} className="space-y-6">
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                  {userId?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs text-blue-500 font-semibold uppercase">Kullanıcı</p>
                  <p className="text-sm font-medium text-blue-900">{userId}</p>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 ml-1 uppercase tracking-wide mb-1.5 block">
                  Yeni Şifre
                </label>
                <div className="relative group">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="flex w-full rounded-xl border border-slate-200/60 bg-white/50 backdrop-blur-sm px-4 py-3 pr-12 text-slate-700 font-medium placeholder:text-slate-400 hover:border-blue-300/50 hover:bg-white/80 focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 shadow-sm"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="En az 4 karakter"
                    required
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
                Şifreyi Güncelle
              </Button>
            </form>
          )}

          {valid && done && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Şifre Güncellendi</h3>
                <p className="text-slate-600">
                  Şifreniz başarıyla değiştirildi. Yeni şifrenizle giriş yapabilirsiniz.
                </p>
              </div>
              <Link href="/login">
                <Button variant="gradient" fullWidth size="lg" className="shadow-lg shadow-blue-500/20">Giriş Yap</Button>
              </Link>
            </div>
          )}

          {!valid && valid !== false && (
            <div className="mt-6 text-center pt-6 border-t border-slate-100">
              <Link
                href="/login"
                className="text-sm text-slate-600 hover:text-blue-600 font-medium hover:underline transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                Giriş ekranına dön
              </Link>
            </div>
          )}
        </Card>

        <div className="text-center">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} satinalma.app. Tüm hakları saklıdır.
          </p>
        </div>
      </div>
    </div>
  );
}