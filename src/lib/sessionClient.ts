import { fetchJsonWithRetry } from "@/lib/http";

export type SessionPayload = {
  user?: { id?: string; email?: string };
  expires?: string;
} | null;

/**
 * Ensure NextAuth session endpoint responds before navigation to avoid aborted fetches.
 */
export async function ensureSessionReady(): Promise<SessionPayload> {
  try {
    const payload = await fetchJsonWithRetry<SessionPayload>(
      "/api/auth/session",
      {
        method: "GET",
        headers: { Accept: "application/json" },
        credentials: "include",
        cache: "no-store",
      },
      {
        retries: 3,
        backoffMs: 300,
        maxBackoffMs: 1500,
        onErrorLog: ({ attempt, error }) => {
          console.warn(
            `[session] fetch attempt ${attempt} failed:`,
            error?.message || error
          );
        },
      }
    );
    return payload;
  } catch (e: any) {
    console.error("[session] ensureSessionReady error:", e?.message || e);
    return null;
  }
}