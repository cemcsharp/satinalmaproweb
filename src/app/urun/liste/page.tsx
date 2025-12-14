"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Skeleton from "@/components/ui/Skeleton";
import { TableContainer, Table, THead, TBody, TR, TH, TD } from "@/components/ui/Table";
import { formatNumberTR } from "@/lib/format";

type Category = { id: string; name: string; code: string };
type Product = {
    id: string;
    sku: string;
    name: string;
    description?: string;
    category?: Category;
    defaultUnit?: string;
    estimatedPrice?: number;
    currency: string;
    active: boolean;
};

export default function UrunListePage() {
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("");
    const [activeFilter, setActiveFilter] = useState("true");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    // Fetch categories
    useEffect(() => {
        fetch("/api/urun/kategori?flat=true&active=true")
            .then(r => r.json())
            .then(data => setCategories(data.items || []))
            .catch(console.error);
    }, []);

    // Fetch products
    useEffect(() => {
        setLoading(true);
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("pageSize", "50");
        if (search) params.set("search", search);
        if (categoryFilter) params.set("categoryId", categoryFilter);
        if (activeFilter) params.set("active", activeFilter);

        fetch(`/api/urun?${params.toString()}`)
            .then(r => r.json())
            .then(data => {
                setProducts(data.items || []);
                setTotalPages(data.totalPages || 1);
                setTotal(data.total || 0);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [page, search, categoryFilter, activeFilter]);

    // Debounced search
    const [searchInput, setSearchInput] = useState("");
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchInput);
            setPage(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchInput]);

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10 animate-in fade-in duration-500">
            <PageHeader
                title="Ürün Kataloğu"
                description="Sistemdeki tüm ürünleri yönetin."
                actions={
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => router.push("/urun/kategoriler")}>
                            Kategoriler
                        </Button>
                        <Button variant="gradient" onClick={() => router.push("/urun/olustur")}>
                            Yeni Ürün Ekle
                        </Button>
                    </div>
                }
            />

            {/* Filters */}
            <Card className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Input
                        placeholder="Ürün kodu veya adı ile ara..."
                        value={searchInput}
                        onChange={e => setSearchInput(e.target.value)}
                    />
                    <Select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}>
                        <option value="">Tüm Kategoriler</option>
                        {categories.map(c => (
                            <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                        ))}
                    </Select>
                    <Select value={activeFilter} onChange={e => { setActiveFilter(e.target.value); setPage(1); }}>
                        <option value="true">Aktif Ürünler</option>
                        <option value="false">Pasif Ürünler</option>
                        <option value="">Tümü</option>
                    </Select>
                    <div className="flex items-center justify-end">
                        <Badge variant="info">{total} ürün bulundu</Badge>
                    </div>
                </div>
            </Card>

            {/* Products Table */}
            <Card className="p-0 overflow-hidden">
                {loading ? (
                    <div className="p-10"><Skeleton height={400} /></div>
                ) : (
                    <TableContainer>
                        <Table>
                            <THead>
                                <TR>
                                    <TH className="bg-slate-50 pl-4 w-32">Ürün Kodu</TH>
                                    <TH className="bg-slate-50">Ürün Adı</TH>
                                    <TH className="bg-slate-50">Kategori</TH>
                                    <TH className="bg-slate-50">Birim</TH>
                                    <TH className="bg-slate-50 text-right">Tahmini Fiyat</TH>
                                    <TH className="bg-slate-50 text-center">Durum</TH>
                                    <TH className="bg-slate-50 pr-4 text-right">İşlem</TH>
                                </TR>
                            </THead>
                            <TBody>
                                {products.length === 0 ? (
                                    <TR><TD colSpan={7} className="text-center py-8 text-slate-500">Ürün bulunamadı</TD></TR>
                                ) : (
                                    products.map(p => (
                                        <TR key={p.id} className="hover:bg-slate-50/50">
                                            <TD className="pl-4 font-mono font-bold text-blue-700">{p.sku}</TD>
                                            <TD>
                                                <div className="font-medium text-slate-900">{p.name}</div>
                                                {p.description && <div className="text-xs text-slate-500 truncate max-w-xs">{p.description}</div>}
                                            </TD>
                                            <TD>
                                                {p.category ? (
                                                    <Badge variant="default" className="text-xs">{p.category.code}</Badge>
                                                ) : (
                                                    <span className="text-slate-400">-</span>
                                                )}
                                            </TD>
                                            <TD className="text-slate-600">{p.defaultUnit || "-"}</TD>
                                            <TD className="text-right font-mono">
                                                {p.estimatedPrice ? `${formatNumberTR(Number(p.estimatedPrice))} ${p.currency}` : "-"}
                                            </TD>
                                            <TD className="text-center">
                                                <Badge variant={p.active ? "success" : "error"}>
                                                    {p.active ? "Aktif" : "Pasif"}
                                                </Badge>
                                            </TD>
                                            <TD className="pr-4 text-right">
                                                <Button size="sm" variant="ghost" onClick={() => router.push(`/urun/duzenle/${p.id}`)}>
                                                    Düzenle
                                                </Button>
                                            </TD>
                                        </TR>
                                    ))
                                )}
                            </TBody>
                        </Table>
                    </TableContainer>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center gap-2 p-4 border-t border-slate-100">
                        <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Önceki</Button>
                        <span className="px-4 py-2 text-sm text-slate-600">Sayfa {page} / {totalPages}</span>
                        <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Sonraki</Button>
                    </div>
                )}
            </Card>
        </div>
    );
}
