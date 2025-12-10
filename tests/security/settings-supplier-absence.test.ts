import { readFileSync } from "fs";
import { describe, it, expect } from "vitest";

describe("Ayarlar UI: Tedarikçi kategorisi mevcut", () => {
  it("ayarlar/page.tsx içinde { key: \"tedarikci\" } bulunuyor", () => {
    const path = "src/app/ayarlar/page.tsx";
    const content = readFileSync(path, "utf-8");
    expect(content).toMatch(/\{\s*key:\s*"tedarikci"\s*,\s*name:\s*"Tedarikçi"\s*\}/);
  });

  it("options yüklemesinde tedarikci state'e ekleniyor", () => {
    const path = "src/app/ayarlar/page.tsx";
    const content = readFileSync(path, "utf-8");
    expect(content).toMatch(/tedarikci:\s*toItems\(data\.tedarikci\)/);
  });
});

describe("Sidebar: Tedarikçi menüleri mevcut", () => {
  it("Sidebar’da tedarikçi bağlantıları var", () => {
    const path = "src/components/Sidebar.tsx";
    const content = readFileSync(path, "utf-8");
    expect(content).toMatch(/href:\s*"\/tedarikci\//);
  });
});