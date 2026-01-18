"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Skeleton from "@/components/ui/Skeleton";
import Icon from "@/components/ui/Icon";

interface Contract {
    id: string;
    number: string;
    title: string;
    parties: string;
    startDate: string;
    endDate: string | null;
    status: string;
    type: string;
    notes: string | null;
    responsible: { username: string } | null;
    order: { barcode: string } | null;
    createdAt: string;
}

export default function SozlesmeDetayPage() {
    const params = useParams();
    const router = useRouter();
    const [contract, setContract] = useState<Contract | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!params.id) return;
        fetch(`/api/finans/sozlesmeler/${params.id}`)
            .then(r => {
                if (!r.ok) throw new Error("Sözleşme bulunamadı");
                return r.json();
            })
            .then(d => setContract(d))
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, [params.id]);

    if (loading) return <div className="p-10"><Skeleton height={400} /></div>;
    if (error) return (
        <div className="p-10 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => router.back()}>Geri Dön</Button>
        </div>
    );
    if (!contract) return null;

    const isExpired = contract.endDate && new Date(contract.endDate) < new Date();
    const isExpiringSoon = contract.endDate &&
        (new Date(contract.endDate).getTime() - new Date().getTime()) < (30 * 24 * 60 * 60 * 1000);

    const getStatusBadge = () => {
        if (isExpired) return <Badge variant="error">SÜRESİ DOLDU</Badge>;
        if (isExpiringSoon) return <Badge variant="warning">KRİTİK</Badge>;
        if (contract.status === "ACTIVE") return <Badge variant="success">AKTİF</Badge>;
        return <Badge variant="default">{contract.status}</Badge>;
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-10">
            <PageHeader
                title={contract.title}
                description={`Sözleşme No: ${contract.number}`}
                actions={
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => router.push(`/finans/sozlesmeler/${params.id}/duzenle`)}>
                            <Icon name="edit" className="w-4 h-4 mr-2" />
                            Düzenle
                        </Button>
                        <Button variant="outline" onClick={() => router.push("/finans/sozlesmeler")}>
                            Listeye Dön
                        </Button>
                    </div>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4">
                    <div className="text-xs text-slate-500 uppercase font-bold mb-1">Durum</div>
                    {getStatusBadge()}
                </Card>
                <Card className="p-4">
                    <div className="text-xs text-slate-500 uppercase font-bold mb-1">Tip</div>
                    <div className="font-semibold">{contract.type || "Genel"}</div>
                </Card>
                <Card className="p-4">
                    <div className="text-xs text-slate-500 uppercase font-bold mb-1">Sorumlu</div>
                    <div className="font-semibold">{contract.responsible?.username || "Atanmamış"}</div>
                </Card>
            </div>

            <Card className="p-6">
                <h3 className="font-bold text-lg mb-4">Sözleşme Bilgileri</h3>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                        <dt className="text-slate-500">Taraflar</dt>
                        <dd className="font-medium mt-1">{contract.parties}</dd>
                    </div>
                    <div>
                        <dt className="text-slate-500">Başlangıç Tarihi</dt>
                        <dd className="font-medium mt-1">{new Date(contract.startDate).toLocaleDateString("tr-TR")}</dd>
                    </div>
                    <div>
                        <dt className="text-slate-500">Bitiş Tarihi</dt>
                        <dd className="font-medium mt-1">
                            {contract.endDate ? new Date(contract.endDate).toLocaleDateString("tr-TR") : "Süresiz"}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-slate-500">Bağlı Sipariş</dt>
                        <dd className="font-medium mt-1">{contract.order?.barcode || "-"}</dd>
                    </div>
                    {contract.notes && (
                        <div className="md:col-span-2">
                            <dt className="text-slate-500">Notlar</dt>
                            <dd className="font-medium mt-1 whitespace-pre-wrap">{contract.notes}</dd>
                        </div>
                    )}
                </dl>
            </Card>

            <Card className="p-4 bg-slate-50">
                <div className="text-xs text-slate-500">
                    Oluşturulma: {new Date(contract.createdAt).toLocaleDateString("tr-TR")}
                </div>
            </Card>
        </div>
    );
}
