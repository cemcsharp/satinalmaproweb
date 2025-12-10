import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

describe("Raporlar açılır menüde tedarikçi seçeneği olmamalı", () => {
  it("raporlar/page.tsx içinde <option value=\"tedarikci\"> bulunmuyor", () => {
    const p = path.join(ROOT, "src", "app", "raporlama", "raporlar", "page.tsx");
    const content = fs.readFileSync(p, "utf-8");
    expect(content).not.toMatch(/<option\s+value=\"tedarikci\"/);
  });

  it("eski şablonlarda 'tedarikci' kaynak değeri güvenli biçimde 'all' olarak ele alınır", () => {
    const p = path.join(ROOT, "src", "app", "raporlama", "raporlar", "page.tsx");
    const content = fs.readFileSync(p, "utf-8");
    // Şablon yükleme kısmındaki güvenlik düşümü kontrolü
    expect(content).toMatch(/const\s+src\s*=\s*String\(cfg\.source\s*\?\?\s*\"all\"\)/);
    expect(content).toMatch(/setSource\(src\s*===\s*\"tedarikci\"\s*\?\s*\"all\"\s*:\s*src\)/);
  });
});

describe("Mevcut iş akışları bozulmadı", () => {
  it("Sidebar menüsünde tedarikçi modülü bağlantıları mevcut", () => {
    const p = path.join(ROOT, "src", "components", "Sidebar.tsx");
    const content = fs.readFileSync(p, "utf-8");
    expect(content).toMatch(/href:\s*\"\/tedarikci\/[a-z-]+\"/);
    expect(content).toMatch(/label:\s*\"Tedarikçi\"/);
  });

  it("Ayarlar sayfasında tedarikçi açılır seçenekleri doğrudan düzenlenemez (koruma yerinde)", () => {
    const p = path.join(ROOT, "src", "app", "ayarlar", "page.tsx");
    const content = fs.readFileSync(p, "utf-8");
    // Bu kategori Ayarlar'dan düzenlenemez uyarısı korumayı gösterir
    expect(content).toMatch(/\[\"tedarikci\",\s*\"firma\"\]\s*\.includes\(activeDropdownCat\)/);
  });
});