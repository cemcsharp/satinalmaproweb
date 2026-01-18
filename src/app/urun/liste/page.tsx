"use client";
import { useEffect, useState, useRef } from "react";
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

type Category = { id: string; name: string; code: string; _count?: { products: number }; children?: Category[] };
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
    const [searchInput, setSearchInput] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("");
    const [activeFilter, setActiveFilter] = useState("true");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    // Delete states
    const [confirmDelete, setConfirmDelete] = useState<Product | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Excel Import states
    const [showImportModal, setShowImportModal] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState<{ created: number; updated: number; errors: string[] } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [summary, setSummary] = useState({ total: 0, inactive: 0, categories: 0 });

    // Fetch categories (flat with hierarchy indication for select)
    useEffect(() => {
        fetch("/api/urun/kategori?flat=true&active=true")
            .then(r => r.json())
            .then(data => setCategories(data.items || []))
            .catch(console.error);
    }, []);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchInput);
            setPage(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchInput]);

    // Fetch products
    const fetchProducts = () => {
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
                if (data.summary) setSummary(data.summary);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchProducts();
    }, [page, search, categoryFilter, activeFilter]);

    // Import logic (unchanged)
    const parseFile = async (file: File): Promise<any[]> => {
        const text = await file.text();
        const lines = text.split("\n").filter(l => l.trim());
        if (lines.length < 2) return [];
        const headers = lines[0].split(/[,;\t]/).map(h => h.trim().toLowerCase());
        const products = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(/[,;\t]/).map(v => v.trim().replace(/^"|"$/g, ''));
            const product: any = {};
            headers.forEach((h, idx) => {
                const value = values[idx] || "";
                if (h === "sku" || h === "kod" || h === "ürün kodu" || h === "urun kodu") product.sku = value;
                else if (h === "name" || h === "ad" || h === "ürün adı" || h === "urun adi") product.name = value;
                else if (h === "description" || h === "açıklama" || h === "aciklama") product.description = value;
                else if (h === "categorycode" || h === "kategori" || h === "kategori kodu") product.categoryCode = value;
                else if (h === "unit" || h === "birim" || h === "defaultunit") product.defaultUnit = value;
                else if (h === "price" || h === "fiyat" || h === "estimatedprice") product.estimatedPrice = parseFloat(value) || null;
                else if (h === "currency" || h === "para birimi") product.currency = value || "TRY";
            });
            if (product.sku && product.name) products.push(product);
        }
        return products;
    };

    const handleImport = async () => {
        if (!importFile) return;
        setImporting(true);
        setImportResult(null);
        try {
            const products = await parseFile(importFile);
            if (products.length === 0) {
                setImportResult({ created: 0, updated: 0, errors: ["Dosyada geçerli ürün bulunamadı."] });
                setImporting(false);
                return;
            }
            const res = await fetch("/api/urun", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ products }) });
            const data = await res.json();
            if (data.ok) { setImportResult({ created: data.created || 0, updated: data.updated || 0, errors: data.errors || [] }); fetchProducts(); }
            else { setImportResult({ created: 0, updated: 0, errors: [data.message || "Import başarısız."] }); }
        } catch (err: any) { setImportResult({ created: 0, updated: 0, errors: [err.message] }); }
        setImporting(false);
    };

    const downloadTemplate = () => {
        const headers = "sku;name;description;categoryCode;defaultUnit;estimatedPrice;currency";
        const example = "URN-001;Örnek Ürün;Ürün açıklaması;KAT-01;Adet;100;TRY";
        const content = headers + "\n" + example;
        const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = "urun_import_sablonu.csv"; a.click(); URL.revokeObjectURL(url);
    };

    const handleDelete = async () => {
        if (!confirmDelete) return;
        setDeleting(true);
        try {
            const res = await fetch(`/api/urun/${confirmDelete.id}`, { method: "DELETE" });
            if (res.ok) {
                fetchProducts();
                setConfirmDelete(null);
            } else {
                const data = await res.json();
                alert(data.message || "Silme işlemi başarısız.");
            }
        } catch (err) {
            console.error(err);
            alert("Bir hata oluştu.");
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto pb-10 px-4 animate-in fade-in duration-500">
            <PageHeader
                title="Ürün Kataloğu"
                description="Sistemdeki tüm ürünleri ve envanteri yönetin."
                actions={
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setShowImportModal(true)}>📥 Excel'den Aktar</Button>
                        <Button variant="gradient" onClick={() => router.push("/urun/olustur")}>Yeni Ürün Ekle</Button>
                    </div>
                }
            />

            {/* KPI Cards - Compact Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Toplam Ürün", value: summary.total, icon: "📦", color: "blue" },
                    { label: "Kategoriler", value: summary.categories, icon: "📁", color: "amber" },
                    { label: "Pasif Ürünler", value: summary.inactive, icon: "🚫", color: "slate" },
                    { label: "Aktiflik", value: summary.total > 0 ? `%${Math.round(((summary.total - summary.inactive) / summary.total) * 100)}` : "%0", icon: "✅", color: "green" }
                ].map((stat, i) => (
                    <Card key={i} className={`p-3 border-l-4 border-${stat.color}-500 flex items-center gap-4`}>
                        <div className={`w-10 h-10 rounded-lg bg-${stat.color}-50 flex items-center justify-center text-lg`}>{stat.icon}</div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-none mb-1">{stat.label}</p>
                            <h3 className="text-xl font-black text-slate-800 leading-none">{stat.value}</h3>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Main Content - Full Width */}
            <main className="space-y-4">
                {/* Unified Filter Bar */}
                <Card className="p-4 shadow-sm border-slate-200">
                    <div className="flex flex-col lg:flex-row gap-4 items-center">
                        <div className="w-full lg:w-72">
                            <Select value={categoryFilter} className="h-11 text-sm bg-slate-50 border-slate-200" onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}>
                                <option value="">Tüm Kategoriler</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.code ? `[${cat.code}] ` : ""}{cat.name}
                                    </option>
                                ))}
                            </Select>
                        </div>
                        <div className="relative flex-1 w-full">
                            <Input placeholder="Ürün adı, SKU veya açıklama ile ara..." value={searchInput} onChange={e => setSearchInput(e.target.value)} className="pl-10 h-11" />
                            <span className="absolute left-3 top-3 text-lg opacity-40">🔍</span>
                        </div>
                        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
                            <div className="flex-1 sm:flex-none">
                                <Select value={activeFilter} className="h-11 text-sm bg-slate-50 border-slate-200" onChange={e => { setActiveFilter(e.target.value); setPage(1); }}>
                                    <option value="true">Sadece Aktif</option>
                                    <option value="false">Sadece Pasif</option>
                                    <option value="">Tümü</option>
                                </Select>
                            </div>
                            <Badge variant="info" className="h-11 px-4 flex items-center font-bold">{total} Ürün</Badge>
                        </div>
                    </div>
                </Card>

                <Card className="p-0 overflow-hidden shadow-md border-slate-200">
                    {loading ? <div className="p-20 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div> : (
                        <TableContainer>
                            <Table>
                                <THead>
                                    <TR>
                                        <TH className="bg-slate-50/80 px-4 py-4 uppercase text-[10px] tracking-widest">Ürün Bilgisi</TH>
                                        <TH className="bg-slate-50/80 uppercase text-[10px] tracking-widest">Kategori</TH>
                                        <TH className="bg-slate-50/80 text-right uppercase text-[10px] tracking-widest">Birim Fiyat</TH>
                                        <TH className="bg-slate-50/80 text-center uppercase text-[10px] tracking-widest">Durum</TH>
                                        <TH className="bg-slate-50/80 pr-4 text-right w-32 uppercase text-[10px] tracking-widest">İşlemler</TH>
                                    </TR>
                                </THead>
                                <TBody>
                                    {products.length === 0 ? <TR><TD colSpan={5} className="text-center py-24 text-slate-400">Aranan kriterlere uygun ürün bulunamadı.</TD></TR> : products.map(p => (
                                        <TR key={p.id} className="hover:bg-blue-50/30 group transition-colors">
                                            <TD className="px-4 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-mono text-[10px] text-blue-600 font-black mb-0.5">{p.sku}</span>
                                                    <span className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors uppercase tracking-tight">{p.name}</span>
                                                    {p.description && <span className="text-[11px] text-slate-500 line-clamp-1 italic">{p.description}</span>}
                                                </div>
                                            </TD>
                                            <TD>
                                                {p.category ? (
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-semibold text-slate-700">{p.category.name}</span>
                                                        <span className="text-[9px] text-slate-400 font-mono tracking-tighter">{p.category.code}</span>
                                                    </div>
                                                ) : <span className="text-slate-300">-</span>}
                                            </TD>
                                            <TD className="text-right">
                                                {p.estimatedPrice ? (
                                                    <div className="flex flex-col">
                                                        <span className="font-mono font-black text-slate-800">{formatNumberTR(Number(p.estimatedPrice))} {p.currency}</span>
                                                        <span className="text-[10px] text-slate-400 font-semibold">{p.defaultUnit}</span>
                                                    </div>
                                                ) : <span className="text-slate-300">Fiyat Yok</span>}
                                            </TD>
                                            <TD className="text-center">
                                                <Badge variant={p.active ? "success" : "error"} className="shadow-sm">{p.active ? "Aktif" : "Pasif"}</Badge>
                                            </TD>
                                            <TD className="pr-4 text-right">
                                                <div className="flex gap-1 justify-end opacity-20 group-hover:opacity-100 transition-opacity">
                                                    <Button size="sm" variant="ghost" className="h-9 w-9 p-0 hover:bg-white shadow-sm" title="Detay" onClick={() => router.push(`/urun/${p.id}`)}>📊</Button>
                                                    <Button size="sm" variant="ghost" className="h-9 w-9 p-0 hover:bg-white shadow-sm" title="Düzenle" onClick={() => router.push(`/urun/duzenle/${p.id}`)}>✏️</Button>
                                                    <Button size="sm" variant="ghost" className="h-9 w-9 p-0 hover:bg-red-50 hover:text-red-600 shadow-sm" title="Sil" onClick={() => setConfirmDelete(p)}>🗑️</Button>
                                                </div>
                                            </TD>
                                        </TR>
                                    ))}
                                </TBody>
                            </Table>
                        </TableContainer>
                    )}

                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-6 py-4 bg-slate-50">
                            <div className="text-xs text-slate-500 font-medium">Toplam {total} üründen sayfa {page} / {totalPages}</div>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" className="bg-white" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Geri</Button>
                                <Button size="sm" variant="outline" className="bg-white" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>İleri</Button>
                            </div>
                        </div>
                    )}
                </Card>
            </main>

            {/* Import Modal */}
            {showImportModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <Card className="w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b flex justify-between items-center">
                            <h2 className="text-xl font-black text-slate-800">📥 Ürünleri Aktar</h2>
                            <button onClick={() => setShowImportModal(false)} className="text-2xl text-slate-400 hover:text-slate-600 transition-colors">&times;</button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-xs text-blue-800">
                                <p className="font-bold mb-2 uppercase tracking-wider">Profesyonel İpucu:</p>
                                <p className="leading-relaxed mb-3">Hızlı aktarım için CSV şablonumuzu kullanın. SKU ve Ürün Adı zorunlu alanlardır.</p>
                                <Button size="sm" variant="outline" className="bg-white" onClick={downloadTemplate}>Şablonu İndir</Button>
                            </div>
                            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center hover:border-blue-400 transition-all cursor-pointer bg-slate-50/50" onClick={() => fileInputRef.current?.click()}>
                                <input ref={fileInputRef} type="file" accept=".csv" onChange={e => setImportFile(e.target.files?.[0] || null)} className="hidden" />
                                {importFile ? <div className="space-y-2"><p className="text-3xl">📄</p><p className="font-bold text-slate-800">{importFile.name}</p></div> : <div className="space-y-1"><p className="text-3xl opacity-30">📁</p><p className="text-sm font-semibold text-slate-600">CSV Dosyasını Seçin</p><p className="text-[10px] text-slate-400 uppercase tracking-tighter">Veya buraya sürükleyin</p></div>}
                            </div>
                            {importResult && (
                                <div className={`p-4 rounded-xl text-sm font-bold border ${importResult.errors.length > 0 ? "bg-red-50 border-red-100 text-red-700" : "bg-green-50 border-green-100 text-green-700"}`}>
                                    {importResult.created} Yeni, {importResult.updated} Güncelleme İşlendi.
                                </div>
                            )}
                        </div>
                        <div className="p-4 bg-slate-50 flex justify-end gap-3 px-6 shadow-inner">
                            <Button variant="ghost" onClick={() => setShowImportModal(false)}>İptal</Button>
                            <Button variant="gradient" className="px-8" onClick={handleImport} disabled={!importFile || importing}>{importing ? "Yükleniyor..." : "Başlat"}</Button>
                        </div>
                    </Card>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {confirmDelete && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
                    <Card className="w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 text-center space-y-4">
                            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto text-3xl">⚠️</div>
                            <div>
                                <h2 className="text-xl font-black text-slate-800">Ürünü Sil?</h2>
                                <p className="text-sm text-slate-500 mt-2">
                                    <span className="font-bold text-slate-700">{confirmDelete.name}</span> isimli ürünü pasife almak istediğinize emin misiniz? Bu işlem ürünü listelerden kaldıracaktır.
                                </p>
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 flex justify-center gap-3 px-6 border-t font-semibold">
                            <Button variant="ghost" className="flex-1" onClick={() => setConfirmDelete(null)} disabled={deleting}>Vazgeç</Button>
                            <Button variant="outline" className="flex-1 border-red-200 text-red-600 hover:bg-red-50" onClick={handleDelete} loading={deleting}>Evet, Sil</Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
