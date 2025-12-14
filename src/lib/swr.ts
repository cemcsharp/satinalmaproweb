import useSWR, { SWRConfiguration, mutate } from "swr";

// Temel fetcher fonksiyonu
export const fetcher = async (url: string) => {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
        const error = new Error("API hatası");
        (error as any).status = res.status;
        throw error;
    }
    return res.json();
};

// Varsayılan SWR konfigürasyonu
export const defaultSWRConfig: SWRConfiguration = {
    fetcher,
    revalidateOnFocus: false,       // Tab değişiminde yeniden çekme
    revalidateOnReconnect: true,    // İnternet bağlantısı gelince yenile
    dedupingInterval: 5000,         // 5 saniye içinde aynı key tekrar çağrılmaz
    errorRetryCount: 2,             // Hata durumunda 2 kez dene
    errorRetryInterval: 3000,       // 3 saniye arayla
    shouldRetryOnError: true,
};

// Generic useFetch hook
export function useFetch<T>(url: string | null, options?: SWRConfiguration) {
    const { data, error, isLoading, isValidating, mutate: boundMutate } = useSWR<T>(
        url,
        fetcher,
        { ...defaultSWRConfig, ...options }
    );

    return {
        data,
        error,
        isLoading,
        isValidating,
        refresh: boundMutate,
    };
}

// Global mutate (keyed revalidation)
export { mutate };

// Liste türleri için revalidate yardımcıları
export const revalidateTalep = () => mutate((key) => typeof key === "string" && key.startsWith("/api/talep"));
export const revalidateSiparis = () => mutate((key) => typeof key === "string" && key.startsWith("/api/siparis"));
export const revalidateTedarikci = () => mutate((key) => typeof key === "string" && key.startsWith("/api/tedarikci"));
export const revalidateRfq = () => mutate((key) => typeof key === "string" && key.startsWith("/api/rfq"));
