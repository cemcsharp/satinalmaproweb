"use client";
import { useEffect } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log error to console or monitoring service
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4 text-center">
            <div className="relative">
                <h1 className="text-9xl font-black text-rose-100 select-none">500</h1>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-4xl text-rose-500">⚠️</span>
                </div>
            </div>

            <div className="mt-8 space-y-4">
                <h2 className="text-3xl font-bold text-slate-900">Sistemsel Bir Hata Oluştu</h2>
                <p className="text-slate-600 max-w-md mx-auto leading-relaxed">
                    Beklenmedik bir sorunla karşılaştık. Teknik ekibimiz durumdan haberdar edildi.
                    Lütfen sayfayı yenilemeyi deneyin.
                </p>
            </div>

            <div className="mt-12 flex flex-col sm:flex-row gap-4">
                <Button variant="primary" size="lg" onClick={() => reset()} className="w-full sm:w-auto">
                    Tekrar Dene
                </Button>
                <Link href="/">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto">
                        Ana Sayfaya Dön
                    </Button>
                </Link>
            </div>

            <div className="mt-16 text-slate-400 text-sm">
                Error ID: <code className="bg-slate-100 px-2 py-1 rounded text-xs">{error.digest || 'unknown'}</code>
            </div>
        </div>
    );
}
