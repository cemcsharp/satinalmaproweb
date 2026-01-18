
"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import Icon from "@/components/ui/Icon";

interface Category {
    id: string;
    name: string;
    parentId: string | null;
    children: Category[];
}

export default function CategoryManagementPage() {
    const { show } = useToast();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    // Selection & Editing State
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [editMode, setEditMode] = useState<"create" | "edit" | null>(null);

    // Form State
    const [formName, setFormName] = useState("");
    const [formParentId, setFormParentId] = useState<string | null>(null);

    // Expand/Collapse State
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/tedarikci/kategori");
            if (res.ok) {
                const data = await res.json();
                setCategories(data);
                // Auto expand all for visibility
                const allIds: Record<string, boolean> = {};
                const traverse = (cats: Category[]) => {
                    cats.forEach(c => {
                        allIds[c.id] = true;
                        if (c.children) traverse(c.children);
                    });
                };
                traverse(data);
                setExpanded(allIds);
            }
        } catch (error) {
            show({ title: "Hata", description: "Kategoriler yüklenemedi", variant: "error" });
        } finally {
            setLoading(false);
        }
    };

    const toggleExpand = (id: string) => {
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleCreateNewRoot = () => {
        setEditMode("create");
        setFormName("");
        setFormParentId(null);
        setSelectedCategory(null);
    };

    const handleAddSubCategory = (parent: Category) => {
        setEditMode("create");
        setFormName("");
        setFormParentId(parent.id);
        setSelectedCategory(parent);
    };

    const handleEdit = (cat: Category) => {
        setEditMode("edit");
        setFormName(cat.name);
        setFormParentId(cat.parentId);
        setSelectedCategory(cat);
    };

    const handleDelete = async (cat: Category) => {
        if (!confirm(`"${cat.name}" kategorisini silmek istediğinize emin misiniz?`)) return;

        try {
            const res = await fetch(`/api/tedarikci/kategori?id=${cat.id}`, {
                method: "DELETE"
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Silinemedi");
            }

            show({ title: "Silindi", description: "Kategori başarıyla silindi.", variant: "success" });
            fetchCategories();
            if (selectedCategory?.id === cat.id) {
                setSelectedCategory(null);
                setEditMode(null);
            }
        } catch (e: any) {
            show({ title: "Hata", description: e.message, variant: "error" });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formName.trim()) return;

        try {
            const method = editMode === "create" ? "POST" : "PUT";
            const payload: any = { name: formName, parentId: formParentId };
            if (editMode === "edit" && selectedCategory) {
                payload.id = selectedCategory.id;
            }

            const res = await fetch("/api/tedarikci/kategori", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("İşlem başarısız");

            show({ title: "Başarılı", description: "Kategori güncellendi.", variant: "success" });
            fetchCategories();
            setEditMode(null);
            setFormName("");
        } catch (e) {
            show({ title: "Hata", description: "Kaydedilemedi", variant: "error" });
        }
    };

    const renderTree = (nodes: Category[], depth = 0) => {
        return (
            <ul className={`space-y-1 ${depth > 0 ? "ml-6 border-l border-slate-200 pl-2" : ""}`}>
                {nodes.map(node => (
                    <li key={node.id}>
                        <div
                            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors group
                    ${selectedCategory?.id === node.id ? "bg-blue-50 border border-blue-200" : "hover:bg-slate-50 border border-transparent"}
                `}
                            onClick={() => setSelectedCategory(node)}
                        >
                            <div className="flex items-center gap-2">
                                {node.children && node.children.length > 0 ? (
                                    <button onClick={(e) => { e.stopPropagation(); toggleExpand(node.id); }} className="p-0.5 hover:bg-slate-200 rounded">
                                        {expanded[node.id] ? <Icon name="chevron-down" className="w-4 h-4 text-slate-400" /> : <Icon name="chevron-right" className="w-4 h-4 text-slate-400" />}
                                    </button>
                                ) : <span className="w-4" />}

                                <Icon name="folder" className={`w-5 h-5 ${selectedCategory?.id === node.id ? "text-blue-500" : "text-slate-400"}`} />
                                <span className={`text-sm ${selectedCategory?.id === node.id ? "font-semibold text-blue-700" : "text-slate-700"}`}>
                                    {node.name}
                                </span>
                                <span className="text-xs text-slate-400 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    (ID: {node.id.slice(-4)})
                                </span>
                            </div>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleAddSubCategory(node); }}
                                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-sky-50 rounded"
                                    title="Alt Kategori Ekle"
                                >
                                    <Icon name="folder-plus" className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleEdit(node); }}
                                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                                    title="Düzenle"
                                >
                                    <Icon name="pencil" className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDelete(node); }}
                                    className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded"
                                    title="Sil"
                                >
                                    <Icon name="trash" className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Recursion for Children */}
                        {node.children && node.children.length > 0 && expanded[node.id] && (
                            renderTree(node.children, depth + 1)
                        )}
                    </li>
                ))}
            </ul>
        );
    };

    return (
        <section className="space-y-6">
            <PageHeader
                title="Kategori Yönetimi"
                description="Tedarikçi sektör ve kategorilerini yapılandırın"
                breadcrumbs={[{ label: "Tedarikçiler", href: "/tedarikci/liste" }, { label: "Kategoriler" }]}
                actions={
                    <Button onClick={handleCreateNewRoot} className="bg-blue-600 text-white">
                        <Icon name="folder-plus" className="w-4 h-4 mr-2" />
                        Ana Kategori Ekle
                    </Button>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                {/* Left: Tree View */}
                <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6 min-h-[500px]">
                    {loading ? <div className="text-center text-slate-500 py-10">Yükleniyor...</div> : (
                        categories.length > 0 ? renderTree(categories) : (
                            <div className="text-center py-10 text-slate-500">
                                Henüz kategori yok. "Ana Kategori Ekle" ile başlayın.
                            </div>
                        )
                    )}
                </div>

                {/* Right: Action Panel */}
                <div className="md:col-span-1">
                    {editMode ? (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sticky top-6">
                            <h3 className="text-lg font-semibold mb-4 border-b border-slate-100 pb-3">
                                {editMode === "create" ? "Yeni Kategori" : "Kategoriyi Düzenle"}
                            </h3>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold uppercase text-slate-500">Üst Kategori</label>
                                    <div className="text-sm font-medium text-slate-800 p-2 bg-slate-50 rounded border border-slate-200">
                                        {formParentId ? (
                                            // Find parent name logic could be here, but for simplicity showing 'Seçili Üst Kategori'
                                            // In a real app we'd map ID to name or show the selected object name
                                            loading ? "..." : (editMode === 'create' && selectedCategory ? selectedCategory.name : (editMode === 'edit' && categories.find(c => c.id === formParentId)?.name || "Kök Dizin"))
                                        ) : "Ana Kategori (Kök Dizin)"}
                                    </div>
                                </div>

                                <Input
                                    label="Kategori Adı"
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value)}
                                    placeholder="Örn: Lojistik"
                                    autoFocus
                                />

                                <div className="flex gap-2 pt-2">
                                    <Button type="button" variant="outline" className="flex-1" onClick={() => setEditMode(null)}>iptal</Button>
                                    <Button type="submit" className="flex-1 bg-blue-600 text-white">Kaydet</Button>
                                </div>
                            </form>
                        </div>
                    ) : (
                        <div className="bg-slate-50 rounded-xl border border-dashed border-slate-300 p-6 text-center text-slate-500">
                            <Icon name="folder" className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                            <p className="text-sm">
                                Bir kategori seçerek veya <br /> "Ekle" butonlarını kullanarak işlem yapabilirsiniz.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
