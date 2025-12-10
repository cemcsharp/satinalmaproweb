export type WithholdingRule = {
  id: string;
  code: string; // e.g., "2/10", "7/10"
  label: string;
  vatRate: number; // e.g., 18
  percent: number; // 0..1 (e.g., 0.7 for 7/10)
  applicability?: "all" | "goods" | "service";
  group?: string; // kategori (ör. "Yapım işleri", "Danışmanlık")
  applicableVatRates?: number[]; // hangi KDV oranları ile kullanılabilir
};

export type InvoiceItemInput = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  taxRate: number; // VAT rate in %
  applyWithholding?: boolean;
};

export type WithholdingCalculation = {
  subtotal: number; // sum of item totals without VAT
  vatTotal: number; // total VAT (sum of item VAT)
  withheldVat: number; // portion of VAT withheld (tevkifat)
  payableVat: number; // VAT payable to supplier = vatTotal - withheldVat
  grossTotal: number; // subtotal + vatTotal
  netPayableTotal: number; // subtotal + payableVat
};

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function calculateWithholding(items: InvoiceItemInput[], rule?: WithholdingRule | null): WithholdingCalculation {
  const subtotal = round2(items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0));
  const vatTotal = round2(
    items.reduce((sum, it) => {
      const line = it.quantity * it.unitPrice;
      const vat = line * (it.taxRate / 100);
      return sum + vat;
    }, 0)
  );

  if (!rule) {
    const grossTotal = round2(subtotal + vatTotal);
    return {
      subtotal,
      vatTotal,
      withheldVat: 0,
      payableVat: vatTotal,
      grossTotal,
      netPayableTotal: round2(subtotal + vatTotal),
    };
  }

  const percent = Math.max(0, Math.min(1, rule.percent));
  const withheldVat = round2(
    items.reduce((sum, it) => {
      if (!it.applyWithholding) return sum;
      // Default applicability check can be extended by item categories
      const lineVat = it.quantity * it.unitPrice * (it.taxRate / 100);
      // Match item tax rate either by explicit vatRate or applicableVatRates
      const vatRateMatches = Array.isArray(rule.applicableVatRates)
        ? rule.applicableVatRates.includes(it.taxRate)
        : (!rule.vatRate || Math.abs(rule.vatRate - it.taxRate) < 0.0001);
      if (!vatRateMatches) return sum;
      return sum + lineVat * percent;
    }, 0)
  );

  const payableVat = round2(vatTotal - withheldVat);
  const grossTotal = round2(subtotal + vatTotal);
  const netPayableTotal = round2(subtotal + payableVat);

  return { subtotal, vatTotal, withheldVat, payableVat, grossTotal, netPayableTotal };
}