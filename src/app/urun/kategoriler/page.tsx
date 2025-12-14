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
    const [flatCategories, setFlatCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"add" | "edit">("add");
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    // Form state
    const [formName, setFormName] = useState("");
    const [formCode, setFormCode] = useState("");
    const [formDescription, setFormDescription] = useState("");
    const [formParentId, setFormParentId] = useState("");
    const [formSortOrder, setFormSortOrder] = useState(0);
    const [saving, setSaving] = useState(false);

    // Fetch categories
    const loadCategories = async () => {
        setLoading(true);
        try {
            // Hiyerarşik
            const res = await fetch("/api/urun/kategori?active=");
            const data = await res.json();
            setCategories(data.items || []);

            // Flat list for parent selection
            const flatRes = await fetch("/api/urun/kategori?flat=true&active=");
            const flatData = await flatRes.json();
            setFlatCategories(flatData.items || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCategories();
    }, []);

    const openAddModal = (parentId?: string) => {
        setModalMode("add");
        setEditingCategory(null);
        setFormName("");
        setFormCode("");
        setFormDescription("");
        setFormParentId(parentId || "");
        setFormSortOrder(0);
        setModalOpen(true);
    };

    const openEditModal = (cat: Category) => {
        setModalMode("edit");
        setEditingCategory(cat);
        setFormName(cat.name);
        setFormCode(cat.code);
        setFormDescription(cat.description || "");
        setFormParentId(cat.parentId || "");
        setFormSortOrder(cat.sortOrder);
        setModalOpen(true);
    };

    const handleSubmit = async () => {
        if (!formName || !formCode) {
            return show({ title: "Kategori adı ve kodu zorunludur", variant: "warning" });
        }

        setSaving(true);
        try {
            const method = modalMode === "add" ? "POST" : "PUT";
            const body: any = {
                name: formName,
                code: formCode.toUpperCase(),
                description: formDescription,
                parentId: formParentId || null,
                sortOrder: formSortOrder
            };
            if (modalMode === "edit" && editingCategory) {
                body.id = editingCategory.id;
            }

            const res = await fetch("/api/urun/kategori", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            const json = await res.json();
            if (res.ok) {
                show({ title: modalMode === "add" ? "Kategori oluşturuldu" : "Kategori güncellendi", variant: "success" });
                setModalOpen(false);
                loadCategories();
            } else {
                throw new Error(json.message || json.error || "Hata");
            }
        } catch (e: any) {
            show({ title: "Hata", description: e.message, variant: "error" });
        } finally {
            setSaving(false);
        }
    };

    const handleToggleActive = async (cat: Category) => {
        try {
            const res = await fetch("/api/urun/kategori", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: cat.id, active: !cat.active })
            });
            if (res.ok) {
                show({ title: cat.active ? "Kategori pasifleştirildi" : "Kategori aktifleştirildi", variant: "success" });
                loadCategories();
            }
        } catch (e: any) {
            show({ title: "Hata", description: e.message, variant: "error" });
        }
    };

    // Recursive render
    const renderCategory = (cat: Category, depth = 0) => (
        <div key={cat.id} style={{ marginLeft: depth * 24 }} className="mb-2">
            <div className={`flex items-center justify-between p-3 rounded-lg border ${cat.active ? "bg-white border-slate-200" : "bg-slate-100 border-slate-300 opacity-60"}`}>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center text-white font-bold text-sm">
                        {cat.code.charAt(0)}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-blue-700">{cat.code}</span>
                            <span className="font-medium text-slate-800">{cat.name}</span>
                            <Badge variant={cat.active ? "success" : "error"} className="text-xs">
                                {cat.active ? "Aktif" : "Pasif"}
                            </Badge>
                            {cat._count && (
                                <Badge variant="default" className="text-xs">{cat._count.products} ürün</Badge>
                            )}
                        </div>
                        {cat.description && <p className="text-xs text-slate-500 mt-0.5">{cat.description}</p>}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" onClick={() => openAddModal(cat.id)}>
                        Alt Kategori Ekle
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => openEditModal(cat)}>
                        Düzenle
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleToggleActive(cat)}>
                        {cat.active ? "Pasifleştir" : "Aktifleştir"}
                    </Button>
                </div>
            </div>
            {cat.children && cat.children.length > 0 && (
                <div className="ml-4 mt-2 border-l-2 border-slate-200 pl-2">
                    {cat.children.map(child => renderCategory(child, depth + 1))}
                </div>
            )}
        </div>
    );

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10 animate-in fade-in duration-500">
            <PageHeader
                title="Ürün Kategorileri"
                description="Ürün kataloğu için kategori hiyerarşisini yönetin."
                actions={
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => router.push("/urun/liste")}>
                            Ürün Listesi
                        </Button>
                        <Button variant="gradient" onClick={() => openAddModal()}>
                            Yeni Kategori Ekle
                        </Button>
                    </div>
                }
            />

            <Card className="p-6">
                {loading ? (
                    <div className="flex justify-center py-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : categories.length === 0 ? (
                    <div className="text-center py-10 text-slate-500">
                        <p className="mb-4">Henüz kategori eklenmemiş.</p>
                        <Button variant="gradient" onClick={() => openAddModal()}>İlk Kategoriyi Ekle</Button>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {categories.map(cat => renderCategory(cat))}
                    </div>
                )}
            </Card>

            {/* Kategori Modal */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={modalMode === "add" ? "Yeni Kategori Ekle" : "Kategori Düzenle"}
            >
                <div className="space-y-4 p-4">
                    <Input
                        label="Kategori Kodu"
                        value={formCode}
                        onChange={e => setFormCode(e.target.value.toUpperCase())}
                        placeholder="Örn: BT, OFIS, KIMYA"
                        disabled={modalMode === "edit"}
                    />
                    <Input
                        label="Kategori Adı"
                        value={formName}
                        onChange={e => setFormName(e.target.value)}
                        placeholder="Örn: Bilgi Teknolojileri"
                    />
                    <Input
                        label="Açıklama (Opsiyonel)"
                        value={formDescription}
                        onChange={e => setFormDescription(e.target.value)}
                        placeholder="Kategori hakkında kısa açıklama"
                    />
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Üst Kategori</label>
                        <select
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                            value={formParentId}
                            onChange={e => setFormParentId(e.target.value)}
                        >
                            <option value="">Ana Kategori (Kök)</option>
                            {flatCategories
                                .filter(c => modalMode === "edit" ? c.id !== editingCategory?.id : true)
                                .map(c => (
                                    <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                                ))}
                        </select>
                    </div>
                    <Input
                        label="Sıralama"
                        type="number"
                        value={formSortOrder}
                        onChange={e => setFormSortOrder(Number(e.target.value))}
                    />
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="outline" onClick={() => setModalOpen(false)}>İptal</Button>
                        <Button variant="gradient" onClick={handleSubmit} loading={saving}>
                            {modalMode === "add" ? "Oluştur" : "Kaydet"}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
