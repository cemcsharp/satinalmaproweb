import { describe, it, expect } from "vitest";
import { isProtectedPath } from "../../src/lib/routeProtection";

describe("route protection predicate", () => {
  it("protects sensitive prefixes", () => {
    expect(isProtectedPath("/raporlama/dashboard")).toBe(true);
    expect(isProtectedPath("/talep/create")).toBe(true);
    expect(isProtectedPath("/ayarlar")).toBe(true);
    expect(isProtectedPath("/profile")).toBe(true);
  });

  it("does not protect login or public root", () => {
    expect(isProtectedPath("/login")).toBe(false);
    expect(isProtectedPath("/")).toBe(false);
  });
});