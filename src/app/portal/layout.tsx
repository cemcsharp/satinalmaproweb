"use client";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Button from "@/components/ui/Button";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (status === "unauthenticated" && pathname !== "/portal/login") {
            router.replace("/portal/login");
        }
    }, [status, pathname, router]);

    if (status === "loading") {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (pathname === "/portal/login") {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Supplier Portal Header */}
            <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/portal/dashboard" className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <div>
                            <span className="text-lg font-bold text-slate-900 block leading-none">Tedarikçi Portalı</span>
                            <span className="text-xs text-slate-500 font-medium tracking-tight">SatınalmaPRO Link</span>
                        </div>
                    </Link>

                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex flex-col text-right">
                            <span className="text-sm font-semibold text-slate-700 leading-none">{session?.user?.name || "Tedarikçi"}</span>
                            <span className="text-xs text-slate-400 mt-1">Yetkili</span>
                        </div>
                        <div className="h-8 w-[1px] bg-slate-200 hidden sm:block mx-2" />
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => signOut({ callbackUrl: "/login" })}
                        >
                            Çıkış Yap
                        </Button>
                    </div>
                </div>
            </header>

            {/* Portal Content */}
            <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8">
                {children}
            </main>

            {/* Simple Footer */}
            <footer className="py-6 border-t border-slate-200 bg-white">
                <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-400 text-xs">
                    <p>© {new Date().getFullYear()} SatınalmaPRO - Tüm hakları saklıdır.</p>
                    <div className="flex gap-6">
                        <a href="#" className="hover:text-slate-600">Yardım Merkezi</a>
                        <a href="#" className="hover:text-slate-600">Güvenlik</a>
                        <a href="#" className="hover:text-slate-600">İletişim</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
