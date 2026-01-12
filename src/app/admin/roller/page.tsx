"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { PERMISSION_CATEGORIES } from "@/lib/permissions";

type Role = {
    id: string;
    name: string;
    key: string;
    description: string | null;
    permissions: string[];
    isSystem: boolean;
    userCount: number;
};

// Local definition removed - using centralized ones from @/lib/permissions

export default function RolesPage() {
    const router = useRouter();
    const { show } = useToast();
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(false);

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<Role | null>(null);
    const [formName, setFormName] = useState("");
    const [formKey, setFormKey] = useState("");
    const [formDescription, setFormDescription] = useState("");
    const [formPermissions, setFormPermissions] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/roles");
            const data = await res.json();
            setRoles(data.items || []);
        } catch (e) {
            show({ title: "Hata", description: "Roller yüklenemedi", variant: "error" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const openCreate = () => {
        setEditTarget(null);
        setFormName("");
        setFormKey("");
        setFormDescription("");
        setFormPermissions([]);
        setModalOpen(true);
    };

    const openEdit = (role: Role) => {
        setEditTarget(role);
        setFormName(role.name);
        setFormKey(role.key);
        setFormDescription(role.description || "");
        setFormPermissions(Array.isArray(role.permissions) ? role.permissions : []);
        setModalOpen(true);
    };

    const togglePermission = (perm: string) => {
        setFormPermissions(prev =>
            prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
        );
    };

    const toggleCategoryAll = (categoryKey: string, perms: string[]) => {
        const allSelected = perms.every(p => formPermissions.includes(p));
        if (allSelected) {
            setFormPermissions(prev => prev.filter(p => !perms.includes(p)));
        } else {
            setFormPermissions(prev => [...new Set([...prev, ...perms])]);
        }
    };

    const handleSave = async () => {
        if (!formName || !formKey) {
            show({ title: "Hata", description: "Ad ve anahtar gerekli", variant: "error" });
            return;
        }

        setSaving(true);
        try {
            const endpoint = editTarget ? `/api/roles/${editTarget.id}` : "/api/roles";
            const method = editTarget ? "PATCH" : "POST";

            const res = await fetch(endpoint, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formName,
                    key: formKey,
                    description: formDescription,
                    permissions: formPermissions
                })
            });

            if (res.ok) {
                show({ title: "Başarılı", description: editTarget ? "Rol güncellendi" : "Rol oluşturuldu", variant: "success" });
                setModalOpen(false);
                load();
            } else {
                const err = await res.json();
                throw new Error(err.message || "Kaydetme başarısız");
            }
        } catch (e: any) {
            show({ title: "Hata", description: e.message, variant: "error" });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (role: Role) => {
        if (role.isSystem) {
            show({ title: "Hata", description: "Sistem rolleri silinemez", variant: "error" });
            return;
        }
        if (!confirm(`"${role.name}" rolünü silmek istediğinize emin misiniz?`)) return;

        try {
            const res = await fetch(`/api/roles/${role.id}`, { method: "DELETE" });
            if (res.ok) {
                show({ title: "Başarılı", description: "Rol silindi", variant: "success" });
                load();
            } else {
                const err = await res.json();
                throw new Error(err.message || "Silme başarısız");
            }
        } catch (e: any) {
            show({ title: "Hata", description: e.message, variant: "error" });
        }
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-10">
            <PageHeader
                title="Rol Yönetimi"
                description="Kullanıcı rollerini ve izinlerini yönetin"
                actions={
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => router.push("/ayarlar")}>← Geri</Button>
                        <Button variant="gradient" onClick={openCreate}>+ Yeni Rol</Button>
                    </div>
                }
            />

            {loading ? (
                <div className="text-center py-10 text-slate-500">Yükleniyor...</div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {roles.map(role => (
                        <Card key={role.id} className="p-5 relative group hover:shadow-lg transition-all">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="font-bold text-lg text-slate-800">{role.name}</h3>
                                    <code className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{role.key}</code>
                                </div>
                                {role.isSystem && (
                                    <Badge variant="info" className="text-xs">Sistem</Badge>
                                )}
                            </div>

                            {role.description && (
                                <p className="text-sm text-slate-600 mb-4">{role.description}</p>
                            )}

                            <div className="text-xs text-slate-500 mb-4">
                                <span className="font-medium">{role.userCount}</span> kullanıcı
                            </div>

                            <div className="flex flex-wrap gap-1 mb-4">
                                {(Array.isArray(role.permissions) ? role.permissions.slice(0, 5) : []).map((perm: string) => (
                                    <span key={perm} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                                        {perm}
                                    </span>
                                ))}
                                {Array.isArray(role.permissions) && role.permissions.length > 5 && (
                                    <span className="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded">
                                        +{role.permissions.length - 5} daha
                                    </span>
                                )}
                            </div>

                            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                                <Button variant="ghost" size="sm" onClick={() => openEdit(role)}>Düzenle</Button>
                                {!role.isSystem && (
                                    <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => handleDelete(role)}>Sil</Button>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Role Modal */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editTarget ? "Rol Düzenle" : "Yeni Rol"}
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Rol Adı"
                            value={formName}
                            onChange={e => setFormName(e.target.value)}
                            placeholder="Örn: Satın Alma Uzmanı"
                        />
                        <Input
                            label="Anahtar"
                            value={formKey}
                            onChange={e => setFormKey(e.target.value.toLowerCase().replace(/\s+/g, "_"))}
                            placeholder="Örn: satin_alma_uzman"
                            disabled={!!editTarget?.isSystem}
                        />
                    </div>

                    <Input
                        label="Açıklama"
                        value={formDescription}
                        onChange={e => setFormDescription(e.target.value)}
                        placeholder="Bu rolün kısa açıklaması"
                    />

                    {/* Permission Categories */}
                    <div className="border-t pt-4">
                        <h4 className="font-medium mb-3">İzinler</h4>
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                            {Object.entries(PERMISSION_CATEGORIES).map(([catKey, cat]) => {
                                const perms = cat.permissions.map(p => p.key);
                                const allSelected = perms.every(p => formPermissions.includes(p));
                                const someSelected = perms.some(p => formPermissions.includes(p));
                                return (
                                    <div key={catKey} className="border rounded p-3">
                                        <label className="flex items-center gap-2 font-medium mb-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={allSelected}
                                                ref={el => {
                                                    if (el) el.indeterminate = someSelected && !allSelected;
                                                }}
                                                onChange={() => toggleCategoryAll(catKey, perms)}
                                                className="w-4 h-4"
                                            />
                                            {cat.label}
                                        </label>
                                        <div className="flex flex-wrap gap-2 ml-6">
                                            {cat.permissions.map(perm => (
                                                <label key={perm.key} className="flex items-center gap-1 text-xs cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={formPermissions.includes(perm.key)}
                                                        onChange={() => togglePermission(perm.key)}
                                                        className="w-3 h-3"
                                                    />
                                                    {perm.label}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                        <Button variant="outline" onClick={() => setModalOpen(false)}>İptal</Button>
                        <Button variant="gradient" onClick={handleSave} loading={saving}>Kaydet</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
