import { describe, it, expect } from "vitest";

const BASE = process.env.TEST_BASE_URL || "http://localhost:3000";

describe("unauthorized access to protected API", () => {
  it("returns 401 for /api/options without auth", async () => {
    const res = await fetch(`${BASE}/api/options`, {
      headers: { Accept: "application/json" },
      method: "GET",
    });
    expect(res.status).toBe(401);
  });

  it("returns 401 for /api/check-barcode without auth", async () => {
    const url = new URL(`${BASE}/api/check-barcode`);
    url.searchParams.set("barcode", "ABC123");
    const res = await fetch(url, { method: "GET" });
    expect(res.status).toBe(401);
  });
});