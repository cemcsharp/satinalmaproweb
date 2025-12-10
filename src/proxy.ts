import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { isProtectedPath } from "@/lib/routeProtection";
import { prisma } from "@/lib/db";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Skip middleware for login page and auth-related API routes
  if (pathname.startsWith("/login") || pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Check if user is authenticated
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  
  // API'ler: her zaman korumalı (auth olmadığında 401)
  if (pathname.startsWith("/api/")) {
    if (!token) {
      return NextResponse.json({ error: "unauthorized", code: "unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  // Sayfalar: yalnızca korumalı prefix'ler için kontrol et
  if (isProtectedPath(pathname) && !token) {
    // API routes should return 401 JSON; pages should redirect to login
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // RBAC: Ayarlar sayfaları yalnızca admin
  if (pathname.startsWith("/ayarlar")) {
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    let role = (token as any)?.role as string | undefined;
    if (!role) {
      try {
        const userId = (token as any)?.userId || (token as any)?.sub || null;
        const email = (token as any)?.email || null;
        let me = null as any;
        if (userId) me = await prisma.user.findUnique({ where: { id: String(userId) } }).catch(() => null);
        else if (email) me = await prisma.user.findUnique({ where: { email: String(email) } }).catch(() => null);
        if (me) {
          role = (me as any)?.role;
          if (!role) {
            const rid = (me as any)?.roleId as string | undefined;
            if (rid) {
              const r = await (prisma as any).role.findUnique({ where: { id: String(rid) } }).catch(() => null);
              if (r && (r as any).key) role = String((r as any).key);
            }
          }
          if (!role) {
            const isAdminEmail = String(me?.email || "").toLowerCase() === "admin@sirket.com";
            role = (me?.username === "admin" || isAdminEmail) ? "admin" : "user";
          }
        }
      } catch {}
    }
    if (role !== "admin") {
      const url = req.nextUrl.clone();
      url.pathname = "/401";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/raporlama/:path*",
    "/talep/:path*",
    "/siparis/:path*",
    "/sozlesme/:path*",
    "/fatura/:path*",
    "/tedarikci/:path*",
    "/ayarlar/:path*",
    "/profile",
    "/api/:path*",
  ],
};
