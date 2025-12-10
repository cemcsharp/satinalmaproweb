// Simple unit tests for number parsing and masking
import assert from "node:assert";

// Mirror of src/lib/format.ts parseDecimalFlexible
const parseDecimalFlexible = (input) => {
  if (typeof input !== "string") return null;
  let s = input.trim();
  if (!s) return null;
  s = s.replace(/\s+/g, "");
  const hasDot = s.includes(".");
  const hasComma = s.includes(",");
  if (hasDot || hasComma) {
    const lastDot = s.lastIndexOf(".");
    const lastComma = s.lastIndexOf(",");
    let lastSep = Math.max(lastDot, lastComma);
    if (hasDot && !hasComma) {
      lastSep = -1;
    }
    s = s
      .split("")
      .filter((ch, idx) => {
        if (ch === "," || ch === ".") {
          if (idx === lastSep && hasComma) return true;
          return false;
        }
        return true;
      })
      .join("");
    if (hasComma) {
      s = s.replace(/,/, ".");
    }
  }
  const num = Number(s);
  return Number.isFinite(num) ? num : null;
};

// Mirror of ItemsSection.tsx formatTRInput
const formatTRInput = (raw, maxDecimals = 2) => {
  if (typeof raw !== "string") return "";
  let s = raw.replace(/\s+/g, "");
  if (s.includes(".") && s.includes(",")) {
    s = s.replace(/\./g, "");
  } else if (s.includes(".")) {
    // single dot as thousands -> remove
    s = s.replace(/\./g, "");
  }
  s = s.replace(/[^0-9,]/g, "");
  const parts = s.split(",");
  const intPart = parts[0] || "";
  const decPart = (parts[1] || "").slice(0, Math.max(0, maxDecimals));
  const intDigits = intPart.replace(/\./g, "");
  const withThousands = intDigits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  if (decPart) return `${withThousands},${decPart}`;
  if (s.endsWith(",") && withThousands.length > 0) return `${withThousands},`;
  if (s.endsWith(",")) return "";
  return withThousands;
};

// parseDecimalFlexible tests
assert.strictEqual(parseDecimalFlexible("1.234,56"), 1234.56, "TR format should parse to number");
assert.strictEqual(parseDecimalFlexible("1,234.56"), 1234.56, "US format with both separators should parse to number");
assert.strictEqual(parseDecimalFlexible("1234,56"), 1234.56, "Comma as decimal should parse to number");
assert.strictEqual(parseDecimalFlexible("1.234"), 1234, "Thousands only should parse to integer");
assert.strictEqual(parseDecimalFlexible(""), null, "Empty string returns null");
assert.strictEqual(parseDecimalFlexible("abc"), null, "Invalid input returns null");

// formatTRInput tests
assert.strictEqual(formatTRInput("1234,56", 2), "1.234,56", "Mask should add thousands and keep comma decimals");
assert.strictEqual(formatTRInput("1000", 2), "1.000", "Mask should add thousands for integers");
assert.strictEqual(formatTRInput("1000000,1", 2), "1.000.000,1", "Mask should handle large numbers");
assert.strictEqual(formatTRInput("1.", 2), "1", "Single dot should be treated as thousands separator");
assert.strictEqual(formatTRInput(".", 2), "", "Single dot becomes empty");

console.log("All number-format tests passed.");