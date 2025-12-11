/**
 * SWR-like fetch hook with caching and revalidation
 * Uses browser's Cache API for simple client-side caching
 */

type FetchState<T> = {
    data: T | null;
    error: Error | null;
    isLoading: boolean;
    isValidating: boolean;
};

type UseFetchOptions = {
    revalidateOnFocus?: boolean;
    revalidateOnReconnect?: boolean;
    refreshInterval?: number;
    dedupingInterval?: number;
};

// In-memory cache for deduplication
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5000; // 5 seconds

/**
 * Simple fetch wrapper with caching
 */
export async function cachedFetch<T>(
    url: string,
    options?: RequestInit,
    cacheDuration = CACHE_DURATION
): Promise<T> {
    const cacheKey = `${options?.method || 'GET'}:${url}`;
    const now = Date.now();

    // Check cache
    const cached = cache.get(cacheKey);
    if (cached && now - cached.timestamp < cacheDuration) {
        return cached.data as T;
    }

    // Fetch fresh data
    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Update cache
    cache.set(cacheKey, { data, timestamp: now });

    return data as T;
}

/**
 * Invalidate cache for a specific URL pattern
 */
export function invalidateCache(urlPattern?: string) {
    if (!urlPattern) {
        cache.clear();
        return;
    }

    for (const key of cache.keys()) {
        if (key.includes(urlPattern)) {
            cache.delete(key);
        }
    }
}

/**
 * Prefetch and cache data
 */
export async function prefetch<T>(url: string): Promise<void> {
    try {
        await cachedFetch<T>(url);
    } catch {
        // Silently fail prefetch
    }
}

/**
 * Batch multiple fetches with deduplication
 */
export async function batchFetch<T extends Record<string, string>>(
    urls: T
): Promise<{ [K in keyof T]: any }> {
    const results: Partial<{ [K in keyof T]: any }> = {};

    await Promise.all(
        Object.entries(urls).map(async ([key, url]) => {
            try {
                results[key as keyof T] = await cachedFetch(url);
            } catch (error) {
                results[key as keyof T] = null;
            }
        })
    );

    return results as { [K in keyof T]: any };
}
