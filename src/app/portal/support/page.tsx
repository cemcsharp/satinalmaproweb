"use client";
import React, { useEffect, useState } from "react";

type Ticket = {
    id: string;
    subject: string;
    message: string;
    status: string;
    priority: string;
    createdAt: string;
    updatedAt: string;
};

const statusColors: Record<string, string> = {
    "OPEN": "bg-blue-100 text-blue-700",
    "IN_PROGRESS": "bg-amber-100 text-amber-700",
    "RESOLVED": "bg-emerald-100 text-emerald-700",
};

const statusLabels: Record<string, string> = {
    "OPEN": "Açık",
    "IN_PROGRESS": "İşlemde",
    "RESOLVED": "Çözüldü",
};

const priorityColors: Record<string, string> = {
    "LOW": "bg-slate-100 text-slate-600",
    "NORMAL": "bg-blue-50 text-blue-600",
    "HIGH": "bg-red-100 text-red-600",
};

const priorityLabels: Record<string, string> = {
    "LOW": "Düşük",
    "NORMAL": "Normal",
    "HIGH": "Yüksek",
};

export default function SupportPage() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({ subject: "", message: "", priority: "NORMAL" });
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    useEffect(() => {
        loadTickets();
    }, []);

    const loadTickets = async () => {
        try {
            const res = await fetch("/api/portal/support");
            if (res.ok) {
                const data = await res.json();
                setTickets(data.tickets || []);
            }
        } catch (err) {
            console.error("Failed to load tickets", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.subject.trim() || !formData.message.trim()) {
            setMessage({ type: "error", text: "Konu ve mesaj alanları zorunludur." });
            return;
        }

        setSubmitting(true);
        setMessage(null);
        try {
            const res = await fetch("/api/portal/support", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setMessage({ type: "success", text: "Destek talebiniz oluşturuldu!" });
                setFormData({ subject: "", message: "", priority: "NORMAL" });
                setShowForm(false);
                loadTickets();
            } else {
                const err = await res.json();
                setMessage({ type: "error", text: err.message || "Talep oluşturulamadı." });
            }
        } catch {
            setMessage({ type: "error", text: "Bir hata oluştu." });
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("tr-TR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Destek Merkezi</h1>
                    <p className="text-slate-500 text-sm mt-1">Sorularınız veya sorunlarınız için destek talebi oluşturun.</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Yeni Talep
                </button>
            </div>

            {/* Success/Error Message */}
            {message && (
                <div className={`p-4 rounded-xl text-sm font-medium ${message.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                    {message.text}
                </div>
            )}

            {/* New Ticket Form */}
            {showForm && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-800 mb-6">Yeni Destek Talebi</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Konu</label>
                            <input
                                type="text"
                                value={formData.subject}
                                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm"
                                placeholder="Talebinizin konusu..."
                                maxLength={200}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Mesaj</label>
                            <textarea
                                value={formData.message}
                                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                                rows={5}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm resize-none"
                                placeholder="Sorununuzu veya talebinizi detaylı açıklayın..."
                                maxLength={2000}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Öncelik</label>
                            <select
                                value={formData.priority}
                                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm bg-white"
                            >
                                <option value="LOW">Düşük</option>
                                <option value="NORMAL">Normal</option>
                                <option value="HIGH">Yüksek</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
                            >
                                İptal
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center gap-2"
                            >
                                {submitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                                Gönder
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Tickets List */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                    <h2 className="text-sm font-semibold text-slate-700">Talepleriniz ({tickets.length})</h2>
                </div>
                {loading ? (
                    <div className="p-12 flex flex-col items-center justify-center">
                        <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mb-4" />
                        <p className="text-slate-400 text-sm">Talepler yükleniyor...</p>
                    </div>
                ) : tickets.length === 0 ? (
                    <div className="p-12 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-700 mb-2">Henüz Destek Talebi Yok</h3>
                        <p className="text-sm text-slate-400 max-w-sm">
                            Sorularınız veya sorunlarınız için yukarıdaki butonu kullanarak destek talebi oluşturabilirsiniz.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {tickets.map((ticket) => (
                            <div key={ticket.id} className="p-6 hover:bg-slate-50/50 transition-colors">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${statusColors[ticket.status] || "bg-slate-100 text-slate-600"}`}>
                                                {statusLabels[ticket.status] || ticket.status}
                                            </span>
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${priorityColors[ticket.priority] || "bg-slate-100 text-slate-600"}`}>
                                                {priorityLabels[ticket.priority] || ticket.priority}
                                            </span>
                                        </div>
                                        <h3 className="text-base font-semibold text-slate-800 mb-1">{ticket.subject}</h3>
                                        <p className="text-sm text-slate-500 line-clamp-2">{ticket.message}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-xs text-slate-400">{formatDate(ticket.createdAt)}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
