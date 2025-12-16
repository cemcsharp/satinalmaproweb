"use client";
import Button from "@/components/ui/Button";
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { flushSync } from "react-dom";
import { formatNumberTR, parseDecimalFlexible } from "@/lib/format";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import DropdownPortal from "@/components/ui/DropdownPortal";

export type Option = { id: string; label: string };
export type ProductRow = {
  id: string;
  name: string;
  sku?: string;           // Ürün kodu (katalogdan)
  productId?: string;     // Katalog ürün ID'si
  quantity: number;
  unit: string;
  unitPrice: number;
  extraCosts: number;
  currency?: string;      // Para birimi (TRY, USD, EUR, GBP)
};

type CatalogProduct = {
  id: string;
  sku: string;
  name: string;
  defaultUnit?: string;
  estimatedPrice?: number;
  currency?: string;
};

type Props = {
  label?: string;
  addButtonLabel?: string;
  items: ProductRow[];
  onItemsChange: (next: ProductRow[]) => void;
  unitOptions: Option[];
  currencyOptions?: Option[];  // Para birimi seçenekleri
  defaultCurrency?: string;    // Varsayılan para birimi ID
  productCatalog?: { name: string; unitPrice: number; unitId: string }[]; // Legacy uyumluluk
};

export default function ItemsSection({
  label = "Talep Edilen Ürünler",
  addButtonLabel = "Ürün Ekle",
  items,
  onItemsChange,
  unitOptions,
  currencyOptions = [],
  defaultCurrency,
}: Props) {
  const [editing, setEditing] = useState<Record<string, { quantity?: string; unitPrice?: string; extraCosts?: string }>>({});
  const [errors, setErrors] = useState<Record<string, { quantity?: string; unitPrice?: string; extraCosts?: string }>>({});

  // Ürün Arama State'leri
  const [searchQueries, setSearchQueries] = useState<Record<string, string>>({});
  const [searchResults, setSearchResults] = useState<Record<string, CatalogProduct[]>>({});
  const [searchLoading, setSearchLoading] = useState<Record<string, boolean>>({});
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

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
      {
        id: crypto.randomUUID(),
        name: "",
        quantity: 1,
        unit: unitOptions[0]?.id || "u1",
        unitPrice: 0,
        extraCosts: 0,
        currency: defaultCurrency || currencyOptions[0]?.id || undefined
      },
    ]);
  };
  const removeItem = (id: string) => onItemsChange(items.filter((p) => p.id !== id));
  const updateItem = (id: string, patch: Partial<ProductRow>) => onItemsChange(items.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  // Ürün Arama - Debounced
  const searchProducts = useCallback(async (rowId: string, query: string) => {
    if (!query || query.length < 2) {
      setSearchResults(prev => ({ ...prev, [rowId]: [] }));
      setActiveDropdown(null);
      return;
    }

    setSearchLoading(prev => ({ ...prev, [rowId]: true }));
    try {
      const res = await fetch(`/api/urun?search=${encodeURIComponent(query)}&pageSize=10&active=true`);
      const data = await res.json();
      const products: CatalogProduct[] = (data.items || []).map((p: any) => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        defaultUnit: p.defaultUnit,
        estimatedPrice: p.estimatedPrice ? Number(p.estimatedPrice) : undefined,
        currency: p.currency
      }));
      // flushSync ile senkron render zorla - dropdown hemen görünsün
      flushSync(() => {
        setSearchResults(prev => ({ ...prev, [rowId]: products }));
      });
      if (products.length > 0) setActiveDropdown(rowId);
    } catch (e) {
      console.error("Product search error:", e);
    } finally {
      setSearchLoading(prev => ({ ...prev, [rowId]: false }));
    }
  }, []);

  // Debounced search effect - hem SKU hem Ürün Adı aramaları için çalışır
  useEffect(() => {
    const timers: Record<string, NodeJS.Timeout> = {};
    Object.entries(searchQueries).forEach(([key, query]) => {
      // key formatları: "rowId" (SKU için) veya "name_rowId" (Ürün Adı için)
      timers[key] = setTimeout(() => searchProducts(key, query), 300);
    });
    return () => Object.values(timers).forEach(clearTimeout);
  }, [searchQueries, searchProducts]);

  // Katalog ürünü seç
  const selectProduct = (rowId: string, product: CatalogProduct) => {
    // Birim eşleştirme
    let unitId = unitOptions[0]?.id || "u1";
    if (product.defaultUnit) {
      const matchedUnit = unitOptions.find(u =>
        u.label.toLowerCase() === product.defaultUnit?.toLowerCase()
      );
      if (matchedUnit) unitId = matchedUnit.id;
    }

    updateItem(rowId, {
      name: product.name,
      sku: product.sku,
      productId: product.id,
      unitPrice: product.estimatedPrice || 0,
      unit: unitId
    });

    // Her iki arama state'ini de temizle (SKU ve Ürün Adı)
    setSearchQueries(prev => ({
      ...prev,
      [rowId]: "",
      [`name_${rowId}`]: ""
    }));
    setSearchResults(prev => ({
      ...prev,
      [rowId]: [],
      [`name_${rowId}`]: []
    }));
    setActiveDropdown(null);
  };

  // Click outside handler - sadece bileşen dışına tıklandığında kapat
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Eğer tıklanan element dropdown veya input içindeyse kapatma
      if (target.closest('[data-dropdown-container]')) return;
      setActiveDropdown(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="lg:col-span-2 relative z-0">
      <div className="flex items-center justify-between mb-4">
        <label className="block text-base font-semibold text-slate-800">{label}</label>
        <Button size="sm" onClick={addItem} variant="secondary" className="shadow-sm">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          {addButtonLabel}
        </Button>
      </div>

      {/* Mobile View (Cards) */}
      <div className="md:hidden space-y-4 mb-4">
        {items.map((pr, idx) => (
          <div key={pr.id} className="p-4 border border-slate-200 rounded-lg bg-white shadow-sm space-y-4">
            {/* Header: Delete + SKU */}
            <div className="flex justify-between items-start gap-3">
              <div className="flex-1 space-y-1">
                <label className="text-[10px] uppercase text-slate-500 font-semibold">Ürün Adı</label>
                <div ref={(el) => { inputRefs.current[`m_name_${pr.id}`] = el as any; }}>
                  <Input
                    value={pr.productId ? pr.name : (searchQueries[`name_${pr.id}`] ?? pr.name)}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (pr.productId) updateItem(pr.id, { sku: undefined, productId: undefined, name: "", unitPrice: 0 });
                      updateItem(pr.id, { name: value });
                      setSearchQueries(prev => ({ ...prev, [`name_${pr.id}`]: value }));
                      setActiveDropdown(`m_name_${pr.id}`);
                    }}
                    onFocus={() => setActiveDropdown(`m_name_${pr.id}`)}
                    placeholder="Ürün adı ara..."
                    className={pr.productId ? "text-slate-700 font-medium" : ""}
                  />
                </div>
                {/* Mobile Name Dropdown */}
                <DropdownPortal
                  anchorRef={{ current: inputRefs.current[`m_name_${pr.id}`] }}
                  isOpen={activeDropdown === `m_name_${pr.id}` && !pr.productId && (searchResults[`name_${pr.id}`]?.length || 0) > 0}
                >
                  {searchResults[`name_${pr.id}`]?.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => selectProduct(pr.id, product)}
                      className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-slate-100 last:border-0"
                    >
                      <div className="font-medium text-sm text-slate-800">{product.name}</div>
                      <div className="text-xs text-slate-500">{product.sku}</div>
                    </button>
                  ))}
                </DropdownPortal>
              </div>
              <Button variant="ghost" size="sm" onClick={() => removeItem(pr.id)} className="text-red-400 -mt-1 -mr-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </Button>
            </div>

            {/* SKU & Quantity Row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase text-slate-500 font-semibold">Miktar</label>
                <Input
                  type="text" inputMode="decimal"
                  value={editing[pr.id]?.quantity ?? formatNumberTR(pr.quantity, 3)}
                  onFocus={() => setEditing((m) => ({ ...m, [pr.id]: { ...(m[pr.id] || {}), quantity: pr.quantity ? formatNumberTR(pr.quantity, 3) : "" } }))}
                  onChange={(e) => {
                    const masked = formatTRInput(e.target.value, 3);
                    setEditing((m) => ({ ...m, [pr.id]: { ...(m[pr.id] || {}), quantity: masked } }));
                    const num = parseDecimalFlexible(masked);
                    if (num != null) updateItem(pr.id, { quantity: Math.max(num, 0) });
                  }}
                  onBlur={() => setEditing((m) => ({ ...m, [pr.id]: { ...(m[pr.id] || {}), quantity: undefined } }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase text-slate-500 font-semibold">Birim</label>
                <Select value={pr.unit} onChange={(e) => updateItem(pr.id, { unit: e.target.value })}>
                  {unitOptions.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                </Select>
              </div>
            </div>

            {/* Price & Current & Total */}
            <div className="grid grid-cols-3 gap-3 items-end">
              <div className="col-span-1 space-y-1">
                <label className="text-[10px] uppercase text-slate-500 font-semibold">Birim Fiyat</label>
                <Input
                  type="text" inputMode="decimal" placeholder="0,00"
                  value={editing[pr.id]?.unitPrice ?? formatNumberTR(pr.unitPrice)}
                  onFocus={() => setEditing((m) => ({ ...m, [pr.id]: { ...(m[pr.id] || {}), unitPrice: pr.unitPrice ? formatNumberTR(pr.unitPrice) : "" } }))}
                  onChange={(e) => {
                    const masked = formatTRInput(e.target.value, 2);
                    setEditing((m) => ({ ...m, [pr.id]: { ...(m[pr.id] || {}), unitPrice: masked } }));
                    const num = parseDecimalFlexible(masked);
                    if (num != null) updateItem(pr.id, { unitPrice: Math.max(num, 0) });
                  }}
                  onBlur={() => setEditing((m) => ({ ...m, [pr.id]: { ...(m[pr.id] || {}), unitPrice: undefined } }))}
                />
              </div>
              <div className="col-span-1 space-y-1">
                <label className="text-[10px] uppercase text-slate-500 font-semibold">Para Br.</label>
                <Select
                  value={pr.currency || defaultCurrency || currencyOptions[0]?.id || ""}
                  onChange={(e) => updateItem(pr.id, { currency: e.target.value })}
                  className="px-1"
                >
                  {currencyOptions.length > 0 ? currencyOptions.map(o => <option key={o.id} value={o.id}>{o.label}</option>) : <option>TRY</option>}
                </Select>
              </div>
              <div className="col-span-1 text-right pb-2">
                <div className="text-sm font-bold text-slate-700">
                  {formatNumberTR((pr.quantity || 0) * (pr.unitPrice || 0) + (pr.extraCosts || 0))}
                </div>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="text-center p-4 text-slate-400 text-sm italic">Henüz ürün eklenmedi.</div>}
      </div>

      <div className="hidden md:block rounded-xl border border-slate-200 bg-white shadow-sm" style={{ overflow: 'visible' }}>
        <div style={{ overflow: 'visible' }}>
          <table className="min-w-full w-full table-fixed">
            <colgroup>
              <col style={{ width: "9%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "9%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "5%" }} />
            </colgroup>
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Ürün Kodu</th>
                <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Ürün Adı</th>
                <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Miktar</th>
                <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Birim</th>
                <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Birim Fiyat</th>
                <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Para Br.</th>
                <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Ek Masraflar</th>
                <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Toplam</th>
                <th className="p-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((pr, idx) => (
                <tr key={pr.id} className="group hover:bg-slate-50/50 transition-colors">
                  {/* Ürün Kodu - Arama ile */}
                  <td className="p-2 align-top" data-dropdown-container>
                    <div ref={(el) => { inputRefs.current[pr.id] = el as any; }}>
                      <Input
                        size="sm"
                        value={pr.sku || searchQueries[pr.id] || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (pr.productId) {
                            updateItem(pr.id, { sku: undefined, productId: undefined, name: "", unitPrice: 0 });
                          }
                          setSearchQueries(prev => ({ ...prev, [pr.id]: value }));
                          setActiveDropdown(pr.id);
                        }}
                        onFocus={() => setActiveDropdown(pr.id)}
                        onClick={(e) => e.stopPropagation()}
                        placeholder="SKU ara..."
                        className={`bg-transparent ${pr.productId ? "font-mono text-blue-700 font-bold" : ""}`}
                      />
                    </div>
                    {searchLoading[pr.id] && (
                      <div className="absolute right-4 top-4 text-xs text-slate-400">...</div>
                    )}

                    {/* Portal Dropdown - body'ye render edilir */}
                    <DropdownPortal
                      anchorRef={{ current: inputRefs.current[pr.id] }}
                      isOpen={activeDropdown === pr.id && !pr.productId && (searchResults[pr.id]?.length || 0) > 0}
                    >
                      {searchResults[pr.id]?.map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => selectProduct(pr.id, product)}
                          className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b border-slate-100 last:border-0 transition-colors"
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-mono font-bold text-blue-700 text-sm">{product.sku}</span>
                            {product.estimatedPrice && (
                              <span className="text-xs text-slate-500">{formatNumberTR(product.estimatedPrice)} {product.currency || "TRY"}</span>
                            )}
                          </div>
                          <div className="text-sm text-slate-600 truncate">{product.name}</div>
                        </button>
                      ))}
                    </DropdownPortal>
                  </td>

                  {/* Ürün Adı - Arama ile */}
                  <td className="p-2 align-top" data-dropdown-container>
                    <div ref={(el) => { inputRefs.current[`name_${pr.id}`] = el as any; }}>
                      <Input
                        size="sm"
                        value={pr.productId ? pr.name : (searchQueries[`name_${pr.id}`] ?? pr.name)}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (pr.productId) {
                            updateItem(pr.id, { sku: undefined, productId: undefined, name: "", unitPrice: 0 });
                          }
                          updateItem(pr.id, { name: value });
                          setSearchQueries(prev => ({ ...prev, [`name_${pr.id}`]: value }));
                          setActiveDropdown(`name_${pr.id}`);
                        }}
                        onFocus={() => {
                          setActiveDropdown(`name_${pr.id}`);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        placeholder="Ürün adı ara..."
                        className={`bg-transparent ${pr.productId ? "text-slate-700 font-medium" : ""}`}
                      />
                    </div>
                    {searchLoading[`name_${pr.id}`] && (
                      <div className="absolute right-4 top-4 text-xs text-slate-400">...</div>
                    )}

                    {/* Portal Dropdown - body'ye render edilir, her şeyin üstünde */}
                    <DropdownPortal
                      anchorRef={{ current: inputRefs.current[`name_${pr.id}`] }}
                      isOpen={activeDropdown === `name_${pr.id}` && !pr.productId && (searchResults[`name_${pr.id}`]?.length || 0) > 0}
                    >
                      {searchResults[`name_${pr.id}`]?.map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => selectProduct(pr.id, product)}
                          className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b border-slate-100 last:border-0 transition-colors"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-700 font-medium">{product.name}</span>
                            {product.estimatedPrice && (
                              <span className="text-xs text-slate-500">{formatNumberTR(product.estimatedPrice)} {product.currency || "TRY"}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-blue-600">{product.sku}</span>
                            {product.defaultUnit && (
                              <span className="text-xs text-slate-400">• {product.defaultUnit}</span>
                            )}
                          </div>
                        </button>
                      ))}
                    </DropdownPortal>
                  </td>

                  {/* Miktar */}
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

                  {/* Birim */}
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

                  {/* Birim Fiyat */}
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

                  {/* Para Birimi */}
                  <td className="p-2 align-top">
                    {currencyOptions.length > 0 ? (
                      <Select
                        size="sm"
                        value={pr.currency || defaultCurrency || currencyOptions[0]?.id || ""}
                        onChange={(e) => updateItem(pr.id, { currency: e.target.value })}
                        className="bg-transparent"
                      >
                        {currencyOptions.map((o) => (
                          <option key={o.id} value={o.id}>{o.label}</option>
                        ))}
                      </Select>
                    ) : (
                      <span className="text-sm text-slate-400 px-2">TRY</span>
                    )}
                  </td>

                  {/* Ek Masraflar */}
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

                  {/* Toplam */}
                  <td className="p-2 align-top">
                    <div className="px-3 py-2 text-sm font-medium text-slate-700 text-right bg-slate-50 rounded-lg border border-slate-100">
                      {formatNumberTR(Number.isFinite(lineTotals[idx]) ? lineTotals[idx] : 0)}
                    </div>
                  </td>

                  {/* Sil */}
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
        </div>
      </div>
      <p className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        Ürün kodu alanına yazarak katalogdan ürün arayabilir veya manuel giriş yapabilirsiniz.
      </p>
    </div>
  );
}