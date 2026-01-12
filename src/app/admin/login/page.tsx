"use client";
import { useState, useEffect, useRef } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ensureSessionReady } from "@/lib/sessionClient";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";

export default function AdminLoginPage() {
    const { status } = useSession();
    const router = useRouter();
    const didNavigateRef = useRef(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (status === "authenticated") {
            if (!didNavigateRef.current) {
                didNavigateRef.current = true;
                router.replace("/admin");
            }
        }
    }, [status, router]);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (res?.ok) {
                await ensureSessionReady();

                // Admin rol kontrolü
                const sessionRes = await fetch('/api/auth/session');
                const sessionData = await sessionRes.json();

                if (sessionData?.user?.role !== 'admin') {
                    setError("Bu giriş sadece sistem yöneticileri içindir.");
                    // Oturumu kapat
                    await fetch('/api/auth/signout', { method: 'POST' });
                    return;
                }

                router.replace("/admin");
            } else {
                setError("E-posta veya şifre hatalı.");
            }
        } catch (e) {
            setError("Beklenmeyen bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl mb-4 shadow-lg">
                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Admin Girişi</h1>
                    <p className="text-red-200">Sistem Yönetim Paneli</p>
                </div>

                <Card className="p-8 shadow-2xl bg-white/95 backdrop-blur-xl">
                    <form onSubmit={onSubmit} className="space-y-6">
                        <Input
                            label="E-posta"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@satinalmapro.com"
                            autoComplete="email"
                        />

                        <Input
                            label="Şifre"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            autoComplete="current-password"
                        />

                        {error && (
                            <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                                <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-sm text-red-600 font-medium">{error}</p>
                            </div>
                        )}

                        <Button
                            type="submit"
                            variant="primary"
                            fullWidth
                            size="lg"
                            loading={loading}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Admin Girişi
                        </Button>
                    </form>
                </Card>

                <div className="text-center">
                    <p className="text-sm text-red-200">
                        Normal kullanıcı girişi için{" "}
                        <a href="/login" className="text-white hover:underline font-medium">
                            buraya tıklayın
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
