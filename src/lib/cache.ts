/**
 * Simple In-Memory Cache Utility
 * Provides TTL-based caching for server-side operations.
 */

type CacheEntry<T> = {
    value: T;
    expiresAt: number;
};

class SimpleCache {
    private cache: Map<string, CacheEntry<any>> = new Map();
    private defaultTtl: number;

    constructor(defaultTtlSeconds: number = 300) {
        this.defaultTtl = defaultTtlSeconds * 1000;
    }

    /**
     * Get a value from the cache
     */
    get<T>(key: string): T | null {
        const entry = this.cache.get(key);
        if (!entry) return null;

        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        return entry.value as T;
    }

    /**
     * Set a value in the cache
     */
    set<T>(key: string, value: T, ttlSeconds?: number): void {
        const ttl = (ttlSeconds !== undefined ? ttlSeconds * 1000 : this.defaultTtl);
        this.cache.set(key, {
            value,
            expiresAt: Date.now() + ttl,
        });
    }

    /**
     * Remove a value from the cache
     */
    delete(key: string): void {
        this.cache.delete(key);
    }

    /**
     * Clear all values that match a prefix
     */
    invalidatePrefix(prefix: string): void {
        for (const key of this.cache.keys()) {
            if (key.startsWith(prefix)) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * Clear the entire cache
     */
    clear(): void {
        this.cache.clear();
    }
}

// Global instance for the application
// In Next.js dev mode, this might be recreated on HMR, but in production it persists.
export const apiCache = new SimpleCache(600); // Default 10 minutes
