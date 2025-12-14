"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import IconButton from "@/components/ui/IconButton";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { fetchJsonWithRetry } from "@/lib/http";

type OptionItem = { id: string; label: string; active: boolean; email?: string | null; sort?: number };

const dropdownCategories = [
    { key: "ilgiliKisi", name: "İlgili Kişi", icon: "👤" },
    { key: "birim", name: "Talep Eden Birim", icon: "🏢" },
    { key: "durum", name: "Talep Durumu", icon: "📊" },
    { key: "paraBirimi", name: "Para Birimi", icon: "💰" },
    { key: "birimTipi", name: "Birim Tipi (Adet/Kg)", icon: "📦" },
    { key: "siparisDurumu", name: "Sipariş Durumu", icon: "🛒" },
    { key: "alimYontemi", name: "Alım Yöntemi", icon: "📋" },
    { key: "yonetmelikMaddesi", name: "Yönetmelik Maddesi", icon: "📜" },
    { key: "tedarikci", name: "Tedarikçi", icon: "🏭" },
    { key: "firma", name: "Firma Listesi", icon: "🏛️" },
];

export default function ListelerPage() {
    const router = useRouter();
    const { show } = useToast();

    const [activeCategory, setActiveCategory] = useState("ilgiliKisi");
    const [options, setOptions] = useState<Record<string, OptionItem[]>>({});
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"add" | "edit">("add");
    const [editValue, setEditValue] = useState("");
    const [editEmail, setEditEmail] = useState("");
    const [editId, setEditId] = useState<string | null>(null);

    // Firma fields
    const [companyFields, setCompanyFields] = useState({ taxId: "", address: "", taxOffice: "", phone: "", email: "" });

    const loadOptions = async () => {
        setLoading(true);
        try {
            const data = await fetchJsonWithRetry<any>("/api/options");
            setOptions(data);
        } catch (e) {
            show({ title: "Hata", description: "Listeler yüklenemedi", variant: "error" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOptions();
    }, []);

    const handleSave = async () => {
        if (!editValue.trim()) {
            show({ title: "Hata", description: "Değer boş olamaz", variant: "warning" });
            return;
        }
        try {
            const method = modalMode === "add" ? "POST" : "PUT";
            const body: any = { category: activeCategory, label: editValue };
            if (modalMode === "edit" && editId) body.id = editId;
            if (activeCategory === "birim") body.email = editEmail || null;
            if (activeCategory === "firma") Object.assign(body, companyFields);

            await fetchJsonWithRetry("/api/options", { method, body: JSON.stringify(body) });
            show({ title: "Başarılı", description: modalMode === "add" ? "Eklendi" : "Güncellendi", variant: "success" });
            setModalOpen(false);
            loadOptions();
        } catch (e: any) {
            show({ title: "Hata", description: e.message || "Kaydedilemedi", variant: "error" });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Silmek istediğinize emin misiniz?")) return;
        try {
            await fetchJsonWithRetry(`/api/options?id=${id}`, { method: "DELETE" });
            show({ title: "Silindi", variant: "success" });
            loadOptions();
        } catch (e: any) {
            show({ title: "Hata", description: e.message, variant: "error" });
        }
    };

    const handleToggle = async (id: string, current: boolean) => {
        try {
            await fetchJsonWithRetry("/api/options", {
                method: "PATCH",
                body: JSON.stringify({ id, active: !current })
            });
            loadOptions();
        } catch (e: any) {
            show({ title: "Hata", description: e.message, variant: "error" });
        }
    };

    const openAddModal = () => {
        setModalMode("add");
        setEditId(null);
        setEditValue("");
        setEditEmail("");
        setCompanyFields({ taxId: "", address: "", taxOffice: "", phone: "", email: "" });
        setModalOpen(true);
    };

    const openEditModal = (item: OptionItem) => {
        setModalMode("edit");
        setEditId(item.id);
        setEditValue(item.label);
        setEditEmail(item.email || "");
        setModalOpen(true);
    };

    const list = options[activeCategory] || [];
    const categoryInfo = dropdownCategories.find(c => c.key === activeCategory);

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-10 animate-in fade-in duration-500">
            <PageHeader
                title="Sistem Listeleri"
                description="Dropdown menülerde kullanılan listeleri yönetin."
                actions={
                    <Button variant="outline" onClick={() => router.push("/ayarlar")}>
                        ← Geri
                    </Button>
                }
            />

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Category Sidebar */}
                <Card className="w-full lg:w-72 shrink-0 p-4 h-fit">
                    <div className="space-y-1">
                        {dropdownCategories.map((cat) => (
                            <button
                                key={cat.key}
                                onClick={() => setActiveCategory(cat.key)}
                                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-3 ${activeCategory === cat.key
                                        ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                                        : "hover:bg-slate-100 text-slate-600 hover:text-slate-900"
                                    }`}
                            >
                                <span className="text-lg">{cat.icon}</span>
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </Card>

                {/* Content Area */}
                <Card className="flex-1 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <span className="text-xl">{categoryInfo?.icon}</span>
                                {categoryInfo?.name}
                            </h3>
                            <p className="text-sm text-slate-500">{list.length} kayıt</p>
                        </div>
                        <Button onClick={openAddModal}>Yeni Ekle</Button>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-10">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : list.length === 0 ? (
                        <div className="text-center py-10 text-slate-500">
                            <p className="mb-4">Bu kategoride henüz kayıt yok.</p>
                            <Button onClick={openAddModal}>İlk Kaydı Ekle</Button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {list.map((item) => (
                                <div
                                    key={item.id}
                                    className={`flex items-center justify-between p-3 rounded-lg border ${item.active ? "bg-white border-slate-200" : "bg-slate-100 border-slate-300 opacity-60"
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="font-medium text-slate-800">{item.label}</span>
                                        {activeCategory === "birim" && item.email && (
                                            <span className="text-xs text-slate-500">{item.email}</span>
                                        )}
                                        <Badge variant={item.active ? "success" : "default"} className="text-xs">
                                            {item.active ? "Aktif" : "Pasif"}
                                        </Badge>
                                    </div>
                                    <div className="flex gap-2">
                                        <IconButton variant="ghost" icon="edit" size="sm" onClick={() => openEditModal(item)} />
                                        <IconButton variant="ghost" icon="power" size="sm" onClick={() => handleToggle(item.id, item.active)} />
                                        <IconButton variant="ghost" icon="trash" size="sm" tone="danger" onClick={() => handleDelete(item.id)} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>

            {/* Modal */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={modalMode === "add" ? "Yeni Kayıt Ekle" : "Kaydı Düzenle"}
                footer={
                    <>
                        <Button variant="outline" onClick={() => setModalOpen(false)}>İptal</Button>
                        <Button onClick={handleSave}>Kaydet</Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <Input
                        label={activeCategory === "firma" ? "Firma Adı" : "Değer / İsim"}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        autoFocus
                    />
                    {activeCategory === "birim" && (
                        <Input label="E-posta (Opsiyonel)" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
                    )}
                    {activeCategory === "firma" && (
                        <>
                            <Input label="Vergi No" value={companyFields.taxId} onChange={(e) => setCompanyFields({ ...companyFields, taxId: e.target.value })} />
                            <Input label="Vergi Dairesi" value={companyFields.taxOffice} onChange={(e) => setCompanyFields({ ...companyFields, taxOffice: e.target.value })} />
                            <Input label="Adres" value={companyFields.address} onChange={(e) => setCompanyFields({ ...companyFields, address: e.target.value })} />
                            <Input label="Telefon" value={companyFields.phone} onChange={(e) => setCompanyFields({ ...companyFields, phone: e.target.value })} />
                            <Input label="E-posta" value={companyFields.email} onChange={(e) => setCompanyFields({ ...companyFields, email: e.target.value })} />
                        </>
                    )}
                </div>
            </Modal>
        </div>
    );
}
