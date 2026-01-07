import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/apiAuth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

export default async function SupplierRfqList() {
    const session = await getSessionUser();

    if (!session) {
        // For now, if no session, we might want to redirect to a generic portal info or login
        // In a real scenario, magic links handle specific RFQs, but for a "Portal", login is expected.
    }

    // Fetch the user's supplier ID
    const user = session ? await prisma.user.findUnique({
        where: { id: session.id },
        select: { supplierId: true, email: true }
    }) : null;

    // If the user is a supplier representative, we filter by supplierId OR email
    // If no session (magic link usage), this page might be empty unless we have a cookie.
    // For this implementation, we'll focus on the data structure.

    const rfqs = await prisma.rfqSupplier.findMany({
        where: user?.supplierId
            ? { supplierId: user.supplierId }
            : (user?.email ? { email: user.email } : { id: 'none' }),
        include: {
            rfq: true,
            offer: true
        },
        orderBy: { createdAt: 'desc' }
    });

    const getStatusBadge = (stage: string) => {
        switch (stage) {
            case "PENDING": return "bg-slate-100 text-slate-600";
            case "SENT": return "bg-blue-100 text-blue-600";
            case "VIEWED": return "bg-amber-100 text-amber-600";
            case "OFFERED": return "bg-emerald-100 text-emerald-600";
            case "DECLINED": return "bg-rose-100 text-rose-600";
            default: return "bg-slate-100 text-slate-600";
        }
    };

    const getStatusLabel = (stage: string) => {
        switch (stage) {
            case "PENDING": return "Hazırlanıyor";
            case "SENT": return "Gönderildi";
            case "VIEWED": return "İncelendi";
            case "OFFERED": return "Teklif Verildi";
            case "DECLINED": return "Reddedildi";
            default: return stage;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Teklif İstekleri (RFQ)</h1>
                    <p className="text-slate-500 text-sm">Size atanan aktif ve geçmiş teklif isteklerinin listesi.</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Kod / Başlık</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Son Tarih</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Durum</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">İşlem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {rfqs.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">
                                        Henüz size atanan bir teklif isteği bulunmamaktadır.
                                    </td>
                                </tr>
                            ) : (
                                rfqs.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-slate-900">{item.rfq.rfxCode}</div>
                                            <div className="text-xs text-slate-500">{item.rfq.title}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {item.rfq.deadline ? (
                                                <div className={`font-medium ${new Date(item.rfq.deadline) < new Date() ? 'text-rose-500' : 'text-slate-700'}`}>
                                                    {format(new Date(item.rfq.deadline), "dd MMMM yyyy", { locale: tr })}
                                                </div>
                                            ) : (
                                                <span className="text-slate-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusBadge(item.stage)}`}>
                                                {getStatusLabel(item.stage)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link
                                                href={`/portal/rfq/${item.token}`}
                                                className="inline-flex items-center justify-center px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all font-semibold text-xs"
                                            >
                                                {item.stage === "OFFERED" ? "Teklifi Gör / Güncelle" : "Teklif Ver"}
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
