"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";

type Category = { id: string; name: string; code: string };
type Supplier = { id: string; name: string };
type Product = {
    id: string;
    sku: string;
    name: string;
    description: string | null;
    categoryId: string | null;
    defaultUnit: string | null;
    estimatedPrice: number | null;
    currency: string;
    preferredSupplierId: string | null;
    leadTimeDays: number | null;
    active: boolean;
};

function UrunDuzenleContent() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;
    const { show } = useToast();

    const [product, setProduct] = useState<Product | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form state
    const [sku, setSku] = useState("");
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [defaultUnit, setDefaultUnit] = useState("Adet");
    const [estimatedPrice, setEstimatedPrice] = useState("");
    const [currency, setCurrency] = useState("TRY");
    const [preferredSupplierId, setPreferredSupplierId] = useState("");
    const [leadTimeDays, setLeadTimeDays] = useState("");
    const [active, setActive] = useState(true);

    // Fetch product, categories and suppliers
    useEffect(() => {
        if (!id) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch product
                const productRes = await fetch(`/api/urun/${id}`);
                if (!productRes.ok) throw new Error("Ürün bulunamadı");
                const productData = await productRes.json();
                setProduct(productData);

                // Set form values
                setSku(productData.sku || "");
                setName(productData.name || "");
                setDescription(productData.description || "");
                setCategoryId(productData.categoryId || "");
                setDefaultUnit(productData.defaultUnit || "Adet");
                setEstimatedPrice(productData.estimatedPrice?.toString() || "");
                setCurrency(productData.currency || "TRY");
                setPreferredSupplierId(productData.preferredSupplierId || "");
                setLeadTimeDays(productData.leadTimeDays?.toString() || "");
                setActive(productData.active ?? true);

                // Fetch categories
                const catRes = await fetch("/api/urun/kategori?flat=true&active=true");
                const catData = await catRes.json();
                setCategories(catData.items || []);

                // Fetch suppliers
                const supRes = await fetch("/api/tedarikci?pageSize=100&active=true");
                const supData = await supRes.json();
                setSuppliers(supData.items || supData || []);

            } catch (e: any) {
                show({ title: "Hata", description: e.message, variant: "error" });
                router.push("/urun/liste");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const handleSubmit = async () => {
        if (!sku || !name) {
            return show({ title: "Ürün kodu ve adı zorunludur", variant: "warning" });
        }

        setSaving(true);
        try {
            const res = await fetch(`/api/urun/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sku,
                    name,
                    description,
                    categoryId: categoryId || null,
                    defaultUnit,
                    estimatedPrice: estimatedPrice ? Number(estimatedPrice) : null,
                    currency,
                    preferredSupplierId: preferredSupplierId || null,
                    leadTimeDays: leadTimeDays ? Number(leadTimeDays) : null,
                    active
                })
            });

            const json = await res.json();
            if (res.ok) {
                show({ title: "Ürün güncellendi", description: `SKU: ${sku}`, variant: "success" });
                router.push("/urun/liste");
            } else {
                throw new Error(json.message || json.error || "Hata");
            }
        } catch (e: any) {
            show({ title: "Hata", description: e.message, variant: "error" });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="text-center py-20 text-slate-500">Ürün bulunamadı</div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-10 animate-in fade-in duration-500">
            <PageHeader
                title="Ürün Düzenle"
                description={`${product.sku} - ${product.name}`}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="Temel Bilgiler" className="p-5">
                    <div className="space-y-4">
                        <Input
                            label="Ürün Kodu (SKU)"
                            value={sku}
                            onChange={e => setSku(e.target.value.toUpperCase())}
                            placeholder="Örn: BT-LAP-001"
                        />
                        <Input
                            label="Ürün Adı"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Standart ürün adı"
                        />
                        <Input
                            label="Açıklama (Opsiyonel)"
                            multiline
                            rows={3}
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Ürün hakkında detaylı bilgi..."
                        />
                        <Select
                            label="Kategori"
                            value={categoryId}
                            onChange={e => setCategoryId(e.target.value)}
                        >
                            <option value="">Kategori Seçin</option>
                            {categories.map(c => (
                                <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                            ))}
                        </Select>
                    </div>
                </Card>

                <Card title="Birim ve Fiyat" className="p-5">
                    <div className="space-y-4">
                        <Select
                            label="Varsayılan Birim"
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
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Tahmini Birim Fiyat"
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
                                <option value="TRY">TRY (₺)</option>
                                <option value="USD">USD ($)</option>
                                <option value="EUR">EUR (€)</option>
                            </Select>
                        </div>
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
                        <Input
                            label="Tedarik Süresi (Gün)"
                            type="number"
                            value={leadTimeDays}
                            onChange={e => setLeadTimeDays(e.target.value)}
                            placeholder="Örn: 7"
                        />
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={active}
                                onChange={e => setActive(e.target.checked)}
                                className="w-4 h-4 rounded text-blue-600"
                            />
                            <span className="text-sm text-slate-700">Ürün Aktif</span>
                        </label>
                    </div>
                </Card>
            </div>

            <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => router.back()}>İptal</Button>
                <Button variant="gradient" onClick={handleSubmit} loading={saving}>
                    Güncelle
                </Button>
            </div>
        </div>
    );
}

export default function UrunDuzenlePage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-slate-500">Yükleniyor...</div>}>
            <UrunDuzenleContent />
        </Suspense>
    );
}
