import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import Button from "../../src/components/ui/Button";

describe("Button", () => {
  it("renders primary variant", () => {
    const html = renderToString(<Button>Kaydet</Button>);
    expect(html).toMatch(/bg-primary/);
    expect(html).toMatch(/text-primary-foreground/);
  });

  it("renders outline variant and size sm", () => {
    const html = renderToString(<Button variant="outline" size="sm">Sil</Button>);
    expect(html).toMatch(/border/);
    expect(html).toMatch(/text-sm/);
  });

  it("sets aria attributes for loading and disabled", () => {
    const html = renderToString(<Button loading disabled>Yükleniyor</Button>);
    expect(html).toMatch(/aria-busy=\"true\"/);
    expect(html).toMatch(/aria-disabled=\"true\"/);
  });
});