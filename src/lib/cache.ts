/**
 * Simple in-memory cache for API responses
 * Useful for frequently accessed, rarely changing data
 */

type CacheEntry<T> = {
    data: T;
    timestamp: number;
    expiresAt: number;
};

class APICache {
    private cache: Map<string, CacheEntry<any>> = new Map();
    private defaultTTL: number = 60 * 1000; // 1 minute default

    /**
     * Get cached data or fetch new data
     */
    async getOrFetch<T>(
        key: string,
        fetcher: () => Promise<T>,
        ttlMs?: number
    ): Promise<T> {
        const cached = this.cache.get(key);
        const now = Date.now();

        // Return cached data if valid
        if (cached && cached.expiresAt > now) {
            return cached.data as T;
        }

        // Fetch fresh data
        const data = await fetcher();

        // Store in cache
        this.cache.set(key, {
            data,
            timestamp: now,
            expiresAt: now + (ttlMs || this.defaultTTL)
        });

        return data;
    }

    /**
     * Manually set cache entry
     */
    set<T>(key: string, data: T, ttlMs?: number): void {
        const now = Date.now();
        this.cache.set(key, {
            data,
            timestamp: now,
            expiresAt: now + (ttlMs || this.defaultTTL)
        });
    }

    /**
     * Get cached data if exists and valid
     */
    get<T>(key: string): T | null {
        const cached = this.cache.get(key);
        if (cached && cached.expiresAt > Date.now()) {
            return cached.data as T;
        }
        return null;
    }

    /**
     * Invalidate specific cache key
     */
    invalidate(key: string): void {
        this.cache.delete(key);
    }

    /**
     * Invalidate cache keys matching a pattern
     */
    invalidatePattern(pattern: string): void {
        const regex = new RegExp(pattern);
        for (const key of this.cache.keys()) {
            if (regex.test(key)) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * Clear all cache
     */
    clear(): void {
        this.cache.clear();
    }

    /**
     * Get cache stats
     */
    stats(): { size: number; keys: string[] } {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
}

// Singleton instance
export const apiCache = new APICache();

// Pre-defined cache keys
export const CACHE_KEYS = {
    CATEGORIES: 'categories',
    CURRENCIES: 'currencies',
    UNITS: 'units',
    OPTIONS: 'options',
    DASHBOARD_STATS: 'dashboard_stats',
    SUPPLIERS_LIST: 'suppliers_list',
} as const;

// Pre-defined TTLs (in milliseconds)
export const CACHE_TTL = {
    SHORT: 30 * 1000,      // 30 seconds
    MEDIUM: 5 * 60 * 1000, // 5 minutes
    LONG: 30 * 60 * 1000,  // 30 minutes
    HOUR: 60 * 60 * 1000,  // 1 hour
} as const;
