"use client";
import { useEffect, useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import IconButton from "@/components/ui/IconButton";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { fetchJsonWithRetry } from "@/lib/http";

type Role = {
    id: string;
    name: string;
    key: string;
    description: string | null;
    permissions: Record<string, string[]>;
    isSystem: boolean;
    userCount: number;
};

type Module = { key: string; name: string };

const ACTIONS = ["read", "write", "delete"];
const ACTION_LABELS: Record<string, string> = {
    read: "Okuma",
    write: "Yazma",
    delete: "Silme"
};

export default function RolesPage() {
    const { show } = useToast();
    const [roles, setRoles] = useState<Role[]>([]);
    const [modules, setModules] = useState<Module[]>([]);
    const [loading, setLoading] = useState(false);

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<Role | null>(null);
    const [formName, setFormName] = useState("");
    const [formKey, setFormKey] = useState("");
    const [formDescription, setFormDescription] = useState("");
    const [formPermissions, setFormPermissions] = useState<Record<string, string[]>>({});

    const load = async () => {
        setLoading(true);
        try {
            const data = await fetchJsonWithRetry<any>("/api/roller");
            setRoles(data.items || []);
            setModules(data.modules || []);
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
        setFormPermissions({});
        setModalOpen(true);
    };

    const openEdit = (role: Role) => {
        setEditTarget(role);
        setFormName(role.name);
        setFormKey(role.key);
        setFormDescription(role.description || "");
        setFormPermissions(role.permissions || {});
        setModalOpen(true);
    };

    const togglePermission = (moduleKey: string, action: string) => {
        setFormPermissions(prev => {
            const current = prev[moduleKey] || [];
            if (current.includes(action)) {
                return { ...prev, [moduleKey]: current.filter(a => a !== action) };
            } else {
                return { ...prev, [moduleKey]: [...current, action] };
            }
        });
    };

    const handleSave = async () => {
        if (!formName || !formKey) {
            show({ title: "Hata", description: "Ad ve anahtar gerekli", variant: "error" });
            return;
        }

        try {
            const payload = {
                id: editTarget?.id,
                name: formName,
                key: formKey,
                description: formDescription,
                permissions: formPermissions
            };

            const method = editTarget ? "PUT" : "POST";
            await fetchJsonWithRetry("/api/roller", {
                method,
                body: JSON.stringify(payload)
            });

            show({ title: "Başarılı", description: editTarget ? "Rol güncellendi" : "Rol oluşturuldu", variant: "success" });
            setModalOpen(false);
            load();
        } catch (e: any) {
            show({ title: "Hata", description: e.message || "Kayıt başarısız", variant: "error" });
        }
    };

    const handleDelete = async (role: Role) => {
        if (role.isSystem) {
            show({ title: "Hata", description: "Sistem rolleri silinemez", variant: "error" });
            return;
        }
        if (!confirm(`"${role.name}" rolünü silmek istediğinize emin misiniz?`)) return;

        try {
            await fetchJsonWithRetry(`/api/roller?id=${role.id}`, { method: "DELETE" });
            show({ title: "Başarılı", description: "Rol silindi", variant: "success" });
            load();
        } catch (e: any) {
            show({ title: "Hata", description: e.message || "Silme başarısız", variant: "error" });
        }
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <PageHeader
                title="Rol Yönetimi"
                description="Kullanıcı rollerini ve izinlerini yönetin"
                actions={<Button onClick={openCreate} className="bg-blue-600 text-white hover:bg-blue-700">Yeni Rol</Button>}
            />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {roles.map(role => (
                    <Card key={role.id} className="relative group hover:shadow-lg transition-all">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="font-bold text-lg text-slate-800">{role.name}</h3>
                                <code className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{role.key}</code>
                            </div>
                            {role.isSystem && (
                                <Badge variant="info" className="bg-blue-100 text-blue-700 border-blue-200 text-xs">Sistem</Badge>
                            )}
                        </div>

                        {role.description && (
                            <p className="text-sm text-slate-600 mb-4">{role.description}</p>
                        )}

                        <div className="text-xs text-slate-500 mb-4">
                            <span className="font-medium">{role.userCount}</span> kullanıcı
                        </div>

                        <div className="flex flex-wrap gap-1 mb-4">
                            {Object.entries(role.permissions || {}).map(([mod, actions]) => (
                                actions.length > 0 && (
                                    <span key={mod} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                                        {mod}: {(actions as string[]).join(", ")}
                                    </span>
                                )
                            ))}
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

            {/* Role Modal */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editTarget ? "Rol Düzenle" : "Yeni Rol"}
                size="lg"
            >
                <div className="space-y-6">
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
                            disabled={editTarget?.isSystem}
                        />
                    </div>

                    <Input
                        label="Açıklama"
                        value={formDescription}
                        onChange={e => setFormDescription(e.target.value)}
                        placeholder="Bu rolün kısa açıklaması"
                    />

                    {/* Permission Matrix */}
                    <div>
                        <h4 className="font-semibold text-slate-800 mb-3">İzin Matrisi</h4>
                        <div className="border border-slate-200 rounded-lg overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium text-slate-600">Modül</th>
                                        {ACTIONS.map(action => (
                                            <th key={action} className="px-4 py-3 text-center font-medium text-slate-600 w-24">
                                                {ACTION_LABELS[action]}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {modules.map(mod => (
                                        <tr key={mod.key} className="hover:bg-slate-50/50">
                                            <td className="px-4 py-3 font-medium text-slate-700">{mod.name}</td>
                                            {ACTIONS.map(action => {
                                                const checked = (formPermissions[mod.key] || []).includes(action);
                                                return (
                                                    <td key={action} className="px-4 py-3 text-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => togglePermission(mod.key, action)}
                                                            className={`w-6 h-6 rounded border-2 transition-all ${checked
                                                                    ? "bg-blue-600 border-blue-600 text-white"
                                                                    : "border-slate-300 hover:border-blue-400"
                                                                }`}
                                                        >
                                                            {checked && (
                                                                <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            )}
                                                        </button>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                        <Button variant="outline" onClick={() => setModalOpen(false)}>İptal</Button>
                        <Button onClick={handleSave} className="bg-blue-600 text-white hover:bg-blue-700">Kaydet</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
