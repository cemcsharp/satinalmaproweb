type Primitive = string | number | boolean | null | undefined;
interface TemplateVars { [key: string]: Primitive | TemplateVars }

// Basit şablon motoru: {{key}} değişkenlerini metin içinde değiştirir.
// Örn: render("Sayın {{customerName}}", { customerName: "Firma A" })
export function render(template: string, vars: TemplateVars): string {
  if (!template) return "";
  return template.replace(/\{\{\s*([a-zA-Z0-9_\.]+)\s*\}\}/g, (_, key) => {
    const path = String(key).split(".");
    let val: any = vars;
    for (const p of path) {
      if (val == null) break;
      val = val[p];
    }
    if (val == null) return "";
    if (typeof val === "number") return new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2 }).format(val);
    return String(val);
  });
}

// Sözleşme ve fatura için örnek şablonlar
export const contractTemplates = {
  standart: "Sözleşme Tarafları: {{parties}}\nBaşlangıç: {{startDate}}\nBitiş: {{endDate}}\nSipariş: {{orderBarcode}}\nÖzet: {{summary}}",
  kurumsal: "Kurumsal Sözleşme\nTaraflar: {{parties}}\nDönem: {{startDate}} - {{endDate}}\nMetod: {{method}}\nToplam: {{orderTotal}} {{currency}}",
};

export const invoiceTemplates = {
  standart: "Fatura No: {{number}}\nSipariş No: {{orderNo}}\nTutar: {{amount}}\nVade: {{dueDate}}\nBanka: {{bank}}\n{{withholdingNote}}",
  kurumsal:
    "--- Kurumsal Fatura ---\n" +
    "Satıcı: {{supplier.name}} (Vergi No: {{supplier.taxId}})\n" +
    "Alıcı: {{customer.name}} (Vergi No: {{customer.taxId}})\n" +
    "Adres: {{customer.address}}\n" +
    "Fatura No: {{number}} | Tarih: {{date}} | Vade: {{dueDate}}\n" +
    "Sipariş No: {{orderNo}}\n" +
    "Toplam: {{amount}} TL\n" +
    "Banka: {{bank}}\n" +
    "Not: {{withholdingNote}}",
};

export type ContractRenderVars = {
  parties?: string;
  startDate?: string;
  endDate?: string;
  orderBarcode?: string;
  summary?: string;
  method?: string;
  orderTotal?: number;
  currency?: string;
};

export type InvoiceRenderVars = {
  number?: string;
  orderNo?: string;
  amount?: number;
  dueDate?: string;
  bank?: string;
  withholdingNote?: string;
  supplier?: { name?: string; taxId?: string };
  customer?: { name?: string; taxId?: string; address?: string };
};