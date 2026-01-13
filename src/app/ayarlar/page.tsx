"use client";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect } from "react";

// Ayarlar sayfası artık admin panelinde
// Bu sayfa admin olmayanları admin paneline yönlendirir
export default function SettingsRedirectPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.replace("/login");
      return;
    }

    // Tüm kullanıcıları admin paneline yönlendir
    // Admin paneli kendi içinde yetki kontrolü yapacak
    router.replace("/admin");
  }, [session, status, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
        <p className="text-slate-600">Yönlendiriliyor...</p>
      </div>
    </div>
  );
}
