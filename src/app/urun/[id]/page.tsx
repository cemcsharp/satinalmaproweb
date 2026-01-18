"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

type Product = {
    id: string;
    sku: string;
    name: string;
    description?: string;
    category?: { id: string; name: string; code: string };
    defaultUnit: string;
    estimatedPrice?: number;
    currency: string;
    preferredSupplier?: { id: string; name: string };
    leadTimeDays?: number;
};

type PriceHistoryItem = {
    id: string;
    date: string;
    orderBarcode: string;
    orderId: string;
    supplierName: string;
    supplierId: string;
    quantity: number;
    unitPrice: number;
    currency: string;
};

type Stats = {
    purchaseCount: number;
    totalQuantity: number;
    minPrice: number;
    maxPrice: number;
    avgPrice: number;
    lastPrice: number;
    lastPurchaseDate: string;
    lastSupplier: string;
};

type SupplierSummary = {
    name: string;
    count: number;
    totalQty: number;
    avgPrice: number;
    lastDate: string;
};

export default function UrunDetayPage() {
    const params = useParams();
    const router = useRouter();
    const { show } = useToast();
    const id = params.id as string;

    const [loading, setLoading] = useState(true);
    const [product, setProduct] = useState<Product | null>(null);
    const [priceHistory, setPriceHistory] = useState<PriceHistoryItem[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [supplierSummary, setSupplierSummary] = useState<SupplierSummary[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`/api/urun/${id}?priceHistory=true`);
                if (!res.ok) throw new Error("Ürün bulunamadı");

                const data = await res.json();
                setProduct(data.product);
                setPriceHistory(data.priceHistory || []);
                setStats(data.stats);
                setSupplierSummary(data.supplierSummary || []);
            } catch (e: any) {
                show({ title: "Hata", description: e.message, variant: "error" });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, show]);

    const formatPrice = (price: number, currency: string = "TRY") => {
        return new Intl.NumberFormat("tr-TR", {
            style: "currency",
            currency
        }).format(price);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("tr-TR");
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="text-center py-16">
                <p className="text-slate-500">Ürün bulunamadı</p>
                <Button variant="outline" className="mt-4" onClick={() => router.back()}>
                    Geri Dön
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-10 animate-in fade-in duration-500">
            <PageHeader
                title={product.name}
                description={`SKU: ${product.sku}`}
                actions={
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => router.back()}>
                            ← Geri
                        </Button>
                        <Button variant="outline" onClick={() => router.push(`/urun/duzenle/${id}`)}>
                            Düzenle
                        </Button>
                    </div>
                }
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Ürün Bilgileri */}
                <Card className="p-5">
                    <h3 className="font-semibold text-slate-800 mb-4">Ürün Bilgileri</h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-slate-500">Kategori:</span>
                            <span className="font-medium">
                                {product.category?.name || "-"}
                                {product.category?.code && (
                                    <span className="text-slate-400 ml-1">({product.category.code})</span>
                                )}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Birim:</span>
                            <span className="font-medium">{product.defaultUnit}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Tahmini Fiyat:</span>
                            <span className="font-medium">
                                {product.estimatedPrice ? formatPrice(product.estimatedPrice, product.currency) : "-"}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Tercih Edilen Tedarikçi:</span>
                            <span className="font-medium">{product.preferredSupplier?.name || "-"}</span>
                        </div>
                        {product.description && (
                            <div className="pt-2 border-t">
                                <span className="text-slate-500">Açıklama:</span>
                                <p className="mt-1">{product.description}</p>
                            </div>
                        )}
                    </div>
                </Card>

                {/* İstatistikler */}
                <Card className="p-5">
                    <h3 className="font-semibold text-slate-800 mb-4">📊 Satın Alma İstatistikleri</h3>
                    {stats ? (
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Toplam Alım:</span>
                                <span className="font-medium">{stats.purchaseCount} kez</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Toplam Miktar:</span>
                                <span className="font-medium">{stats.totalQuantity} {product.defaultUnit}</span>
                            </div>
                            <hr className="my-2" />
                            <div className="flex justify-between">
                                <span className="text-slate-500">En Düşük Fiyat:</span>
                                <span className="font-medium text-green-600">{formatPrice(stats.minPrice)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">En Yüksek Fiyat:</span>
                                <span className="font-medium text-red-600">{formatPrice(stats.maxPrice)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Ortalama Fiyat:</span>
                                <span className="font-medium text-blue-600">{formatPrice(stats.avgPrice)}</span>
                            </div>
                            <hr className="my-2" />
                            <div className="flex justify-between">
                                <span className="text-slate-500">Son Alım:</span>
                                <span className="font-medium">{formatDate(stats.lastPurchaseDate)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Son Tedarikçi:</span>
                                <span className="font-medium">{stats.lastSupplier}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Son Fiyat:</span>
                                <span className="font-medium">{formatPrice(stats.lastPrice)}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-slate-400">
                            <div className="text-3xl mb-2">📦</div>
                            <p>Henüz satın alma geçmişi yok</p>
                        </div>
                    )}
                </Card>

                {/* Tedarikçi Özeti */}
                <Card className="p-5">
                    <h3 className="font-semibold text-slate-800 mb-4">🏢 Tedarikçi Özeti</h3>
                    {supplierSummary.length > 0 ? (
                        <div className="space-y-3">
                            {supplierSummary.map((s, i) => (
                                <div key={i} className="p-3 bg-slate-50 rounded-lg">
                                    <div className="font-medium">{s.name}</div>
                                    <div className="text-xs text-slate-500 mt-1 space-y-0.5">
                                        <div>{s.count} sipariş • {s.totalQty} {product.defaultUnit}</div>
                                        <div>Ort. Fiyat: {formatPrice(s.avgPrice)}</div>
                                        {s.lastDate && <div>Son: {formatDate(s.lastDate)}</div>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-slate-400">
                            <div className="text-3xl mb-2">🏢</div>
                            <p>Tedarikçi verisi yok</p>
                        </div>
                    )}
                </Card>
            </div>

            {/* Fiyat Geçmişi Tablosu */}
            <Card className="p-5">
                <h3 className="font-semibold text-slate-800 mb-4">📜 Fiyat Geçmişi</h3>
                {priceHistory.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="text-left p-3 font-medium text-slate-600">Tarih</th>
                                    <th className="text-left p-3 font-medium text-slate-600">Sipariş No</th>
                                    <th className="text-left p-3 font-medium text-slate-600">Tedarikçi</th>
                                    <th className="text-right p-3 font-medium text-slate-600">Miktar</th>
                                    <th className="text-right p-3 font-medium text-slate-600">Birim Fiyat</th>
                                    <th className="text-right p-3 font-medium text-slate-600">Toplam</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {priceHistory.map((h) => (
                                    <tr key={h.id} className="hover:bg-slate-50">
                                        <td className="p-3">{formatDate(h.date)}</td>
                                        <td className="p-3">
                                            <a
                                                href={`/siparis/${h.orderId}`}
                                                className="text-blue-600 hover:underline"
                                            >
                                                {h.orderBarcode}
                                            </a>
                                        </td>
                                        <td className="p-3">{h.supplierName}</td>
                                        <td className="p-3 text-right">{h.quantity} {product.defaultUnit}</td>
                                        <td className="p-3 text-right font-medium">
                                            {formatPrice(h.unitPrice, h.currency)}
                                        </td>
                                        <td className="p-3 text-right font-medium">
                                            {formatPrice(h.unitPrice * h.quantity, h.currency)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-12 text-slate-400">
                        <div className="text-4xl mb-2">📋</div>
                        <p>Bu ürün için satın alma geçmişi bulunamadı</p>
                        <p className="text-xs mt-1">Sipariş oluşturulduğunda burada görünecek</p>
                    </div>
                )}
            </Card>
        </div>
    );
}
