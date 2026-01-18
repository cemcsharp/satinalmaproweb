"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";

export default function SifreSifirlaPage() {
    const router = useRouter();
    const { show } = useToast();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<"request" | "verify" | "reset">("request");
    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const handleRequestReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            show({ title: "Hata", description: "E-posta adresi giriniz", variant: "error" });
            return;
        }
        setLoading(true);
        try {
            const res = await fetch("/api/auth/sifre-sifirla", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, action: "request" }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "İstek gönderilemedi");
            }
            show({ title: "Başarılı", description: "Doğrulama kodu e-posta adresinize gönderildi", variant: "success" });
            setStep("verify");
        } catch (err: any) {
            show({ title: "Hata", description: err.message, variant: "error" });
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code) {
            show({ title: "Hata", description: "Doğrulama kodu giriniz", variant: "error" });
            return;
        }
        setLoading(true);
        try {
            const res = await fetch("/api/auth/sifre-sifirla", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, code, action: "verify" }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Kod doğrulanamadı");
            }
            show({ title: "Başarılı", description: "Kod doğrulandı, yeni şifrenizi belirleyin", variant: "success" });
            setStep("reset");
        } catch (err: any) {
            show({ title: "Hata", description: err.message, variant: "error" });
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPassword || !confirmPassword) {
            show({ title: "Hata", description: "Tüm alanları doldurunuz", variant: "error" });
            return;
        }
        if (newPassword !== confirmPassword) {
            show({ title: "Hata", description: "Şifreler eşleşmiyor", variant: "error" });
            return;
        }
        if (newPassword.length < 6) {
            show({ title: "Hata", description: "Şifre en az 6 karakter olmalıdır", variant: "error" });
            return;
        }
        setLoading(true);
        try {
            const res = await fetch("/api/auth/sifre-sifirla", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, code, newPassword, action: "reset" }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Şifre değiştirilemedi");
            }
            show({ title: "Başarılı", description: "Şifreniz başarıyla değiştirildi", variant: "success" });
            router.push("/login");
        } catch (err: any) {
            show({ title: "Hata", description: err.message, variant: "error" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
            <Card variant="glass" className="w-full max-w-md p-8">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800">Şifre Sıfırlama</h1>
                    <p className="text-sm text-slate-500 mt-2">
                        {step === "request" && "E-posta adresinizi girerek şifre sıfırlama işlemini başlatın."}
                        {step === "verify" && "E-postanıza gönderilen doğrulama kodunu girin."}
                        {step === "reset" && "Yeni şifrenizi belirleyin."}
                    </p>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    {["request", "verify", "reset"].map((s, i) => (
                        <div key={s} className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${step === s ? "bg-blue-600 text-white" :
                                    ["request", "verify", "reset"].indexOf(step) > i ? "bg-sky-500 text-white" :
                                        "bg-slate-200 text-slate-500"
                                }`}>
                                {["request", "verify", "reset"].indexOf(step) > i ? "✓" : i + 1}
                            </div>
                            {i < 2 && <div className={`w-12 h-1 mx-2 rounded ${["request", "verify", "reset"].indexOf(step) > i ? "bg-sky-500" : "bg-slate-200"}`} />}
                        </div>
                    ))}
                </div>

                {step === "request" && (
                    <form onSubmit={handleRequestReset} className="space-y-6">
                        <Input
                            label="E-posta Adresi"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="ornek@sirket.com"
                            autoFocus
                        />
                        <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white" disabled={loading}>
                            {loading ? "Gönderiliyor..." : "Sıfırlama Kodu Gönder"}
                        </Button>
                    </form>
                )}

                {step === "verify" && (
                    <form onSubmit={handleVerifyCode} className="space-y-6">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700 mb-4">
                            <strong>{email}</strong> adresine gönderilen 6 haneli kodu girin.
                        </div>
                        <Input
                            label="Doğrulama Kodu"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="123456"
                            maxLength={6}
                            autoFocus
                        />
                        <div className="flex gap-3">
                            <Button type="button" variant="outline" onClick={() => setStep("request")} className="flex-1">
                                Geri
                            </Button>
                            <Button type="submit" className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white" disabled={loading}>
                                {loading ? "Doğrulanıyor..." : "Doğrula"}
                            </Button>
                        </div>
                    </form>
                )}

                {step === "reset" && (
                    <form onSubmit={handleResetPassword} className="space-y-6">
                        <Input
                            label="Yeni Şifre"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="••••••••"
                            autoFocus
                        />
                        <Input
                            label="Yeni Şifre (Tekrar)"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                        <Button type="submit" className="w-full bg-gradient-to-r from-sky-600 to-teal-600 text-white" disabled={loading}>
                            {loading ? "Kaydediliyor..." : "Şifreyi Değiştir"}
                        </Button>
                    </form>
                )}

                <div className="mt-6 text-center">
                    <button onClick={() => router.push("/login")} className="text-sm text-blue-600 hover:underline">
                        Giriş sayfasına dön
                    </button>
                </div>
            </Card>
        </div>
    );
}
