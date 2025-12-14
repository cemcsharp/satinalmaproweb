import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple in-memory rate limiter
// Note: For production with multiple servers, use Redis
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Cleanup old entries every 10 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of rateLimitMap.entries()) {
        if (now > value.resetTime) {
            rateLimitMap.delete(key);
        }
    }
}, 10 * 60 * 1000);

export interface RateLimitOptions {
    windowMs: number; // Time window in milliseconds
    max: number; // Max requests per window
    message?: string;
}

/**
 * Simple rate limiting middleware
 * @param req - Next.js request object
 * @param options - Rate limit configuration
 * @returns NextResponse with 429 status if rate limit exceeded, null otherwise
 */
export function rateLimit(
    req: NextRequest,
    options: RateLimitOptions
): NextResponse | null {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
    const identifier = `${ip}:${req.nextUrl.pathname}`;
    const now = Date.now();

    const data = rateLimitMap.get(identifier);

    // No previous requests or window expired
    if (!data || now > data.resetTime) {
        rateLimitMap.set(identifier, {
            count: 1,
            resetTime: now + options.windowMs
        });
        return null; // OK
    }

    // Rate limit exceeded
    if (data.count >= options.max) {
        const retryAfter = Math.ceil((data.resetTime - now) / 1000);
        return NextResponse.json(
            {
                error: options.message || 'Too many requests, please try again later',
                code: 'RATE_LIMIT_EXCEEDED',
                retryAfter
            },
            {
                status: 429,
                headers: {
                    'Retry-After': String(retryAfter)
                }
            }
        );
    }

    // Increment counter
    data.count++;
    return null; // OK
}

/**
 * Predefined rate limiters for common use cases
 */
export const RateLimiters = {
    /**
     * Login attempts: 5 requests per 15 minutes
     */
    login: (req: NextRequest) => rateLimit(req, {
        windowMs: 15 * 60 * 1000,
        max: 5,
        message: 'Çok fazla giriş denemesi. Lütfen 15 dakika sonra tekrar deneyin.'
    }),

    /**
     * API calls: 100 requests per minute
     */
    api: (req: NextRequest) => rateLimit(req, {
        windowMs: 60 * 1000,
        max: 100,
        message: 'API rate limit exceeded'
    }),

    /**
     * Email sending: 10 requests per hour
     */
    email: (req: NextRequest) => rateLimit(req, {
        windowMs: 60 * 60 * 1000,
        max: 10,
        message: 'E-posta gönderim limiti aşıldı. Lütfen 1 saat sonra tekrar deneyin.'
    })
};
