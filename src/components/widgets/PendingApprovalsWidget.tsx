"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";

interface PendingItem {
    id: string;
    barcode: string;
    subject: string;
    status: string;
    unit: string;
    owner: string;
    date: string;
    budget: number;
}

export default function PendingApprovalsWidget() {
    const router = useRouter();
    const [pending, setPending] = useState<PendingItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userRole, setUserRole] = useState("");

    useEffect(() => {
        const fetchPending = async () => {
            try {
                const res = await fetch("/api/approvals/pending");
                if (!res.ok) throw new Error("Veri alınamadı");
                const data = await res.json();
                setPending(data.pending || []);
                setUserRole(data.userRole || "");
            } catch (e: any) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };
        fetchPending();
    }, []);

    const getRoleLabel = () => {
        switch (userRole) {
            case "admin": return "Sistem Yöneticisi";
            case "birim_muduru": return "Birim Müdürü";
            case "genel_mudur": return "Genel Müdür";
            case "satinalma_muduru": return "Satınalma Müdürü";
            default: return "";
        }
    };

    const statusVariant = (s: string): "default" | "success" | "warning" | "error" | "info" => {
        const v = s.toLowerCase();
        if (v.includes("onay")) return "warning";
        if (v.includes("havuz")) return "info";
        if (v.includes("taslak")) return "default";
        return "default";
    };

    if (loading) {
        return (
            <Card title="Bekleyen Onaylar" className="p-5">
                <div className="space-y-3">
                    {[1, 2, 3].map(i => <Skeleton key={i} height={48} />)}
                </div>
            </Card>
        );
    }

    if (error) {
        return (
            <Card title="Bekleyen Onaylar" className="p-5">
                <p className="text-sm text-red-500">{error}</p>
            </Card>
        );
    }

    if (pending.length === 0) {
        return (
            <Card title="Bekleyen Onaylar" className="p-5">
                <div className="flex flex-col items-center justify-center py-6 text-center">
                    <svg className="w-12 h-12 text-green-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-slate-600">Bekleyen onay yok</p>
                    <p className="text-xs text-slate-400 mt-1">Tüm talepler işlenmiş</p>
                </div>
            </Card>
        );
    }

    return (
        <Card
            title={
                <div className="flex items-center justify-between">
                    <span>Bekleyen Onaylar</span>
                    <Badge variant="warning" className="ml-2">{pending.length}</Badge>
                </div>
            }
            className="p-0"
        >
            {getRoleLabel() && (
                <div className="px-5 py-2 bg-slate-50 border-b text-xs text-slate-500">
                    👤 {getRoleLabel()} olarak görüntülüyorsunuz
                </div>
            )}
            <ul className="divide-y divide-slate-100">
                {pending.slice(0, 5).map((item) => (
                    <li
                        key={item.id}
                        className="px-5 py-3 hover:bg-slate-50 cursor-pointer transition-colors"
                        onClick={() => router.push(`/talep/detay/${item.id}`)}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-slate-900 text-sm">{item.barcode}</span>
                                    <Badge variant={statusVariant(item.status)} className="text-xs">
                                        {item.status}
                                    </Badge>
                                </div>
                                <p className="text-xs text-slate-500 truncate mt-0.5">{item.subject}</p>
                                <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                                    <span>{item.unit}</span>
                                    <span>•</span>
                                    <span>{item.owner}</span>
                                </div>
                            </div>
                            <div className="text-right ml-4">
                                <div className="font-semibold text-sm text-slate-700">
                                    {item.budget.toLocaleString("tr-TR")} ₺
                                </div>
                                <div className="text-xs text-slate-400">
                                    {new Date(item.date).toLocaleDateString("tr-TR")}
                                </div>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
            {pending.length > 5 && (
                <div className="px-5 py-3 border-t bg-slate-50">
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => router.push("/talep/liste")}
                    >
                        Tümünü Gör ({pending.length} talep)
                    </Button>
                </div>
            )}
        </Card>
    );
}
