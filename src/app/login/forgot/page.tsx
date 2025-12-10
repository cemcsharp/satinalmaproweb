"use client";
import { useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";

export default function ForgotPasswordPage() {
  const [userIdOrEmail, setUserIdOrEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitted(false);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userIdOrEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "İstek başarısız");
      setResetUrl(String(data.resetUrl || null));
      setSubmitted(true);
    } catch (e: any) {
      setError(e?.message || "Beklenmeyen hata");
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11.543 12l-1.88 1.88a2 2 0 01-2.828 0l-.66-.66a2 2 0 010-2.828L9 7.543A6 6 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l-3-3" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Şifremi Unuttum</h1>
          <p className="text-slate-600">Şifrenizi sıfırlamak için bilgilerinizi girin</p>
        </div>

        <Card variant="glass" className="p-8 shadow-xl border-white/40">
          {!submitted ? (
            <form onSubmit={onSubmit} className="space-y-6">
              <Input
                label="Kullanıcı ID veya E-posta"
                value={userIdOrEmail}
                onChange={(e) => setUserIdOrEmail(e.target.value)}
                placeholder="ör. u123 veya user@example.com"
                required
              />

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
                Sıfırlama Bağlantısı Gönder
              </Button>
            </form>
          ) : (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Talep Alındı</h3>
                <p className="text-slate-600">
                  Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.
                </p>
              </div>

              {resetUrl && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-left break-all">
                  <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Demo Bağlantısı:</p>
                  <a href={resetUrl} className="text-sm text-blue-600 hover:underline">{resetUrl}</a>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 text-center pt-6 border-t border-slate-100">
            <Link
              href="/login"
              className="text-sm text-slate-600 hover:text-blue-600 font-medium hover:underline transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Giriş ekranına dön
            </Link>
          </div>
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