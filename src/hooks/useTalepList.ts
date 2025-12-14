import { useFetch } from "@/lib/swr";

type TalepListItem = {
    id: string;
    barcode: string;
    subject: string;
    status: string;
    priority: string;
    createdAt: string;
    creator?: { username: string };
};

type TalepListResponse = {
    items: TalepListItem[];
    total: number;
    totalPages: number;
};

/**
 * Talep listesi için SWR hook
 * Cache'den anında veri gösterir, arka planda günceller
 */
export function useTalepList(params?: {
    page?: number;
    limit?: number;
    status?: string;
    q?: string;
}) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.limit) searchParams.set("limit", String(params.limit));
    if (params?.status) searchParams.set("status", params.status);
    if (params?.q) searchParams.set("q", params.q);

    const url = `/api/talep?${searchParams.toString()}`;

    const { data, error, isLoading, isValidating, refresh } = useFetch<TalepListResponse>(url);

    return {
        items: data?.items || [],
        total: data?.total || 0,
        totalPages: data?.totalPages || 0,
        error,
        isLoading,
        isValidating,
        refresh,
    };
}
