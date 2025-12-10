"use client";
import React from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";

export default function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const didLogRef = React.useRef(false);

  React.useEffect(() => {
    if (status === "unauthenticated") {
      if (!didLogRef.current) {
        didLogRef.current = true;
        // Log unauthorized access attempt
        try {
          fetch("/api/logs/selection", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ event: "unauthorized_access", page: pathname, context: { via: "PrivateRoute" } }),
          }).catch(() => {});
        } catch {}
      }
      // Login'e yönlendir; redirect parametresi ile geri dönüş sağlanabilir
      const to = `/login?redirect=${encodeURIComponent(pathname)}`;
      router.replace(to);
    }
  }, [status, pathname, router]);

  if (status !== "authenticated") {
    // İçeriği bulanıklaştırıp yer tutucu göster; arka planda children render edilmez
    return (
      <div className="relative">
        <div className="animate-pulse space-y-3">
          <div className="h-6 w-40 rounded bg-muted" />
          <div className="h-4 w-64 rounded bg-muted" />
          <div className="h-24 w-full rounded bg-muted" />
        </div>
        <div className="absolute inset-0 backdrop-blur-sm bg-background/40 flex items-center justify-center">
          <span className="text-sm text-muted-foreground">İçerik için giriş yapınız…</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
