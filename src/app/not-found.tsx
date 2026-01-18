"use client";
import Link from 'next/link';
import Button from '@/components/ui/Button';

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4 text-center">
            <div className="relative">
                <h1 className="text-9xl font-black text-slate-200 select-none">404</h1>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-4xl">🔍</span>
                </div>
            </div>

            <div className="mt-8 space-y-4">
                <h2 className="text-3xl font-bold text-slate-900">Aradığınız Sayfa Bulunamadı</h2>
                <p className="text-slate-600 max-w-md mx-auto leading-relaxed">
                    Üzgünüz, aradığınız sayfa kaldırılmış, adı değiştirilmiş veya geçici olarak kullanım dışı olabilir.
                </p>
            </div>

            <div className="mt-12 flex flex-col sm:flex-row gap-4">
                <Link href="/">
                    <Button variant="primary" size="lg" className="w-full sm:w-auto">
                        Ana Sayfaya Dön
                    </Button>
                </Link>
                <button
                    onClick={() => window.history.back()}
                    className="px-6 py-3 text-slate-600 font-semibold hover:text-slate-900 transition-colors"
                >
                    Geri Dön
                </button>
            </div>

            <div className="mt-16 text-slate-400 text-sm">
                satinalma.app v2.0
            </div>
        </div>
    );
}
