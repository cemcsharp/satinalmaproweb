import React from "react";
import Badge from "@/components/ui/Badge";
import IconButton from "@/components/ui/IconButton";
import { TR, TD } from "@/components/ui/Table";

export interface Order {
    id: string;
    barcode: string;
    date: string;
    status: string;
    method: string;
    total: number;
    currency: string;
    reviewPending?: boolean;
    hasEvaluation?: boolean;
}

export default function ModernTableRow({ item, onView, onEdit, onDelete, onReview, statusVariant }: {
    item: Order;
    onView: (item: Order) => void;
    onEdit: (item: Order) => void;
    onDelete: (item: Order) => void;
    onReview: (item: Order) => void;
    statusVariant: (status: string) => "success" | "warning" | "error" | "info";
}) {
    return (
        <TR className="group hover:shadow-sm transition-shadow">
            {/* Barkod - Icon + Text */}
            <TD>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                        </svg>
                    </div>
                    <span className="font-semibold text-slate-700">{item.barcode}</span>
                </div>
            </TD>

            {/* Tarih - Icon + Formatted Date */}
            <TD>
                <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm text-slate-600">
                        {new Date(item.date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                </div>
            </TD>

            {/* Durum - Modern Badge */}
            <TD>
                <Badge variant={statusVariant(item.status)} className="shadow-sm font-medium">
                    {item.status}
                </Badge>
            </TD>

            {/* Yöntem - Icon + Text */}
            <TD>
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center flex-shrink-0">
                        <svg className="w-3 h-3 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                    </div>
                    <span className="text-sm text-slate-600">{item.method}</span>
                </div>
            </TD>

            {/* Toplam - Gradient Background */}
            <TD>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    <span className="font-semibold text-green-700">
                        {item.total.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                </div>
            </TD>

            {/* Para Birimi - Badge */}
            <TD>
                <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium border border-blue-200">
                    {item.currency}
                </span>
            </TD>

            {/* İşlemler */}
            <TD>
                <div className="flex items-center gap-1">
                    {item.reviewPending && (
                        <Badge variant="warning" className="text-xs">Değerlendirme bekliyor</Badge>
                    )}
                    <IconButton icon="eye" label="Detay" size="sm" onClick={() => onView(item)} />
                    <IconButton icon="edit" label="Güncelle" size="sm" onClick={() => onEdit(item)} />
                    <IconButton icon="trash" label="Sil" size="sm" tone="danger" onClick={() => onDelete(item)} />
                    {item.status?.toLowerCase() === "tamamlandı" && (
                        <IconButton
                            icon="clipboard"
                            label={item.hasEvaluation ? "Değerlendirmeyi Gör" : "Değerlendir"}
                            size="sm"
                            tone={item.hasEvaluation ? "info" : "success"}
                            onClick={() => onReview(item)}
                        />
                    )}
                </div>
            </TD>
        </TR>
    );
}
