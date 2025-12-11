import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkRateLimit, RATE_LIMIT_CONFIGS } from "../../src/lib/rateLimit";

describe("Rate Limiter", () => {
    beforeEach(() => {
        // Reset rate limit store between tests by using unique identifiers
    });

    it("allows first request", () => {
        const result = checkRateLimit("test-user-1@email.com", "login");
        expect(result.limited).toBe(false);
        expect(result.remaining).toBe(RATE_LIMIT_CONFIGS.login.maxRequests - 1);
    });

    it("tracks request count", () => {
        const email = "test-user-2@email.com";

        // First 4 requests should be allowed
        for (let i = 0; i < 4; i++) {
            const result = checkRateLimit(email, "login");
            expect(result.limited).toBe(false);
        }

        // 5th request should still be allowed (limit is 5)
        const fifthResult = checkRateLimit(email, "login");
        expect(fifthResult.limited).toBe(false);
        expect(fifthResult.remaining).toBe(0);
    });

    it("blocks after exceeding limit", () => {
        const email = "test-user-3@email.com";

        // Use up all 5 attempts
        for (let i = 0; i < 5; i++) {
            checkRateLimit(email, "login");
        }

        // 6th request should be blocked
        const result = checkRateLimit(email, "login");
        expect(result.limited).toBe(true);
        expect(result.remaining).toBe(0);
        expect(result.resetIn).toBeGreaterThan(0);
    });

    it("uses different limits for different endpoints", () => {
        const id = "test-user-4";

        // API endpoint has higher limit (100)
        const apiResult = checkRateLimit(id, "api");
        expect(apiResult.remaining).toBe(RATE_LIMIT_CONFIGS.api.maxRequests - 1);

        // Sensitive endpoint has lower limit (10)
        const sensitiveResult = checkRateLimit(id + "-sensitive", "sensitive");
        expect(sensitiveResult.remaining).toBe(RATE_LIMIT_CONFIGS.sensitive.maxRequests - 1);
    });

    it("isolates rate limits by identifier", () => {
        const email1 = "user-a@email.com";
        const email2 = "user-b@email.com";

        // Use up all attempts for user A
        for (let i = 0; i < 5; i++) {
            checkRateLimit(email1, "login");
        }

        // User B should still have attempts
        const result = checkRateLimit(email2, "login");
        expect(result.limited).toBe(false);
        expect(result.remaining).toBe(RATE_LIMIT_CONFIGS.login.maxRequests - 1);
    });
});
