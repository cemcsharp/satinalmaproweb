/**
 * Simple in-memory rate limiter for API endpoints
 * Uses a Map to track request counts per IP/Identifier
 */

type RateLimitEntry = {
    count: number;
    resetTime: number;
    blockedUntil?: number;
};

// In-memory store (resets on server restart)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Default configs
export const RATE_LIMIT_CONFIGS = {
    login: { windowMs: 15 * 60 * 1000, maxRequests: 5, blockDurationMs: 30 * 60 * 1000 },
    api: { windowMs: 60 * 1000, maxRequests: 100 },
    sensitive: { windowMs: 60 * 1000, maxRequests: 10 },
} as const;

// Cleanup old entries periodically
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        const now = Date.now();
        for (const [key, entry] of rateLimitStore.entries()) {
            if (now > entry.resetTime && (!entry.blockedUntil || now > entry.blockedUntil)) {
                rateLimitStore.delete(key);
            }
        }
    }, 5 * 60 * 1000);
}

/**
 * Check if a request should be rate limited
 */
export function checkRateLimit(
    identifier: string,
    endpoint: keyof typeof RATE_LIMIT_CONFIGS = "api"
): { limited: boolean; remaining: number; resetIn: number } {
    const config = RATE_LIMIT_CONFIGS[endpoint];
    const key = `${endpoint}:${identifier}`;
    const now = Date.now();

    const entry = rateLimitStore.get(key);

    // Check if blocked
    if (entry?.blockedUntil && now < entry.blockedUntil) {
        return { limited: true, remaining: 0, resetIn: entry.blockedUntil - now };
    }

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

/**
 * Specialized methods for Login Brute-Force Protection
 */
export const loginLimiter = {
    isBlocked(identifier: string): boolean {
        const entry = rateLimitStore.get(`login:${identifier}`);
        if (!entry?.blockedUntil) return false;
        if (Date.now() < entry.blockedUntil) return true;

        // Block expired
        rateLimitStore.delete(`login:${identifier}`);
        return false;
    },

    getBlockTimeRemaining(identifier: string): number {
        const entry = rateLimitStore.get(`login:${identifier}`);
        if (!entry || !entry.blockedUntil) return 0;
        return Math.max(0, entry.blockedUntil - Date.now());
    },

    getRemainingAttempts(identifier: string): number {
        const entry = rateLimitStore.get(`login:${identifier}`);
        const config = RATE_LIMIT_CONFIGS.login;
        if (!entry || Date.now() > entry.resetTime) return config.maxRequests;
        return Math.max(0, config.maxRequests - entry.count);
    },

    recordAttempt(identifier: string, success: boolean) {
        const key = `login:${identifier}`;
        const config = RATE_LIMIT_CONFIGS.login;
        const now = Date.now();
        let entry = rateLimitStore.get(key);

        if (success) {
            rateLimitStore.delete(key);
            return { blocked: false, remainingAttempts: config.maxRequests };
        }

        if (!entry || now > entry.resetTime) {
            entry = { count: 1, resetTime: now + config.windowMs };
        } else {
            entry.count++;
        }

        let blocked = false;
        if (entry.count >= config.maxRequests) {
            entry.blockedUntil = now + config.blockDurationMs;
            blocked = true;
        }

        rateLimitStore.set(key, entry);
        return {
            blocked,
            remainingAttempts: Math.max(0, config.maxRequests - entry.count),
            blockDuration: blocked ? config.blockDurationMs : undefined
        };
    }
};

/**
 * Get client IP from request headers
 */
export function getClientIp(req: Request): string {
    const forwarded = req.headers.get("x-forwarded-for");
    if (forwarded) return forwarded.split(",")[0].trim();
    const real = req.headers.get("x-real-ip");
    if (real) return real;
    return "unknown";
}
