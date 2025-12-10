export const formatNumberTR = (value: number, fractionDigits: number = 2): string => {
  if (!Number.isFinite(value)) return "0,00";
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
};

export const formatCurrencyTR = (
  value: number,
  currencyLabel?: string,
  fractionDigits: number = 2
): string => {
  const num = formatNumberTR(value, fractionDigits);
  return currencyLabel ? `${num} ${currencyLabel}` : num;
};

// Parses a decimal string accepting both comma and dot as decimal separators.
// Also tolerates thousands separators (dot or space). Returns null if not a finite number.
export const parseDecimalFlexible = (input: string): number | null => {
  if (typeof input !== "string") return null;
  let s = input.trim();
  if (!s) return null;
  // Keep leading minus, strip spaces
  s = s.replace(/\s+/g, "");
  // Determine decimal separator as the rightmost of '.' or ','; others are thousands
  const hasDot = s.includes(".");
  const hasComma = s.includes(",");
  if (hasDot || hasComma) {
    const lastDot = s.lastIndexOf(".");
    const lastComma = s.lastIndexOf(",");
    let lastSep = Math.max(lastDot, lastComma);
    // If only dot exists (no comma), treat dot as thousands (TR preference)
    if (hasDot && !hasComma) {
      lastSep = -1; // no decimal separator, drop all dots
    }
    s = s
      .split("")
      .filter((ch, idx) => {
        if (ch === "," || ch === ".") {
          if (idx === lastSep && hasComma) return true; // keep decimal comma
          return false; // drop thousands or dots
        }
        return true;
      })
      .join("");
    if (hasComma) {
      // Normalize decimal to dot (keep only the last comma which we preserved)
      s = s.replace(/,/, ".");
    }
  }
  const num = Number(s);
  return Number.isFinite(num) ? num : null;
};

export const formatDateTR = (input: string | Date): string => {
  const d = typeof input === "string" ? new Date(input) : input;
  if (!(d instanceof Date) || isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("tr-TR");
};