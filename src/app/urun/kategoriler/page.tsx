"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";

type Category = {
    id: string;
    name: string;
    code: string;
    description?: string;
    parentId?: string;
    parent?: { id: string; name: string; code: string };
    active: boolean;
    sortOrder: number;
    _count?: { products: number };
    children?: Category[];
};

export default function UrunKategorileriPage() {
    const router = useRouter();
    const { show } = useToast();

    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const [syncing, setSyncing] = useState(false);

    // Fetch categories
    const loadCategories = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/urun/kategori?active=");
            const data = await res.json();
            setCategories(data.items || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCategories();
    }, []);

    const toggleExpand = (id: string) => {
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const expandAll = () => {
        const newExpanded: Record<string, boolean> = {};
        const collectIds = (cats: Category[]) => {
            cats.forEach(c => {
                newExpanded[c.id] = true;
                if (c.children) collectIds(c.children);
            });
        };
        collectIds(categories);
        setExpanded(newExpanded);
    };

    const collapseAll = () => setExpanded({});

    const handleSync = async () => {
        if (!confirm("Tüm kategoriler standart UNSPSC listesine göre senkronize edilecek. Devam edilsin mi?")) return;
        setSyncing(true);
        try {
            const res = await fetch("/api/urun/kategori", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sync: true })
            });
            if (res.ok) {
                show({ title: "Başarılı", description: "Standart liste güncellendi.", variant: "success" });
                loadCategories();
            } else throw new Error("Senkronizasyon başarısız.");
        } catch (e: any) {
            show({ title: "Hata", description: e.message, variant: "error" });
        } finally {
            setSyncing(false);
        }
    };

    const toggleActive = async (cat: Category) => {
        try {
            const res = await fetch("/api/urun/kategori", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: cat.id, active: !cat.active })
            });
            if (res.ok) {
                // Local state update
                const updateInTree = (list: Category[]): Category[] => {
                    return list.map(c => {
                        if (c.id === cat.id) return { ...c, active: !cat.active };
                        if (c.children) return { ...c, children: updateInTree(c.children) };
                        return c;
                    });
                };
                setCategories(updateInTree(categories));
                show({ title: cat.active ? "Kategori Pasife Alındı" : "Kategori Aktifleştirildi", variant: "info" });
            }
        } catch (e) {
            show({ title: "İşlem başarısız", variant: "error" });
        }
    };

    const filterCategories = (cats: Category[]): Category[] => {
        if (!search) return cats;
        return cats.map(cat => {
            const children = cat.children ? filterCategories(cat.children) : [];
            const matches = cat.name.toLowerCase().includes(search.toLowerCase()) ||
                cat.code.toLowerCase().includes(search.toLowerCase());
            if (matches || children.length > 0) return { ...cat, children, isMatch: matches };
            return null;
        }).filter(c => c !== null) as Category[];
    };

    const renderCategory = (cat: any, depth = 0) => {
        const isExpanded = expanded[cat.id];
        const hasChildren = cat.children && cat.children.length > 0;
        const isMatch = cat.isMatch;

        return (
            <div key={cat.id} className="mb-1">
                <div className={`group flex items-center justify-between p-2 rounded-xl transition-all border ${cat.active ? (isMatch && search ? "bg-blue-50 border-blue-200 shadow-sm" : "bg-white border-slate-100 hover:border-slate-300 hover:shadow-sm") : "bg-slate-50 border-slate-200 opacity-60 grayscale-[0.5]"}`}>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => toggleExpand(cat.id)}
                            className={`w-6 h-6 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                        >
                            {hasChildren ? "▶" : "•"}
                        </button>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm bg-gradient-to-br ${depth === 0 ? "from-indigo-500 to-purple-600" : depth === 1 ? "from-blue-400 to-cyan-500" : "from-sky-400 to-teal-500"}`}>
                            {cat.code.charAt(0)}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className={`font-mono text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-bold border border-slate-200`}>{cat.code}</span>
                                <span className={`font-semibold ${isMatch ? "text-blue-700" : "text-slate-800"}`}>{cat.name}</span>
                                {cat._count?.products > 0 && <Badge variant="info" className="text-[10px]">{cat._count.products} Ürün</Badge>}
                            </div>
                            {!cat.active && <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider">Pasif Katalog Öğesi</p>}
                        </div>
                    </div>
                    <div className="flex items-center gap-3 pr-2">
                        <div className="flex items-center gap-2 mr-2">
                            <span className={`text-[10px] font-bold ${cat.active ? "text-green-600" : "text-slate-400"}`}>{cat.active ? "AÇIK" : "KAPALI"}</span>
                            <button
                                onClick={() => toggleActive(cat)}
                                className={`w-10 h-5 rounded-full p-1 transition-colors duration-200 flex items-center ${cat.active ? "bg-green-500" : "bg-slate-300"}`}
                            >
                                <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform duration-200 ${cat.active ? "translate-x-5" : "translate-x-0"}`} />
                            </button>
                        </div>
                    </div>
                </div>
                {hasChildren && isExpanded && (
                    <div className="ml-8 mt-1 border-l-2 border-slate-100 pl-4 space-y-1">
                        {cat.children.map((child: any) => renderCategory(child, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    const filtered = filterCategories(categories);

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-20 px-4 animate-in fade-in duration-500">
            <PageHeader
                title="Katalog Standartları"
                description="UNSPSC tabanlı ürün kütüphanesini yönetin."
                actions={
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => router.push("/urun/liste")}>Ürün Listesi</Button>
                        <Button
                            variant="gradient"
                            onClick={handleSync}
                            loading={syncing}
                            className="from-blue-600 to-indigo-700"
                        >
                            🔄 Standart Listeyi Yenile
                        </Button>
                    </div>
                }
            />

            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-4 items-center animate-in slide-in-from-top-2">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center text-xl shrink-0">💡</div>
                <div className="text-sm text-blue-800 leading-relaxed">
                    <b>Bilgi:</b> Bu liste uluslararası <b>UNSPSC</b> standartlarına göre sabitlenmiştir. Manuel kategori eklemek yerine, şirketinizin iş kolu dışındaki kategorileri pasife alarak listenizi sadeleştirebilirsiniz.
                </div>
            </div>

            <Card className="p-4 border-slate-200 shadow-sm overflow-hidden">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
                    <div className="relative w-full md:max-w-md">
                        <Input
                            placeholder="Katalog adı veya kodu ile ara..."
                            value={search}
                            onChange={e => { setSearch(e.target.value); if (e.target.value) expandAll(); }}
                            className="pl-10 h-11 bg-slate-50 border-transparent focus:bg-white transition-all"
                        />
                        <span className="absolute left-3 top-3 text-lg opacity-40">🔍</span>
                    </div>
                    <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={expandAll} className="h-9 px-4">Tümünü Aç</Button>
                        <Button size="sm" variant="outline" onClick={collapseAll} className="h-9 px-4">Kapat</Button>
                    </div>
                </div>

                {loading ? (
                    <div className="py-20 flex flex-col items-center gap-4 text-slate-400">
                        <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-blue-600"></div>
                        <p className="font-medium">Katalog yükleniyor...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <p className="text-slate-500 mb-4">{search ? "Arama sonucu bulunamadı." : "Henüz kategori eklenmemiş."}</p>
                        <Button variant="gradient" onClick={handleSync} loading={syncing}>Standart Listeyi Yükle</Button>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {filtered.map(cat => renderCategory(cat))}
                    </div>
                )}
            </Card>
        </div>
    );
}
