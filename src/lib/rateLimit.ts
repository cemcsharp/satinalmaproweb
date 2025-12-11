/**
 * Simple in-memory rate limiter for API endpoints
 * Uses a Map to track request counts per IP
 */

type RateLimitConfig = {
    windowMs: number;     // Time window in milliseconds
    maxRequests: number;  // Max requests per window
};

type RateLimitEntry = {
    count: number;
    resetTime: number;
};

// In-memory store (resets on server restart)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        const now = Date.now();
        for (const [key, entry] of rateLimitStore.entries()) {
            if (now > entry.resetTime) {
                rateLimitStore.delete(key);
            }
        }
    }, 5 * 60 * 1000);
}

// Default configs for different endpoints
export const RATE_LIMIT_CONFIGS = {
    login: { windowMs: 15 * 60 * 1000, maxRequests: 5 },      // 5 attempts per 15 min
    api: { windowMs: 60 * 1000, maxRequests: 100 },           // 100 requests per minute
    sensitive: { windowMs: 60 * 1000, maxRequests: 10 },      // 10 requests per minute
} as const;

/**
 * Check if a request should be rate limited
 * @param identifier - Usually IP address or user ID
 * @param endpoint - Endpoint name for config lookup
 * @returns { limited: boolean, remaining: number, resetIn: number }
 */
export function checkRateLimit(
    identifier: string,
    endpoint: keyof typeof RATE_LIMIT_CONFIGS
): { limited: boolean; remaining: number; resetIn: number } {
    const config = RATE_LIMIT_CONFIGS[endpoint];
    const key = `${endpoint}:${identifier}`;
    const now = Date.now();

    const entry = rateLimitStore.get(key);

    if (!entry || now > entry.resetTime) {
        // New window
        rateLimitStore.set(key, {
            count: 1,
            resetTime: now + config.windowMs,
        });
        return { limited: false, remaining: config.maxRequests - 1, resetIn: config.windowMs };
    }

    if (entry.count >= config.maxRequests) {
        // Rate limited
        return { limited: true, remaining: 0, resetIn: entry.resetTime - now };
    }

    // Increment count
    entry.count++;
    rateLimitStore.set(key, entry);

    return {
        limited: false,
        remaining: config.maxRequests - entry.count,
        resetIn: entry.resetTime - now,
    };
}

/**
 * Get client IP from request headers
 */
export function getClientIp(req: Request): string {
    const forwarded = req.headers.get("x-forwarded-for");
    if (forwarded) {
        return forwarded.split(",")[0].trim();
    }
    const real = req.headers.get("x-real-ip");
    if (real) return real;
    return "unknown";
}

/**
 * Create rate limit error response
 */
export function rateLimitResponse(resetIn: number) {
    return new Response(
        JSON.stringify({
            error: "too_many_requests",
            message: "Çok fazla istek gönderdiniz. Lütfen bekleyin.",
            retryAfter: Math.ceil(resetIn / 1000),
        }),
        {
            status: 429,
            headers: {
                "Content-Type": "application/json",
                "Retry-After": String(Math.ceil(resetIn / 1000)),
            },
        }
    );
}
