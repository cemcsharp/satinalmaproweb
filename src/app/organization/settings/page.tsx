"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import { Table, THead, TBody, TR, TH, TD, TableContainer } from "@/components/ui/Table";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

interface User {
    id: string;
    username: string;
    email: string;
    roleRef?: { name: string, key: string };
    department?: { name: string };
    isActive: boolean;
    createdAt: string;
}

interface Invitation {
    id: string;
    email: string;
    role: { name: string };
    status: string;
    createdAt: string;
    expiresAt: string;
}

interface Tenant {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    taxId: string | null;
    taxOffice: string | null;
    address: string | null;
    website: string | null;
    isBuyer: boolean;
    isSupplier: boolean;
}

export default function OrganizationSettingsPage() {
    const { data: session } = useSession();
    const { show } = useToast();

    // Tabs: 'general' | 'users'
    const [activeTab, setActiveTab] = useState<'general' | 'users'>('general');

    // Data states
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [roles, setRoles] = useState<{ id: string, name: string }[]>([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Modal states
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [selectedRoleId, setSelectedRoleId] = useState("");

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [settingsRes, usersRes, rolesRes] = await Promise.all([
                fetch("/api/tenant/settings"),
                fetch("/api/tenant/users"),
                fetch("/api/admin/roles")
            ]);

            let currentTenant: Tenant | null = null;

            if (settingsRes.ok) {
                currentTenant = await settingsRes.json();
                setTenant(currentTenant);
            }

            if (usersRes.ok) {
                const data = await usersRes.json();
                setUsers(data.users || []);
                setInvitations(data.invitations || []);
            }

            if (rolesRes.ok) {
                const data = await rolesRes.json();
                const allRoles = data.items || [];

                // Filter roles based on Tenant Type
                if (currentTenant) {
                    const filteredRoles = allRoles.filter((r: any) => {
                        // Always exclude super admin
                        if (r.key === 'admin') return false;

                        // Whitelist core business roles (even if isSystem=true)
                        if (currentTenant?.isBuyer && r.key.startsWith('buyer_')) return true;
                        if (currentTenant?.isSupplier && r.key.startsWith('supplier_')) return true;

                        // Also whitelist specific roles
                        if (currentTenant?.isBuyer && r.key === 'satinalma_muduru') return true;

                        // Exclude other system roles (unless whitelisted above)
                        if (r.isSystem) return false;

                        return true;
                    });
                    setRoles(filteredRoles);
                } else {
                    setRoles(allRoles);
                }
            } else {
                // Fallback roles
                setRoles([
                    { id: "buyer_admin", name: "Alıcı Yöneticisi" },
                    { id: "supplier_admin", name: "Tedarikçi Yöneticisi" }
                ]);
            }
        } catch (error) {
            console.error(error);
            show({ title: "Hata", description: "Veriler yüklenemedi", variant: "error" });
        } finally {
            setLoading(false);
        }
    }, [show]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSaveSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tenant) return;
        setSaving(true);
        try {
            const res = await fetch("/api/tenant/settings", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(tenant)
            });
            if (res.ok) {
                show({ title: "Başarılı", description: "Ayarlar güncellendi", variant: "success" });
            } else {
                show({ title: "Hata", description: "Güncellenemedi", variant: "error" });
            }
        } catch (error) {
            console.error(error);
            show({ title: "Hata", description: "Bir hata oluştu", variant: "error" });
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteInvite = async (id: string) => {
        if (!confirm("Bu davetiyeyi iptal etmek istediğinize emin misiniz?")) return;

        try {
            const res = await fetch(`/api/tenant/invite?id=${id}`, {
                method: "DELETE"
            });

            if (res.ok) {
                show({ title: "Başarılı", description: "Davetiye iptal edildi", variant: "success" });
                fetchData(); // Refresh list
            } else {
                const err = await res.json();
                show({ title: "Hata", description: err.error || "İptal edilemedi", variant: "error" });
            }
        } catch (error) {
            console.error(error);
            show({ title: "Hata", description: "Bir hata oluştu", variant: "error" });
        }
    };

    const handleSendInvite = async () => {
        if (!inviteEmail || !selectedRoleId) {
            show({ title: "Uyarı", description: "Lütfen email ve rol seçin", variant: "warning" });
            return;
        }
        setSaving(true);
        try {
            const res = await fetch("/api/tenant/invite", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: inviteEmail, roleId: selectedRoleId })
            });
            if (res.ok) {
                show({ title: "Başarılı", description: "Davetiye gönderildi", variant: "success" });
                setIsInviteModalOpen(false);
                setInviteEmail("");
                fetchData();
            } else {
                const err = await res.json();
                show({ title: "Hata", description: err.error || "Davetiye gönderilemedi", variant: "error" });
            }
        } catch (error) {
            console.error(error);
            show({ title: "Hata", description: "Bir hata oluştu", variant: "error" });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-10 text-center text-slate-500">Yükleniyor...</div>;

    return (
        <div className="space-y-6">
            <PageHeader
                title="Organizasyon Ayarları"
                description="Firmanızı ve ekibinizi yönetin"
                variant="gradient"
            />

            {/* Tab Buttons */}
            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab('general')}
                    className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'general' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Firma Bilgileri
                </button>
                <button
                    onClick={() => setActiveTab('users')}
                    className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'users' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Kullanıcı Yönetimi
                </button>
            </div>

            {activeTab === 'general' && tenant && (
                <Card variant="glass" className="max-w-4xl">
                    <form onSubmit={handleSaveSettings} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Firma Adı"
                                value={tenant.name}
                                onChange={e => setTenant({ ...tenant, name: e.target.value })}
                                required
                            />
                            <Input
                                label="Firma E-posta"
                                value={tenant.email}
                                onChange={e => setTenant({ ...tenant, email: e.target.value })}
                                required
                            />
                            <Input
                                label="Telefon"
                                value={tenant.phone || ""}
                                onChange={e => setTenant({ ...tenant, phone: e.target.value })}
                            />
                            <Input
                                label="Web Sitesi"
                                value={tenant.website || ""}
                                onChange={e => setTenant({ ...tenant, website: e.target.value })}
                            />
                            <Input
                                label="Vergi Kimlik No"
                                value={tenant.taxId || ""}
                                onChange={e => setTenant({ ...tenant, taxId: e.target.value })}
                            />
                            <Input
                                label="Vergi Dairesi"
                                value={tenant.taxOffice || ""}
                                onChange={e => setTenant({ ...tenant, taxOffice: e.target.value })}
                            />
                        </div>
                        <Input
                            label="Firma Adresi"
                            value={tenant.address || ""}
                            onChange={e => setTenant({ ...tenant, address: e.target.value })}
                            className="w-full"
                        />
                        <div className="flex justify-end">
                            <Button type="submit" disabled={saving}>
                                {saving ? "Kaydediliyor..." : "Ayarları Kaydet"}
                            </Button>
                        </div>
                    </form>
                </Card>
            )}

            {activeTab === 'users' && (
                <div className="space-y-6">
                    <Card variant="glass" title="Ekip Üyeleri">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-slate-500 text-sm">Firmanıza bağlı toplam {users.length} kullanıcı</h4>
                            <Button size="sm" onClick={() => setIsInviteModalOpen(true)}>Yeni Davet Gönder</Button>
                        </div>
                        <TableContainer>
                            <Table>
                                <THead>
                                    <TR>
                                        <TH>İsim</TH>
                                        <TH>E-posta</TH>
                                        <TH>Rol</TH>
                                        <TH>Durum</TH>
                                        <TH>Kayıt Tarihi</TH>
                                    </TR>
                                </THead>
                                <TBody>
                                    {users.map(u => (
                                        <TR key={u.id}>
                                            <TD><div className="font-medium">{u.username}</div></TD>
                                            <TD>{u.email}</TD>
                                            <TD><Badge variant="default">{u.roleRef?.name || "Kullanıcı"}</Badge></TD>
                                            <TD>
                                                <Badge variant={u.isActive ? "success" : "default"}>
                                                    {u.isActive ? "Aktif" : "Pasif"}
                                                </Badge>
                                            </TD>
                                            <TD className="text-xs text-slate-500">
                                                {new Date(u.createdAt).toLocaleDateString("tr-TR")}
                                            </TD>
                                        </TR>
                                    ))}
                                </TBody>
                            </Table>
                        </TableContainer>
                    </Card>

                    {invitations.length > 0 && (
                        <Card variant="glass" title="Bekleyen Davetiyeler">
                            <TableContainer>
                                <Table>
                                    <THead>
                                        <TR>
                                            <TH>E-posta</TH>
                                            <TH>Atanan Rol</TH>
                                            <TH>Son Tarih</TH>
                                            <TH>Durum</TH>
                                            <TH></TH>
                                        </TR>
                                    </THead>
                                    <TBody>
                                        {invitations.map(i => (
                                            <TR key={i.id}>
                                                <TD>{i.email}</TD>
                                                <TD>{i.role.name}</TD>
                                                <TD className="text-xs">
                                                    {new Date(i.expiresAt).toLocaleDateString("tr-TR")}
                                                </TD>
                                                <TD><Badge variant="warning">Beklemede</Badge></TD>
                                                <TD className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                        onClick={() => handleDeleteInvite(i.id)}
                                                    >
                                                        İptal Et
                                                    </Button>
                                                </TD>
                                            </TR>
                                        ))}
                                    </TBody>
                                </Table>
                            </TableContainer>
                        </Card>
                    )}
                </div>
            )}

            {/* Invite Modal */}
            <Modal
                isOpen={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
                title="Yeni Çalışan Davet Et"
            >
                <div className="space-y-4 p-4">
                    <Input
                        label="E-posta Adresi"
                        placeholder="ornek@firma.com"
                        value={inviteEmail}
                        onChange={e => setInviteEmail(e.target.value)}
                    />
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-500 uppercase">Görev / Rol</label>
                        <select
                            className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                            value={selectedRoleId}
                            onChange={e => setSelectedRoleId(e.target.value)}
                        >
                            <option value="">Rol Seçin...</option>
                            {roles.map(r => (
                                <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex gap-2 pt-4">
                        <Button variant="outline" className="flex-1" onClick={() => setIsInviteModalOpen(false)}>İptal</Button>
                        <Button className="flex-1" onClick={handleSendInvite} disabled={saving}>
                            {saving ? "Gönderiliyor..." : "Daveti Gönder"}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
