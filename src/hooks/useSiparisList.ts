import { useFetch } from "@/lib/swr";

type SiparisListItem = {
    id: string;
    barcode: string;
    status: string;
    createdAt: string;
    estimatedDelivery?: string;
    supplier?: { name: string };
    totalAmount?: number;
};

type SiparisListResponse = {
    items: SiparisListItem[];
    total: number;
    totalPages: number;
};

/**
 * Sipariş listesi için SWR hook
 */
export function useSiparisList(params?: {
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

    const url = `/api/siparis?${searchParams.toString()}`;

    const { data, error, isLoading, isValidating, refresh } = useFetch<SiparisListResponse>(url);

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
