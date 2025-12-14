"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";

type Category = { id: string; name: string; code: string };
type Supplier = { id: string; name: string };

export default function UrunOlusturPage() {
    const router = useRouter();
    const { show } = useToast();

    const [categories, setCategories] = useState<Category[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(false);

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

    const [skuStatus, setSkuStatus] = useState<"unknown" | "checking" | "unique" | "duplicate">("unknown");

    // Fetch categories and suppliers
    useEffect(() => {
        fetch("/api/urun/kategori?flat=true&active=true")
            .then(r => r.json())
            .then(data => setCategories(data.items || []))
            .catch(console.error);

        fetch("/api/tedarikci?pageSize=100&active=true")
            .then(r => r.json())
            .then(data => setSuppliers(data.items || data || []))
            .catch(console.error);
    }, []);

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
                    categoryId: categoryId || null,
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
        <div className="space-y-6 max-w-4xl mx-auto pb-10 animate-in fade-in duration-500">
            <PageHeader
                title="Yeni Ürün Ekle"
                description="Ürün kataloğuna yeni bir ürün ekleyin."
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="Temel Bilgiler" className="p-5">
                    <div className="space-y-4">
                        <div>
                            <Input
                                label="Ürün Kodu (SKU)"
                                value={sku}
                                onChange={e => setSku(e.target.value.toUpperCase())}
                                placeholder="Örn: BT-LAP-001"
                            />
                            {skuStatus === "checking" && <p className="text-xs text-slate-500 mt-1">Kontrol ediliyor...</p>}
                            {skuStatus === "duplicate" && <p className="text-xs text-red-600 mt-1">Bu kod zaten kullanılıyor!</p>}
                            {skuStatus === "unique" && <p className="text-xs text-green-600 mt-1">✓ Kullanılabilir</p>}
                        </div>
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
                    </div>
                </Card>
            </div>

            <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => router.back()}>İptal</Button>
                <Button variant="gradient" onClick={handleSubmit} loading={loading} disabled={skuStatus === "duplicate"}>
                    Ürün Oluştur
                </Button>
            </div>
        </div>
    );
}
