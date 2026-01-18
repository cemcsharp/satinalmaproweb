"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";

type Category = { id: string; name: string; code?: string; parentId?: string; parentName?: string; parentCode?: string };
type Supplier = { id: string; name: string };

export default function UrunOlusturPage() {
    const router = useRouter();
    const { show } = useToast();

    const [categories, setCategories] = useState<Category[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(false);

    // Form state
    const [mainCategoryId, setMainCategoryId] = useState("");
    const [subCategoryId, setSubCategoryId] = useState("");
    const [sku, setSku] = useState("");
    const [skuManuallyEdited, setSkuManuallyEdited] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [defaultUnit, setDefaultUnit] = useState("Adet");
    const [estimatedPrice, setEstimatedPrice] = useState("");
    const [currency, setCurrency] = useState("TRY");
    const [preferredSupplierId, setPreferredSupplierId] = useState("");
    const [leadTimeDays, setLeadTimeDays] = useState("");

    const [skuStatus, setSkuStatus] = useState<"unknown" | "checking" | "unique" | "duplicate">("unknown");

    // Separate main and sub categories
    const mainCategories = useMemo(() =>
        categories.filter(c => !c.parentId && !c.parentName),
        [categories]
    );

    const subCategories = useMemo(() => {
        if (!mainCategoryId) return [];
        return categories.filter(c => c.parentId === mainCategoryId || c.parentName);
    }, [categories, mainCategoryId]);

    // Final selected category ID
    const selectedCategoryId = subCategoryId || mainCategoryId;

    // Generate SKU from category UNSPSC code
    const generateSku = useCallback(async (catId: string) => {
        const category = categories.find(c => c.id === catId);
        if (!category) return "";

        // Use UNSPSC code if available, otherwise fallback to name prefix
        const prefix = category.code || category.name
            .replace(/İ/g, "I").replace(/Ş/g, "S").replace(/Ğ/g, "G")
            .replace(/Ü/g, "U").replace(/Ö/g, "O").replace(/Ç/g, "C")
            .replace(/ı/g, "i").replace(/ş/g, "s").replace(/ğ/g, "g")
            .replace(/ü/g, "u").replace(/ö/g, "o").replace(/ç/g, "c")
            .replace(/[^a-zA-Z]/g, "")
            .substring(0, 3)
            .toUpperCase();

        try {
            const res = await fetch(`/api/urun?search=${prefix}&pageSize=100`);
            const data = await res.json();
            const existingSkus = (data.items || [])
                .map((p: any) => p.sku)
                .filter((s: string) => s.startsWith(prefix + "-"));

            let maxNum = 0;
            existingSkus.forEach((s: string) => {
                const match = s.match(new RegExp(`^${prefix.replace(/-/g, "\\-")}-(\\d+)$`));
                if (match) {
                    const num = parseInt(match[1], 10);
                    if (num > maxNum) maxNum = num;
                }
            });

            return `${prefix}-${String(maxNum + 1).padStart(4, "0")}`;
        } catch {
            return `${prefix}-0001`;
        }
    }, [categories]);

    // Fetch categories and suppliers
    useEffect(() => {
        fetch("/api/urun/kategori?flat=true&active=true")
            .then(r => r.json())
            .then(data => setCategories(Array.isArray(data.items) ? data.items : []))
            .catch(console.error);

        fetch("/api/tedarikci?pageSize=100&active=true")
            .then(r => r.json())
            .then(data => {
                const items = Array.isArray(data) ? data : (Array.isArray(data.items) ? data.items : (Array.isArray(data.suppliers) ? data.suppliers : []));
                setSuppliers(items);
            })
            .catch(console.error);
    }, []);

    // Auto-generate SKU when category changes
    useEffect(() => {
        if (selectedCategoryId && !skuManuallyEdited) {
            generateSku(selectedCategoryId).then(newSku => {
                if (newSku) setSku(newSku);
            });
        }
    }, [selectedCategoryId, skuManuallyEdited, generateSku]);

    // Reset sub category when main changes
    useEffect(() => {
        setSubCategoryId("");
    }, [mainCategoryId]);

    // SKU uniqueness check
    useEffect(() => {
        if (!sku || sku.length < 2) {
            setSkuStatus("unknown");
            return;
        }
        setSkuStatus("checking");
        const timer = setTimeout(async () => {
            try {
                const res = await fetch(`/api/urun?search=${encodeURIComponent(sku)}&pageSize=1`);
                const data = await res.json();
                const found = (data.items || []).some((p: any) => p.sku.toLowerCase() === sku.toLowerCase());
                setSkuStatus(found ? "duplicate" : "unique");
            } catch {
                setSkuStatus("unknown");
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [sku]);

    const handleSubmit = async () => {
        if (!sku || !name) {
            return show({ title: "Ürün kodu ve adı zorunludur", variant: "warning" });
        }
        if (!selectedCategoryId) {
            return show({ title: "Lütfen bir kategori seçin", variant: "warning" });
        }
        if (skuStatus === "duplicate") {
            return show({ title: "Bu ürün kodu zaten kullanılıyor", variant: "warning" });
        }

        setLoading(true);
        try {
            const res = await fetch("/api/urun", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sku,
                    name,
                    description,
                    categoryId: selectedCategoryId,
                    defaultUnit,
                    estimatedPrice: estimatedPrice ? Number(estimatedPrice) : null,
                    currency,
                    preferredSupplierId: preferredSupplierId || null,
                    leadTimeDays: leadTimeDays ? Number(leadTimeDays) : null
                })
            });

            const json = await res.json();
            if (res.ok) {
                show({ title: "Ürün oluşturuldu", description: `SKU: ${sku}`, variant: "success" });
                router.push("/urun/liste");
            } else {
                throw new Error(json.message || json.error || "Hata");
            }
        } catch (e: any) {
            show({ title: "Hata", description: e.message, variant: "error" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-3xl mx-auto pb-10 animate-in fade-in duration-500">
            <PageHeader
                title="Yeni Ürün Ekle"
                description="Ürün kataloğuna yeni bir ürün ekleyin."
            />

            <Card className="p-6">
                <div className="space-y-6">
                    {/* Kategori Seçimi */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select
                            label="Ana Kategori *"
                            value={mainCategoryId}
                            onChange={e => setMainCategoryId(e.target.value)}
                        >
                            <option value="">Kategori Seçin</option>
                            {mainCategories.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </Select>

                        {mainCategoryId && subCategories.length > 0 && (
                            <Select
                                label="Alt Kategori (Opsiyonel)"
                                value={subCategoryId}
                                onChange={e => setSubCategoryId(e.target.value)}
                            >
                                <option value="">Ana kategori kullan</option>
                                {subCategories.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </Select>
                        )}
                    </div>

                    <hr className="border-slate-200" />

                    {/* Ürün Kodu ve Adı */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Input
                                label="Ürün Kodu (SKU)"
                                value={sku}
                                onChange={e => {
                                    setSku(e.target.value.toUpperCase());
                                    setSkuManuallyEdited(true);
                                }}
                                placeholder={mainCategoryId ? "Otomatik oluşturuldu" : "Önce kategori seçin"}
                                disabled={!mainCategoryId}
                            />
                            {!skuManuallyEdited && sku && (
                                <p className="text-xs text-blue-600 mt-1">💡 Otomatik kod</p>
                            )}
                            {skuStatus === "checking" && <p className="text-xs text-slate-500 mt-1">Kontrol ediliyor...</p>}
                            {skuStatus === "duplicate" && <p className="text-xs text-red-600 mt-1">Bu kod zaten kullanılıyor!</p>}
                            {skuStatus === "unique" && <p className="text-xs text-green-600 mt-1">✓ Kullanılabilir</p>}
                        </div>

                        <Input
                            label="Ürün Adı *"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Ürün adını girin"
                        />
                    </div>

                    {/* Açıklama */}
                    <Input
                        label="Açıklama (Opsiyonel)"
                        multiline
                        rows={2}
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="Ürün hakkında kısa bilgi..."
                    />

                    <hr className="border-slate-200" />

                    {/* Birim, Fiyat, Tedarikçi */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Select
                            label="Birim"
                            value={defaultUnit}
                            onChange={e => setDefaultUnit(e.target.value)}
                        >
                            <option value="Adet">Adet</option>
                            <option value="Kg">Kg</option>
                            <option value="Lt">Lt</option>
                            <option value="Mt">Mt</option>
                            <option value="Paket">Paket</option>
                            <option value="Kutu">Kutu</option>
                            <option value="Set">Set</option>
                        </Select>

                        <Input
                            label="Tahmini Fiyat"
                            type="number"
                            value={estimatedPrice}
                            onChange={e => setEstimatedPrice(e.target.value)}
                            placeholder="0.00"
                        />

                        <Select
                            label="Para Birimi"
                            value={currency}
                            onChange={e => setCurrency(e.target.value)}
                        >
                            <option value="TRY">₺ TRY</option>
                            <option value="USD">$ USD</option>
                            <option value="EUR">€ EUR</option>
                        </Select>

                        <Input
                            label="Tedarik Süresi"
                            type="number"
                            value={leadTimeDays}
                            onChange={e => setLeadTimeDays(e.target.value)}
                            placeholder="Gün"
                        />
                    </div>

                    {/* Tedarikçi */}
                    {suppliers.length > 0 && (
                        <Select
                            label="Tercih Edilen Tedarikçi (Opsiyonel)"
                            value={preferredSupplierId}
                            onChange={e => setPreferredSupplierId(e.target.value)}
                        >
                            <option value="">Seçilmedi</option>
                            {suppliers.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </Select>
                    )}
                </div>
            </Card>

            {/* Butonlar */}
            <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => router.back()}>İptal</Button>
                <Button
                    variant="gradient"
                    onClick={handleSubmit}
                    loading={loading}
                    disabled={!selectedCategoryId || !name || skuStatus === "duplicate"}
                >
                    Ürün Oluştur
                </Button>
            </div>
        </div>
    );
}
