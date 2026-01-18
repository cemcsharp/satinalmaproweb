"use client";
import React, { useEffect, useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";

interface Department {
    id: string;
    name: string;
    code: string;
    createdAt: string;
    _count?: { users: number };
}

export default function DepartmanlarPage() {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: "", code: "" });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadDepartments();
    }, []);

    const loadDepartments = async () => {
        try {
            const res = await fetch("/api/departman");
            if (res.ok) {
                const data = await res.json();
                setDepartments(data.items || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.code) return;
        setSaving(true);
        try {
            const res = await fetch("/api/departman", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setShowModal(false);
                setFormData({ name: "", code: "" });
                loadDepartments();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    return (
        <section className="space-y-6 max-w-5xl mx-auto">
            <PageHeader
                title="Departman Yönetimi"
                description="Şirket departmanlarını ve birimlerini yönetin."
                actions={
                    <button
                        onClick={() => setShowModal(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        <Icon name="plus" className="w-4 h-4" /> Yeni Departman
                    </button>
                }
            />

            <Card>
                {loading ? (
                    <div className="p-10 text-center text-slate-400">Yükleniyor...</div>
                ) : departments.length === 0 ? (
                    <div className="p-10 text-center text-slate-400">Henüz departman tanımlı değil.</div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-100 text-left text-slate-500">
                                <th className="p-3">Departman Adı</th>
                                <th className="p-3">Kod</th>
                                <th className="p-3">Kullanıcı Sayısı</th>
                                <th className="p-3">Oluşturulma</th>
                            </tr>
                        </thead>
                        <tbody>
                            {departments.map(d => (
                                <tr key={d.id} className="border-b border-slate-50 hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-800">{d.name}</td>
                                    <td className="p-3 text-slate-600">{d.code}</td>
                                    <td className="p-3 text-slate-600">{d._count?.users || 0}</td>
                                    <td className="p-3 text-slate-400">{new Date(d.createdAt).toLocaleDateString("tr-TR")}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </Card>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Yeni Departman Ekle</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Departman Adı</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                                    placeholder="Örn: Satınalma"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Departman Kodu</label>
                                <input
                                    type="text"
                                    value={formData.code}
                                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                                    placeholder="Örn: SAT"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                İptal
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={saving}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                {saving ? "Kaydediliyor..." : "Kaydet"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
