"use client";
import { useState, useCallback } from "react";
import { useToast } from "@/components/ui/Toast";
import { handleApiError, ApiError } from "@/lib/errorHandler";

/**
 * API request configuration
 */
type RequestConfig<T> = {
    /** API endpoint URL */
    url: string;
    /** HTTP method */
    method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    /** Request body (will be JSON.stringify'd) */
    body?: any;
    /** Custom headers */
    headers?: Record<string, string>;
    /** Success callback */
    onSuccess?: (data: T) => void;
    /** Error callback */
    onError?: (error: ApiError) => void;
    /** Show toast on success */
    successMessage?: string;
    /** Show toast on error (default: true) */
    showErrorToast?: boolean;
    /** Number of retries on failure (default: 0) */
    retries?: number;
};

/**
 * API request state
 */
type RequestState<T> = {
    data: T | null;
    loading: boolean;
    error: ApiError | null;
};

/**
 * useApiRequest - Generic hook for API requests
 * 
 * @example
 * ```tsx
 * const { execute, data, loading, error } = useApiRequest<User[]>();
 * 
 * useEffect(() => {
 *   execute({ url: "/api/users" });
 * }, []);
 * ```
 */
export function useApiRequest<T = any>() {
    const { show } = useToast();
    const [state, setState] = useState<RequestState<T>>({
        data: null,
        loading: false,
        error: null,
    });

    const execute = useCallback(async (config: RequestConfig<T>): Promise<T | null> => {
        const {
            url,
            method = "GET",
            body,
            headers = {},
            onSuccess,
            onError,
            successMessage,
            showErrorToast = true,
            retries = 0,
        } = config;

        setState(prev => ({ ...prev, loading: true, error: null }));

        let lastError: ApiError | null = null;
        let attempts = 0;

        while (attempts <= retries) {
            try {
                const response = await fetch(url, {
                    method,
                    headers: {
                        "Content-Type": "application/json",
                        ...headers,
                    },
                    ...(body && { body: JSON.stringify(body) }),
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new ApiError(
                        errorData.message || `HTTP ${response.status}`,
                        response.status,
                        errorData.code
                    );
                }

                const data = await response.json();

                setState({ data, loading: false, error: null });

                if (successMessage) {
                    show({ title: successMessage, variant: "success" });
                }

                if (onSuccess) {
                    onSuccess(data);
                }

                return data;
            } catch (err: any) {
                lastError = handleApiError(err);
                attempts++;

                if (attempts <= retries) {
                    // Wait before retry (exponential backoff)
                    await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
                }
            }
        }

        // All retries failed
        setState({ data: null, loading: false, error: lastError });

        if (showErrorToast && lastError) {
            show({
                title: "Hata",
                description: lastError.message,
                variant: "error",
            });
        }

        if (onError && lastError) {
            onError(lastError);
        }

        return null;
    }, [show]);

    const reset = useCallback(() => {
        setState({ data: null, loading: false, error: null });
    }, []);

    return {
        ...state,
        execute,
        reset,
    };
}

/**
 * useLazyApiRequest - Hook that doesn't execute immediately
 * Useful for form submissions, mutations, etc.
 */
export function useLazyApiRequest<T = any>() {
    return useApiRequest<T>();
}

/**
 * useApiMutation - Convenience hook for POST/PUT/DELETE operations
 */
export function useApiMutation<T = any, B = any>(
    url: string,
    method: "POST" | "PUT" | "DELETE" | "PATCH" = "POST"
) {
    const { execute, ...rest } = useApiRequest<T>();

    const mutate = useCallback(
        (body?: B, options?: Omit<RequestConfig<T>, "url" | "method" | "body">) => {
            return execute({ url, method, body, ...options });
        },
        [execute, url, method]
    );

    return { mutate, ...rest };
}
