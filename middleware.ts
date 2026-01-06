import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { isProtectedPath } from "@/lib/routeProtection";

// In-memory rate limit store (resets on server restart)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limit configurations
const RATE_LIMITS = {
  login: { windowMs: 15 * 60 * 1000, maxRequests: 5 },     // 5 per 15 min
  sensitive: { windowMs: 60 * 1000, maxRequests: 10 },     // 10 per min
  api: { windowMs: 60 * 1000, maxRequests: 100 },          // 100 per min
};

// Sensitive endpoints that need stricter limits
const SENSITIVE_ENDPOINTS = [
  "/api/kullanicilar",
  "/api/roller",
  "/api/ayarlar",
];

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

function checkRateLimit(ip: string, endpoint: string): { limited: boolean; remaining: number; resetIn: number } {
  // Determine rate limit config
  let config = RATE_LIMITS.api;
  if (endpoint.includes("/api/auth/callback")) {
    config = RATE_LIMITS.login;
  } else if (SENSITIVE_ENDPOINTS.some(e => endpoint.startsWith(e))) {
    config = RATE_LIMITS.sensitive;
  }

  const key = `${endpoint.split("/").slice(0, 3).join("/")}:${ip}`;
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + config.windowMs });
    return { limited: false, remaining: config.maxRequests - 1, resetIn: config.windowMs };
  }

  if (entry.count >= config.maxRequests) {
    return { limited: true, remaining: 0, resetIn: entry.resetTime - now };
  }

  entry.count++;
  rateLimitStore.set(key, entry);
  return { limited: false, remaining: config.maxRequests - entry.count, resetIn: entry.resetTime - now };
}

// Cleanup old entries every 5 minutes
if (typeof globalThis !== 'undefined') {
  const cleanup = () => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (now > entry.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  };
  // Only set interval in Node.js runtime
  if (typeof setInterval !== 'undefined') {
    setInterval(cleanup, 5 * 60 * 1000);
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip rate limiting for login page and ALL auth endpoints
  if (pathname.startsWith("/login") || pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Rate limiting for API routes
  if (pathname.startsWith("/api/")) {
    const ip = getClientIp(req);
    const { limited, remaining, resetIn } = checkRateLimit(ip, pathname);

    if (limited) {
      return NextResponse.json(
        {
          error: true,
          code: "RATE_LIMIT_EXCEEDED",
          message: "Çok fazla istek gönderdiniz. Lütfen bekleyin.",
          retryAfter: Math.ceil(resetIn / 1000),
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(resetIn / 1000)),
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }

    // Check authentication
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    // Skip auth for public endpoints
    if (pathname.startsWith("/api/portal") || pathname.startsWith("/api/auth") || pathname.startsWith("/api/upload")) {
      const response = NextResponse.next();
      response.headers.set("X-RateLimit-Remaining", String(remaining));
      return response;
    }

    if (!token) {
      return NextResponse.json(
        { error: true, code: "UNAUTHORIZED", message: "Oturum açmanız gerekiyor" },
        { status: 401 }
      );
    }

    const response = NextResponse.next();
    response.headers.set("X-RateLimit-Remaining", String(remaining));
    return response;
  }

  // All page routes require authentication
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (isProtectedPath(pathname) && !token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
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
    // Exclude NextAuth and public endpoints from middleware
    "/api/((?!auth|portal|upload).*)",
  ],
};

export const runtime = "nodejs";
