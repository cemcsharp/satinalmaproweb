"use client";
import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";

export default function InviteAcceptPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = use(params);
    const router = useRouter();
    const { show } = useToast();

    const [invitation, setInvitation] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form states
    const [fullName, setFullName] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");

    useEffect(() => {
        const verifyToken = async () => {
            try {
                const res = await fetch(`/api/tenant/invite/${token}`);
                const data = await res.json();

                if (res.ok) {
                    setInvitation(data);
                } else {
                    show({ title: "Hata", description: data.error || "Geçersiz davetiye", variant: "error" });
                }
            } catch (error) {
                console.error(error);
                show({ title: "Hata", description: "Davetiye doğrulanırken bir hata oluştu", variant: "error" });
            } finally {
                setLoading(false);
            }
        };

        verifyToken();
    }, [token, show]);

    const handleAccept = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== passwordConfirm) {
            show({ title: "Hata", description: "Şifreler uyuşmuyor", variant: "error" });
            return;
        }

        if (password.length < 6) {
            show({ title: "Hata", description: "Şifre en az 6 karakter olmalıdır", variant: "error" });
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch(`/api/tenant/invite/${token}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fullName, password })
            });
            const data = await res.json();

            if (res.ok) {
                show({ title: "Başarılı", description: "Hesabınız oluşturuldu! Giriş yapabilirsiniz.", variant: "success" });
                router.push("/login");
            } else {
                show({ title: "Hata", description: data.error || "Hesap oluşturulamadı", variant: "error" });
            }
        } catch (error) {
            console.error(error);
            show({ title: "Hata", description: "Bir hata oluştu", variant: "error" });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
            </div>
        );
    }

    if (!invitation) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <Card variant="glass" className="max-w-md w-full text-center p-8">
                    <h1 className="text-2xl font-bold text-slate-800 mb-2">Geçersiz Davetiye</h1>
                    <p className="text-slate-600 mb-6">Bu davet linki geçersiz, süresi dolmuş veya zaten kullanılmış.</p>
                    <Button onClick={() => router.push("/")} className="w-full">Ana Sayfaya Dön</Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <Card variant="glass" className="max-w-md w-full p-8 space-y-6">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-slate-800">Daveti Kabul Et</h1>
                    <p className="text-sm text-slate-500 mt-2">
                        <strong>{invitation.tenant.name}</strong> firması sizi <strong>{invitation.role.name}</strong> olarak davet etti.
                    </p>
                </div>

                <form onSubmit={handleAccept} className="space-y-4">
                    <Input
                        label="E-posta"
                        value={invitation.email}
                        disabled
                    />
                    <Input
                        label="Ad Soyad"
                        placeholder="Ahmet Yılmaz"
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        required
                    />
                    <Input
                        label="Şifre"
                        type="password"
                        placeholder="••••••"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                    />
                    <Input
                        label="Şifre Tekrar"
                        type="password"
                        placeholder="••••••"
                        value={passwordConfirm}
                        onChange={e => setPasswordConfirm(e.target.value)}
                        required
                    />

                    <Button type="submit" className="w-full py-3" disabled={submitting}>
                        {submitting ? "Hesap Oluşturuluyor..." : "Hesabı Oluştur ve Katıl"}
                    </Button>
                </form>

                <p className="text-xs text-center text-slate-400">
                    Hesabınızı oluşturarak kullanım koşullarını ve KVKK metnini kabul etmiş sayılırsınız.
                </p>
            </Card>
        </div>
    );
}
