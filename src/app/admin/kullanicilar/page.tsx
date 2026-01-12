"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import IconButton from "@/components/ui/IconButton";
import { TableContainer, Table, THead, TBody, TR, TH, TD } from "@/components/ui/Table";
import { useToast } from "@/components/ui/Toast";
import Modal from "@/components/ui/Modal";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Select from "@/components/ui/Select";

type UserRow = {
  id: string;
  username: string;
  email: string | null;
  createdAt: string;
  role: string;
  unitId: string | null;
  unit: { id: string; label: string } | null;
};

export default function UsersPage() {
  const router = useRouter();
  const { show } = useToast();
  const [items, setItems] = useState<UserRow[]>([]);
  const [units, setUnits] = useState<{ id: string; label: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");

  // Create / Edit State
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<UserRow | null>(null);

  const [formUsername, setFormUsername] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState("user");
  const [formUnitId, setFormUnitId] = useState("");
  const [roles, setRoles] = useState<{ id: string; key: string; name: string }[]>([]);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/kullanicilar?excludeSuppliers=true&q=${encodeURIComponent(q)}`, { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const json = await res.json();
      setItems(json.items || []);
    } catch (e) {
      show({ title: "Hata", description: "Liste yüklenemedi", variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [q, show]);

  const loadUnits = useCallback(async () => {
    try {
      const res = await fetch("/api/options");
      if (res.ok) {
        const json = await res.json();
        if (json.birim) setUnits(json.birim.map((u: any) => ({ id: u.id, label: u.label })));
      }
    } catch { }
  }, []);

  const loadRoles = useCallback(async () => {
    try {
      const res = await fetch("/api/roles");
      if (res.ok) {
        const json = await res.json();
        setRoles((json.items || []).map((r: any) => ({ id: r.id, key: r.key, name: r.name })));
      }
    } catch { }
  }, []);

  useEffect(() => {
    load();
    loadUnits();
    loadRoles();
  }, [load, loadUnits, loadRoles]);

  const handleOpenCreate = () => {
    setEditTarget(null);
    setFormUsername("");
    setFormEmail("");
    setFormPassword("");
    setFormRole("user");
    setFormUnitId("");
    setModalOpen(true);
  };

  const handleOpenEdit = (u: UserRow) => {
    setEditTarget(u);
    setFormUsername(u.username);
    setFormEmail(u.email || "");
    setFormPassword(""); // Don't show password
    setFormRole(u.role || "user");
    setFormUnitId(u.unitId || "");
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!formUsername || !formEmail) return;

    try {
      const payload: any = {
        username: formUsername,
        email: formEmail,
        role: formRole,
        unitId: formUnitId || null
      };
      if (formPassword) payload.password = formPassword;

      let url = "/api/kullanicilar";
      let method = "POST";

      if (editTarget) {
        url = "/api/kullanicilar";
        method = "PUT";
        payload.id = editTarget.id;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        show({ title: "Başarılı", description: editTarget ? "Kullanıcı güncellendi" : "Kullanıcı oluşturuldu", variant: "success" });
        setModalOpen(false);
        load();
      } else {
        const j = await res.json();
        show({ title: "Hata", description: j.error || "İşlem başarısız", variant: "error" });
      }

    } catch (e: any) {
      show({ title: "Hata", description: e.message, variant: "error" });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/kullanicilar?id=${deleteTarget.id}`, { method: "DELETE" });
      if (res.ok) {
        show({ title: "Başarılı", description: "Kullanıcı silindi", variant: "success" });
        setDeleteConfirmOpen(false);
        load();
      } else {
        show({ title: "Hata", description: "Silinemedi", variant: "error" });
      }
    } catch { }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <PageHeader
        title="Kullanıcı Yönetimi"
        description="Sistem kullanıcılarını ve birim atamalarını yönetin"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/ayarlar")}>← Geri</Button>
            <Button variant="primary" onClick={handleOpenCreate}>Yeni Kullanıcı</Button>
          </div>
        }
      />

      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex gap-4">
          <Input
            placeholder="Ara..."
            value={q}
            onChange={e => setQ(e.target.value)}
            className="max-w-sm bg-white"
          />
        </div>
        <TableContainer>
          <Table>
            <THead>
              <TR>
                <TH className="pl-6">Kullanıcı Adı</TH>
                <TH>E-Posta</TH>
                <TH>Yetki Seviyesi</TH>
                <TH>Birim</TH>
                <TH className="text-right pr-6">İşlemler</TH>
              </TR>
            </THead>
            <TBody>
              {items.map(u => (
                <TR key={u.id}>
                  <TD className="pl-6 font-medium text-slate-700">{u.username}</TD>
                  <TD className="text-slate-600">{u.email || "-"}</TD>
                  <TD>
                    <Badge variant={u.role === "admin" ? "error" : "default"}>
                      {u.role === "admin" ? "Yönetici" : "Standart"}
                    </Badge>
                  </TD>
                  <TD className="text-slate-600">{u.unit?.label || "-"}</TD>
                  <TD className="text-right pr-6">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="ghost" onClick={() => handleOpenEdit(u)}>Düzenle</Button>
                      <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => { setDeleteTarget(u); setDeleteConfirmOpen(true); }}>Sil</Button>
                    </div>
                  </TD>
                </TR>
              ))}
              {items.length === 0 && !loading && (
                <TR><TD colSpan={5} className="pl-6 text-slate-500 italic p-4">Kullanıcı bulunamadı</TD></TR>
              )}
            </TBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Edit/Create Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? "Kullanıcı Düzenle" : "Yeni Kullanıcı"}>
        <div className="space-y-4 p-1">
          <Input label="Kullanıcı Adı" value={formUsername} onChange={e => setFormUsername(e.target.value)} />
          <Input label="E-Posta" value={formEmail} onChange={e => setFormEmail(e.target.value)} />
          <Input label="Şifre" type="password" placeholder={editTarget ? "(Değiştirmek için girin)" : ""} value={formPassword} onChange={e => setFormPassword(e.target.value)} />

          <Select label="Yetki Seviyesi" value={formRole} onChange={e => setFormRole(e.target.value)}>
            {roles.length > 0 ? (
              roles.map(r => (
                <option key={r.id} value={r.key}>{r.name}</option>
              ))
            ) : (
              <>
                <option value="user">Standart Kullanıcı</option>
                <option value="manager">Yönetici / Birim Müdürü</option>
                <option value="admin">Sistem Yöneticisi (Admin)</option>
              </>
            )}
          </Select>

          <Select label="Bağlı Birim" value={formUnitId} onChange={e => setFormUnitId(e.target.value)}>
            <option value="">Seçiniz</option>
            {units.map(unit => (
              <option key={unit.id} value={unit.id}>{unit.label}</option>
            ))}
          </Select>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setModalOpen(false)}>İptal</Button>
            <Button variant="primary" onClick={handleSave}>Kaydet</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} title="Kullanıcıyı Sil">
        <div className="space-y-4">
          <p>"{deleteTarget?.username}" adlı kullanıcıyı silmek istediğinize emin misiniz?</p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>Vazgeç</Button>
            <Button variant="danger" onClick={handleDelete}>Sil</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
