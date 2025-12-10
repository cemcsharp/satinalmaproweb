"use client";
import Button from "@/components/ui/Button";
import { useMemo, useState } from "react";
import { formatNumberTR, parseDecimalFlexible } from "@/lib/format";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";

export type Option = { id: string; label: string };
export type ProductRow = { id: string; name: string; quantity: number; unit: string; unitPrice: number; extraCosts: number };

type CatalogItem = { name: string; unitPrice: number; unitId: string };

type Props = {
  label?: string;
  addButtonLabel?: string;
  items: ProductRow[];
  onItemsChange: (next: ProductRow[]) => void;
  unitOptions: Option[];
  productCatalog?: CatalogItem[];
};

export default function ItemsSection({
  label = "Talep Edilen Ürünler",
  addButtonLabel = "Ürün Ekle",
  items,
  onItemsChange,
  unitOptions,
  productCatalog = [],
}: Props) {
  // Inline editing mask state per row/field
  const [editing, setEditing] = useState<Record<string, { quantity?: string; unitPrice?: string; extraCosts?: string }>>({});
  const [errors, setErrors] = useState<Record<string, { quantity?: string; unitPrice?: string; extraCosts?: string }>>({});

  const formatTRInput = (raw: string, maxDecimals: number): string => {
    if (typeof raw !== "string") return "";
    let s = raw.replace(/\s+/g, "");
    if (s.includes(".") && s.includes(",")) {
      s = s.replace(/\./g, "");
    } else if (s.includes(".")) {
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

  const lineTotals = useMemo(() => items.map((p) => (p.quantity || 0) * (p.unitPrice || 0) + (p.extraCosts || 0)), [items]);

  const addItem = () => {
    onItemsChange([
      ...items,
      { id: crypto.randomUUID(), name: "", quantity: 1, unit: unitOptions[0]?.id || "u1", unitPrice: 0, extraCosts: 0 },
    ]);
  };
  const removeItem = (id: string) => onItemsChange(items.filter((p) => p.id !== id));
  const updateItem = (id: string, patch: Partial<ProductRow>) => onItemsChange(items.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  return (
    <div className="lg:col-span-2 relative z-0">
      <div className="flex items-center justify-between mb-4">
        <label className="block text-base font-semibold text-slate-800">{label}</label>
        <Button size="sm" onClick={addItem} variant="secondary" className="shadow-sm">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          {addButtonLabel}
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full w-full table-fixed">
            <colgroup>
              <col style={{ width: "24%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "16%" }} />
              <col style={{ width: "16%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "6%" }} />
            </colgroup>
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Ürün</th>
                <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Miktar</th>
                <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Birim</th>
                <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Birim Fiyat</th>
                <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Ek Masraflar</th>
                <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Toplam</th>
                <th className="p-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((pr, idx) => (
                <tr key={pr.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="p-2 align-top">
                    <Input
                      size="sm"
                      value={pr.name}
                      list={`product-catalog`}
                      onChange={(e) => {
                        const name = e.target.value;
                        const match = productCatalog.find((it) => it.name.toLowerCase() === name.toLowerCase());
                        if (match) {
                          updateItem(pr.id, { name, unitPrice: match.unitPrice, unit: match.unitId });
                        } else {
                          updateItem(pr.id, { name });
                        }
                      }}
                      placeholder="Ürün adı"
                      className="bg-transparent"
                    />
                  </td>
                  <td className="p-2 align-top">
                    <Input
                      size="sm"
                      type="text"
                      inputMode="decimal"
                      value={editing[pr.id]?.quantity ?? formatNumberTR(pr.quantity, 3)}
                      onFocus={() => {
                        setEditing((m) => ({ ...m, [pr.id]: { ...(m[pr.id] || {}), quantity: pr.quantity ? formatNumberTR(pr.quantity, 3) : "" } }));
                      }}
                      onChange={(e) => {
                        const masked = formatTRInput(e.target.value, 3);
                        setEditing((m) => ({ ...m, [pr.id]: { ...(m[pr.id] || {}), quantity: masked } }));
                        const num = parseDecimalFlexible(masked);
                        if (num == null && masked !== "") {
                          setErrors((er) => ({ ...er, [pr.id]: { ...(er[pr.id] || {}), quantity: "Geçersiz" } }));
                        } else {
                          setErrors((er) => ({ ...er, [pr.id]: { ...(er[pr.id] || {}), quantity: undefined } }));
                          updateItem(pr.id, { quantity: num == null ? pr.quantity : Math.max(num, 0) });
                        }
                      }}
                      onBlur={() => {
                        setEditing((m) => ({ ...m, [pr.id]: { ...(m[pr.id] || {}), quantity: undefined } }));
                      }}
                      error={errors[pr.id]?.quantity}
                      className="text-right"
                    />
                  </td>
                  <td className="p-2 align-top">
                    <Select
                      size="sm"
                      value={pr.unit}
                      onChange={(e) => updateItem(pr.id, { unit: e.target.value })}
                      className="bg-transparent"
                    >
                      {unitOptions.map((o) => (
                        <option key={o.id} value={o.id}>{o.label}</option>
                      ))}
                    </Select>
                  </td>
                  <td className="p-2 align-top">
                    <Input
                      size="sm"
                      type="text"
                      inputMode="decimal"
                      value={editing[pr.id]?.unitPrice ?? formatNumberTR(pr.unitPrice)}
                      onFocus={() => {
                        setEditing((m) => ({ ...m, [pr.id]: { ...(m[pr.id] || {}), unitPrice: pr.unitPrice ? formatNumberTR(pr.unitPrice) : "" } }));
                      }}
                      onChange={(e) => {
                        const masked = formatTRInput(e.target.value, 2);
                        setEditing((m) => ({ ...m, [pr.id]: { ...(m[pr.id] || {}), unitPrice: masked } }));
                        const num = parseDecimalFlexible(masked);
                        if (num == null && masked !== "") {
                          setErrors((er) => ({ ...er, [pr.id]: { ...(er[pr.id] || {}), unitPrice: "Geçersiz" } }));
                        } else {
                          setErrors((er) => ({ ...er, [pr.id]: { ...(er[pr.id] || {}), unitPrice: undefined } }));
                          updateItem(pr.id, { unitPrice: num == null ? pr.unitPrice : Math.max(num, 0) });
                        }
                      }}
                      onBlur={() => {
                        setEditing((m) => ({ ...m, [pr.id]: { ...(m[pr.id] || {}), unitPrice: undefined } }));
                      }}
                      placeholder="0,00"
                      error={errors[pr.id]?.unitPrice}
                      className="text-right"
                    />
                  </td>
                  <td className="p-2 align-top">
                    <Input
                      size="sm"
                      type="text"
                      inputMode="decimal"
                      value={editing[pr.id]?.extraCosts ?? formatNumberTR(pr.extraCosts)}
                      onFocus={() => {
                        setEditing((m) => ({ ...m, [pr.id]: { ...(m[pr.id] || {}), extraCosts: pr.extraCosts ? formatNumberTR(pr.extraCosts) : "" } }));
                      }}
                      onChange={(e) => {
                        const masked = formatTRInput(e.target.value, 2);
                        setEditing((m) => ({ ...m, [pr.id]: { ...(m[pr.id] || {}), extraCosts: masked } }));
                        const num = parseDecimalFlexible(masked);
                        if (num == null && masked !== "") {
                          setErrors((er) => ({ ...er, [pr.id]: { ...(er[pr.id] || {}), extraCosts: "Geçersiz" } }));
                        } else {
                          setErrors((er) => ({ ...er, [pr.id]: { ...(er[pr.id] || {}), extraCosts: undefined } }));
                          updateItem(pr.id, { extraCosts: num == null ? pr.extraCosts : Math.max(num, 0) });
                        }
                      }}
                      onBlur={() => {
                        setEditing((m) => ({ ...m, [pr.id]: { ...(m[pr.id] || {}), extraCosts: undefined } }));
                      }}
                      placeholder="0,00"
                      error={errors[pr.id]?.extraCosts}
                      className="text-right"
                    />
                  </td>
                  <td className="p-2 align-top">
                    <div className="px-3 py-2 text-sm font-medium text-slate-700 text-right bg-slate-50 rounded-lg border border-slate-100">
                      {formatNumberTR(Number.isFinite(lineTotals[idx]) ? lineTotals[idx] : 0)}
                    </div>
                  </td>
                  <td className="p-2 align-top text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(pr.id)}
                      className="text-red-400 hover:text-red-600 hover:bg-red-50 h-9 w-9 p-0"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <datalist id="product-catalog">
            {productCatalog.map((it) => (
              <option key={it.name} value={it.name} />
            ))}
          </datalist>
        </div>
      </div>
      <p className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        Ondalık girişlerinde virgül (,) kullanabilirsiniz. Örnek: 1,5
      </p>
    </div>
  );
}