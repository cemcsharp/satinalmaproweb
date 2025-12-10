"use client";
import React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

export default function UnauthorizedPage() {
  const { status } = useSession();

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4 animate-in fade-in duration-500">
      <div className="w-full max-w-md text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 text-red-600 rounded-full mb-6 shadow-lg shadow-red-500/20">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-slate-900 mb-2">Yetkisiz Erişim</h1>
        <p className="text-slate-600 mb-8">
          Bu sayfaya erişmek için gerekli izinlere sahip değilsiniz.
        </p>

        <Card variant="glass" className="p-6 mb-8 border-red-100 shadow-xl">
          <div className="space-y-4">
            {status === "authenticated" ? (
              <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 text-left flex items-start gap-3">
                <svg className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p className="text-sm text-orange-800">
                  Oturumunuz açık ancak bu işlemi gerçekleştirmek veya bu sayfayı görüntülemek için hesabınızın yetkisi yetersiz. Yöneticinizle iletişime geçiniz.
                </p>
              </div>
            ) : (
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 text-left flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p className="text-sm text-blue-800">
                  Bu sayfayı görüntülemek için lütfen giriş yapınız.
                </p>
              </div>
            )}
          </div>
        </Card>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="w-full sm:w-auto">
            <Button variant="outline" fullWidth>Ana Sayfaya Dön</Button>
          </Link>
          {status !== "authenticated" && (
            <Link href="/login" className="w-full sm:w-auto">
              <Button variant="gradient" fullWidth className="shadow-lg shadow-blue-500/20">Giriş Yap</Button>
            </Link>
          )}
        </div>

        <div className="mt-8 text-sm text-slate-400">
          Hata Kodu: 401 Unauthorized
        </div>
      </div>
    </div>
  );
}