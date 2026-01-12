"use client";
import { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import { Table, THead, TBody, TR, TH, TD, TableContainer } from "@/components/ui/Table";

interface Company {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    taxId: string | null;
    active: boolean;
    _count: {
        orders: number;
    };
}

export default function AdminCompaniesPage() {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/admin/companies")
            .then(res => res.json())
            .then(data => {
                setCompanies(data.companies || []);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="space-y-6">
            <PageHeader
                title="Alıcı Firmalar"
                description="Platformdaki alıcı firmaları görüntüleyin"
            />

            <Card className="p-0 overflow-hidden">
                <TableContainer>
                    <Table>
                        <THead>
                            <TR>
                                <TH>Firma Adı</TH>
                                <TH>E-posta</TH>
                                <TH>Telefon</TH>
                                <TH>Vergi No</TH>
                                <TH>Sipariş</TH>
                                <TH>Durum</TH>
                            </TR>
                        </THead>
                        <TBody>
                            {loading ? (
                                <TR>
                                    <TD colSpan={6} className="text-center py-8">
                                        <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                                    </TD>
                                </TR>
                            ) : companies.length === 0 ? (
                                <TR>
                                    <TD colSpan={6} className="text-center py-8 text-slate-400">
                                        Henüz kayıtlı firma bulunmuyor.
                                    </TD>
                                </TR>
                            ) : (
                                companies.map((company) => (
                                    <TR key={company.id}>
                                        <TD className="font-medium">{company.name}</TD>
                                        <TD>{company.email || "-"}</TD>
                                        <TD>{company.phone || "-"}</TD>
                                        <TD className="font-mono text-sm">{company.taxId || "-"}</TD>
                                        <TD>
                                            <Badge variant="default">{company._count.orders}</Badge>
                                        </TD>
                                        <TD>
                                            <Badge variant={company.active ? "success" : "error"}>
                                                {company.active ? "Aktif" : "Pasif"}
                                            </Badge>
                                        </TD>
                                    </TR>
                                ))
                            )}
                        </TBody>
                    </Table>
                </TableContainer>
            </Card>
        </div>
    );
}
