export type RetryOptions = {
  retries?: number;
  backoffMs?: number;
  maxBackoffMs?: number;
  onErrorLog?: (info: { attempt: number; error: any }) => void;
};

export async function fetchWithRetry(
  url: string,
  init?: RequestInit,
  opts: RetryOptions = {}
): Promise<Response> {
  const {
    retries = 3,
    backoffMs = 300,
    maxBackoffMs = 2000,
    onErrorLog,
  } = opts;

  let attempt = 0;
  let lastError: any = null;
  let delay = backoffMs;

  while (attempt <= retries) {
    try {
      // If caller provided a signal, respect it; otherwise create our own timeout-bound controller
      let res: Response;
      if (init?.signal) {
        res = await fetch(url, init);
      } else {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        res = await fetch(url, { ...(init || {}), signal: controller.signal });
        clearTimeout(timeout);
      }
      if (!res.ok && res.status >= 500 && attempt < retries) {
        // İşlevsel yeniden deneme için özel bir hata fırlatıyoruz
        throw new Error(`Transient server error ${res.status}`);
      }
      return res;
    } catch (error: any) {
      lastError = error;
      onErrorLog?.({ attempt, error });

      const isAbort = error?.name === "AbortError" || /aborted/i.test(String(error?.message));
      const isNetwork = error instanceof TypeError && /fetch/i.test(String(error?.message));
      const isServerTransient = /Transient server error/i.test(String(error?.message));

      // Yeniden deneme koşulları: abort, network veya sunucu 5xx (geçici)
      if (attempt >= retries) {
        break;
      }
      if (!(isAbort || isNetwork || isServerTransient)) {
        break;
      }

      await new Promise((r) => setTimeout(r, delay));
      delay = Math.min(delay * 2, maxBackoffMs);
      attempt += 1;
    }
  }

  throw lastError ?? new Error("fetchWithRetry failed without explicit error");
}

export async function fetchJsonWithRetry<T = any>(
  url: string,
  init?: RequestInit,
  opts?: RetryOptions
): Promise<T> {
  const res = await fetchWithRetry(url, init, opts);
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    throw new Error(`Unexpected content-type: ${ct}`);
  }
  const payload = await res.json();
  if (!res.ok) {
    const status = res.status;
    const reason = (payload && (payload.message || payload.error)) || res.statusText || "error";
    throw new Error(`${status} ${String(reason)}`);
  }
  return payload as T;
}