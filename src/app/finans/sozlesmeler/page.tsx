"use client";
import { useEffect, useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import Skeleton from "@/components/ui/Skeleton";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

interface Contract {
    id: string;
    number: string;
    title: string;
    parties: string;
    startDate: string;
    endDate: string | null;
    status: string;
    isExpiringSoon: boolean;
    responsible: string;
    orderNo: string | null;
    type: string;
}

export default function SozlesmeYonetimiPage() {
    const [data, setData] = useState<Contract[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/finans/sozlesmeler")
            .then(r => r.json())
            .then(d => {
                if (d.items) setData(d.items);
            })
            .catch(e => console.error(e))
            .finally(() => setLoading(false));
    }, []);

    const getStatusBadge = (c: Contract) => {
        if (c.status === "EXPIRED") return <Badge variant="destructive">SÜRESİ DOLDU</Badge>;
        if (c.isExpiringSoon) return <Badge variant="warning">KRİTİK (AZ KALDI)</Badge>;
        if (c.status === "ACTIVE") return <Badge variant="success">AKTİF</Badge>;
        return <Badge variant="default">{c.status}</Badge>;
    };

    if (loading) return <div className="p-10"><Skeleton height={400} /></div>;

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-10">
            <PageHeader
                title="Sözleşme Yönetimi"
                description="Kurumsal tedarik sözleşmelerinin merkezi takibi ve uyum yönetimi."
                actions={
                    <Button
                        variant="primary"
                        className="!gap-2"
                        onClick={() => alert("Sözleşme ekleme modülü hazırlanıyor. Sipariş onaylandığında sözleşme otomatik oluşturulur.")}
                    >
                        <Icon name="plus" className="w-4 h-4" />
                        Yeni Sözleşme Ekle
                    </Button>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4 border-slate-100 flex items-center gap-4 bg-white/50 backdrop-blur-sm">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                        <Icon name="clipboard" className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-2xl font-black text-slate-800 tracking-tighter">{data.length}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Toplam Sözleşme</div>
                    </div>
                </Card>
                <Card className="p-4 border-slate-100 flex items-center gap-4 bg-white/50 backdrop-blur-sm">
                    <div className="w-10 h-10 bg-sky-50 rounded-lg flex items-center justify-center text-blue-600">
                        <Icon name="check-circle" className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-2xl font-black text-blue-600 tracking-tighter">{data.filter(s => s.status === "ACTIVE" && !s.isExpiringSoon).length}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sağlıklı Aktif</div>
                    </div>
                </Card>
                <Card className="p-4 border-slate-100 flex items-center gap-4 bg-white/50 backdrop-blur-sm">
                    <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center text-blue-600">
                        <Icon name="clock" className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-2xl font-black text-blue-600 tracking-tighter">{data.filter(s => s.isExpiringSoon).length}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Yaklaşan Bitiş</div>
                    </div>
                </Card>
                <Card className="p-4 border-slate-100 flex items-center gap-4 bg-white/50 backdrop-blur-sm">
                    <div className="w-10 h-10 bg-rose-50 rounded-lg flex items-center justify-center text-rose-600">
                        <Icon name="alert-circle" className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-2xl font-black text-rose-600 tracking-tighter">{data.filter(s => s.status === "EXPIRED").length}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Süresi Dolan</div>
                    </div>
                </Card>
            </div>

            <Card className="p-0 overflow-hidden border-slate-100">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-100 text-left">
                                <th className="p-4 text-slate-500 font-bold uppercase tracking-widest text-[10px]">Sözleşme No & Başlık</th>
                                <th className="p-4 text-slate-500 font-bold uppercase tracking-widest text-[10px]">Taraflar</th>
                                <th className="p-4 text-slate-500 font-bold uppercase tracking-widest text-[10px]">Geçerlilik Aralığı</th>
                                <th className="p-4 text-center text-slate-500 font-bold uppercase tracking-widest text-[10px]">Durum</th>
                                <th className="p-4 text-slate-500 font-bold uppercase tracking-widest text-[10px]">Sorumlu</th>
                                <th className="p-4 text-center text-slate-500 font-bold uppercase tracking-widest text-[10px]">Bağlı Sipariş</th>
                                <th className="p-4 text-center w-[100px]"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {data.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-10 text-center text-slate-400">Kayıtlı sözleşme bulunamadı.</td>
                                </tr>
                            ) : (
                                data.map(s => (
                                    <tr key={s.id} className={`hover:bg-slate-50/50 transition-colors group ${s.isExpiringSoon ? "bg-amber-50/20" : s.status === "EXPIRED" ? "bg-rose-50/20" : ""}`}>
                                        <td className="p-4">
                                            <div className="font-bold text-slate-900 leading-tight underline decoration-slate-200 underline-offset-4 decoration-2">{s.title}</div>
                                            <div className="text-[10px] text-indigo-600 font-black uppercase tracking-tighter mt-1">{s.number}</div>
                                        </td>
                                        <td className="p-4 max-w-[200px]">
                                            <div className="text-xs text-slate-600 truncate">{s.parties}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col text-xs font-medium">
                                                <span className="text-slate-700">{new Date(s.startDate).toLocaleDateString("tr-TR")}</span>
                                                <span className="text-slate-400">↓</span>
                                                <span className={s.isExpiringSoon ? "text-blue-600 font-bold" : s.status === "EXPIRED" ? "text-rose-600 font-bold" : "text-slate-700"}>
                                                    {s.endDate ? new Date(s.endDate).toLocaleDateString("tr-TR") : "Süresiz"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            {getStatusBadge(s)}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-600 uppercase">
                                                    {s.responsible.slice(0, 2)}
                                                </div>
                                                <span className="text-xs text-slate-600 font-medium">{s.responsible}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            {s.orderNo ? (
                                                <Badge variant="outline" className="text-blue-600 border-blue-100 bg-blue-50 font-mono text-[10px]">
                                                    {s.orderNo}
                                                </Badge>
                                            ) : (
                                                <span className="text-slate-300 text-[10px] font-bold uppercase tracking-tighter">İlişki Yok</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all shadow-sm border border-transparent hover:border-slate-100">
                                                    <Icon name="edit" className="w-4 h-4" />
                                                </button>
                                                <button className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-all shadow-sm border border-transparent hover:border-slate-100">
                                                    <Icon name="trash" className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card title="Sözleşme Hatırlatıcı" className="bg-gradient-to-br from-slate-50 to-indigo-50/30 border-slate-100">
                    <p className="text-sm text-slate-600 leading-relaxed">
                        Sistem, bitişine <span className="text-indigo-600 font-black">30 günden az</span> kalan sözleşmeleri otomatik olarak "Kritik" durumuna alır ve sorumlu kişiye bildirim gönderir.
                    </p>
                </Card>
                <Card title="Hukuki Uyum" className="flex items-center gap-3 text-blue-700 bg-sky-50/50 border-sky-100">
                    <Icon name="check-circle" className="w-6 h-6 shrink-0" />
                    <p className="text-xs font-semibold leading-relaxed">
                        Tüm sözleşmeler dijital olarak imzalanmış (veya taranmış) olarak sisteme yüklenebilir ve Audit Loglar üzerinden erişim tarihçesi izlenebilir.
                    </p>
                </Card>
            </div>
        </div>
    );
}
