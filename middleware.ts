import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { isProtectedPath } from "@/lib/routeProtection";
import { prisma } from "@/lib/db";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/login") || pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (pathname.startsWith("/api/")) {
    // Public API exceptions (read-only or specific functional)
    if (
      (req.method === "GET" && (
        pathname.startsWith("/api/talep/") || pathname === "/api/talep" ||
        pathname.startsWith("/api/siparis/") || pathname === "/api/siparis" ||
        pathname.startsWith("/api/tedarikci/sorular") ||
        pathname.startsWith("/api/teslimat/public") ||
        pathname.startsWith("/api/ayarlar/puanlama-tipleri") ||
        pathname === "/api/options"
      )) ||
      (req.method === "POST" && (pathname === "/api/tedarikci/degerlendirme" || pathname === "/api/teslimat/public"))
    ) {
      return NextResponse.next();
    }
    if (!token) {
      return NextResponse.json({ error: "unauthorized", code: "unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  // Allow public access to evaluation page
  if (pathname === "/tedarikci/degerlendirme") {
    return NextResponse.next();
  }

  if (isProtectedPath(pathname) && !token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // RBAC for /ayarlar handled in server layout; middleware only enforces authentication
  // Note: Page-level access control is now handled by permissions, not hardcoded paths
  // The Sidebar filters menu items based on user permissions from their role

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

export const runtime = "nodejs";
