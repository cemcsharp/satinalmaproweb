"use client";
import { useState, useEffect, useRef } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ensureSessionReady } from "@/lib/sessionClient";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";

export default function SupplierLoginPage() {
    const { status, data: session } = useSession();
    const router = useRouter();
    const didNavigateRef = useRef(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = useState<{
        email?: string;
        password?: string;
    }>({});
    const [showPassword, setShowPassword] = useState(false);

    // Auth guard - Redirect to dashboard if already logged in as supplier
    useEffect(() => {
        if (status === "authenticated") {
            if (!didNavigateRef.current) {
                didNavigateRef.current = true;
                (async () => {
                    await ensureSessionReady();
                    const role = (session as any)?.role;
                    if (role === "supplier") {
                        router.replace("/portal/dashboard");
                    } else {
                        // If they are admin or other role but hit this page, let them through to portal or home
                        router.replace("/portal/dashboard");
                    }
                })();
            }
        }
    }, [status, session]);

    const validateForm = () => {
        const errors: { email?: string; password?: string } = {};
        if (!email.trim()) errors.email = "E-posta gereklidir";
        if (!password) errors.password = "Şifre gereklidir";
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        setError(null);

        try {
            const res = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (res?.ok) {
                if (!didNavigateRef.current) {
                    didNavigateRef.current = true;
                    await ensureSessionReady();
                    router.replace("/portal/dashboard");
                }
            } else {
                setError('Giriş bilgileri hatalı. Lütfen e-posta ve şifrenizi kontrol ediniz.');
            }
        } catch (e: any) {
            setError('Beklenmeyen bir hata oluştu. Lütfen tekrar deneyiniz.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 animate-in fade-in duration-700">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center space-y-2">
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/30 ring-4 ring-white">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Tedarikçi Portalı</h1>
                    <p className="text-slate-500 font-medium">SatınalmaPRO'ya hoş geldiniz.</p>
                </div>

                <Card className="p-8 shadow-2xl shadow-indigo-100 border-slate-200/60 bg-white/80 backdrop-blur-xl">
                    <form onSubmit={onSubmit} className="space-y-6">
                        <Input
                            label="Tedarikçi E-posta"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="tedarikci@firma.com"
                            autoComplete="email"
                            error={validationErrors.email}
                            className="h-12 rounded-xl"
                        />

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                Şifre
                            </label>
                            <div className="relative group">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className={`
                    flex h-12 w-full rounded-xl border border-slate-200 bg-white px-4 pr-12
                    text-slate-700 font-semibold placeholder:text-slate-300
                    hover:border-indigo-300 transition-all focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500
                    ${validationErrors.password ? "border-red-300 focus:ring-red-500/10" : ""}
                  `}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-indigo-600 transition-colors"
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
                            <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 font-bold animate-in slide-in-from-top-2">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            variant="primary"
                            fullWidth
                            size="lg"
                            loading={loading}
                            className="h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-200"
                        >
                            Portala Giriş Yap
                        </Button>
                    </form>
                </Card>

                <div className="flex flex-col items-center gap-6 mt-12">
                    <div className="flex gap-4 text-xs font-bold text-slate-400">
                        <a href="#" className="hover:text-indigo-600 transition-colors uppercase tracking-widest">Yardım</a>
                        <span className="text-slate-200">•</span>
                        <a href="#" className="hover:text-indigo-600 transition-colors uppercase tracking-widest">Güvenlik</a>
                    </div>
                    <p className="text-[11px] text-slate-300 font-medium">
                        © {new Date().getFullYear()} SatınalmaPRO Link. Tüm hakları saklıdır.
                    </p>
                </div>
            </div>
        </div>
    );
}
