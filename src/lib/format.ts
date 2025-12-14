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

  // Remove spaces
  s = s.replace(/\s+/g, "");

  // Determine decimal separator
  const hasDot = s.includes(".");
  const hasComma = s.includes(",");

  if (hasDot || hasComma) {
    const lastDot = s.lastIndexOf(".");
    const lastComma = s.lastIndexOf(",");

    // Case 1: Both dot and comma → rightmost is decimal separator
    if (hasDot && hasComma) {
      const lastSep = Math.max(lastDot, lastComma);
      s = s
        .split("")
        .filter((ch, idx) => {
          if (ch === "," || ch === ".") {
            return idx === lastSep; // Keep only the last separator
          }
          return true;
        })
        .join("");
      // Normalize to dot
      s = s.replace(/,/, ".");
    }
    // Case 2: Only comma → it's the decimal separator (Turkish format)
    else if (hasComma) {
      s = s.replace(/,/, ".");
    }
    // Case 3: Only dot → could be thousands OR decimal
    // If dot appears only once and is followed by 1-2 digits, it's decimal
    // If dot appears multiple times or is followed by 3+ digits, it's thousands
    else if (hasDot) {
      const dotCount = (s.match(/\./g) || []).length;
      const afterDot = s.substring(lastDot + 1);

      if (dotCount === 1 && afterDot.length > 0 && afterDot.length <= 2) {
        // Single dot with 1-2 digits after → decimal separator
        // Do nothing, keep the dot
      } else {
        // Multiple dots or 3+ digits after → thousands separator
        s = s.replace(/\./g, "");
      }
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