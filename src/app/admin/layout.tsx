"use client";
import React from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";
import { SystemSettings, defaultSettings } from "@/lib/settings";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const [settings, setSettings] = React.useState<SystemSettings>(defaultSettings);

    useEffect(() => {
        fetch("/api/admin/settings")
            .then(res => res.json())
            .then(data => {
                if (data.ok && data.settings) {
                    setSettings(data.settings);
                }
            })
            .catch(console.error);
    }, []);
    const router = useRouter();
    const pathname = usePathname();

    const isLoginPage = pathname === "/admin/login";

    useEffect(() => {
        if (status === "loading" || isLoginPage) return;

        if (status === "unauthenticated") {
            router.replace("/admin/login");
            return;
        }

        // Sadece admin erişebilir
        if (session?.user?.role !== "admin") {
            router.replace("/");
            return;
        }
    }, [status, session, router, isLoginPage]);

    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
            </div>
        );
    }

    if (isLoginPage) {
        return <>{children}</>;
    }

    if (session?.user?.role !== "admin") {
        return null;
    }

    return (
        <div className="min-h-screen bg-slate-100">
            <div className="flex h-screen w-screen overflow-hidden">
                <AdminSidebar settings={settings} />
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    <header className="sticky top-0 z-30 backdrop-blur-xl bg-white/80 border-b border-slate-200/50">
                        <nav className="flex items-center justify-between h-16 px-6">
                            <div className="flex items-center gap-4">
                                <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                                    Sistem Yönetimi
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-medium text-slate-600">
                                    {session?.user?.email}
                                </span>
                                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full uppercase">
                                    Admin
                                </span>
                            </div>
                        </nav>
                    </header>
                    <main className="flex-1 p-6 md:p-8 overflow-y-auto">
                        {children}
                    </main>
                </div>
            </div>
        </div>
    );
}
