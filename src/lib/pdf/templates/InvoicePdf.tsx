import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Register Roboto font for Turkish character support
Font.register({
    family: 'Roboto',
    fonts: [
        { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 400 },
        { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 700 },
    ]
});

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: 'Roboto',
        fontSize: 10,
        color: '#1e293b',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 25,
        borderBottom: '2px solid #059669',
        paddingBottom: 15,
    },
    logo: {
        fontSize: 18,
        fontWeight: 700,
        color: '#059669',
    },
    subtitle: {
        fontSize: 9,
        color: '#64748b',
        marginTop: 2,
    },
    invoiceInfo: {
        textAlign: 'right',
    },
    invoiceNumber: {
        fontSize: 14,
        fontWeight: 700,
        color: '#0f172a',
    },
    invoiceDate: {
        fontSize: 9,
        color: '#64748b',
        marginTop: 4,
    },
    statusBadge: {
        fontSize: 8,
        color: '#ffffff',
        backgroundColor: '#f59e0b',
        padding: '3 8',
        borderRadius: 3,
        marginTop: 6,
        textAlign: 'center',
    },
    twoColumn: {
        flexDirection: 'row',
        marginBottom: 20,
        gap: 20,
    },
    column: {
        flex: 1,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: 700,
        color: '#0f172a',
        marginBottom: 8,
        backgroundColor: '#f1f5f9',
        padding: 6,
        borderRadius: 3,
    },
    row: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    label: {
        width: 100,
        fontSize: 9,
        color: '#64748b',
    },
    value: {
        flex: 1,
        fontSize: 9,
        color: '#0f172a',
        fontWeight: 500,
    },
    table: {
        marginTop: 10,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#1e293b',
        padding: 8,
        color: '#ffffff',
    },
    tableHeaderCell: {
        fontSize: 9,
        fontWeight: 700,
        color: '#ffffff',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottom: '1px solid #e2e8f0',
        padding: 8,
    },
    tableRowAlt: {
        backgroundColor: '#f8fafc',
    },
    tableCell: {
        fontSize: 9,
        color: '#1e293b',
    },
    col1: { width: '8%' },
    col2: { width: '35%' },
    col3: { width: '12%', textAlign: 'center' },
    col4: { width: '12%', textAlign: 'center' },
    col5: { width: '15%', textAlign: 'right' },
    col6: { width: '18%', textAlign: 'right' },
    totals: {
        marginTop: 15,
        alignItems: 'flex-end',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: 4,
    },
    totalLabel: {
        width: 120,
        fontSize: 10,
        color: '#64748b',
        textAlign: 'right',
        marginRight: 10,
    },
    totalValue: {
        width: 100,
        fontSize: 10,
        fontWeight: 700,
        color: '#0f172a',
        textAlign: 'right',
    },
    grandTotal: {
        marginTop: 8,
        paddingTop: 8,
        borderTop: '2px solid #059669',
    },
    grandTotalValue: {
        fontSize: 14,
        fontWeight: 700,
        color: '#059669',
    },
    paymentInfo: {
        marginTop: 20,
        padding: 12,
        backgroundColor: '#ecfdf5',
        borderRadius: 4,
        borderLeft: '4px solid #059669',
    },
    paymentTitle: {
        fontSize: 10,
        fontWeight: 700,
        color: '#059669',
        marginBottom: 6,
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        textAlign: 'center',
        fontSize: 8,
        color: '#94a3b8',
        borderTop: '1px solid #e2e8f0',
        paddingTop: 10,
    },
    dueWarning: {
        marginTop: 15,
        padding: 10,
        backgroundColor: '#fef2f2',
        borderRadius: 4,
        borderLeft: '4px solid #ef4444',
    },
    dueWarningText: {
        fontSize: 9,
        color: '#b91c1c',
        fontWeight: 700,
    },
});

type InvoiceItem = {
    name: string;
    quantity: number;
    unitPrice: number;
    taxRate?: number;
    totalPrice: number;
};

type InvoicePdfProps = {
    invoice: {
        number: string;
        orderNo: string;
        createdAt: string;
        dueDate: string;
        status: string;
        amount: number;
        vatRate?: number;
        withholdingCode?: string;
        bank?: string;
        items?: InvoiceItem[];
        order?: {
            barcode: string;
            supplier?: { name: string; address?: string; taxId?: string };
            request?: { subject: string; unit?: { label: string } };
        };
    };
    company?: {
        name: string;
        address?: string;
        taxId?: string;
    };
    siteName?: string;
};

export default function InvoicePdf({ invoice, company, siteName = 'satinalma.app' }: InvoicePdfProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('tr-TR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount) + ' TL';
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    const isDue = new Date(invoice.dueDate) <= new Date() && invoice.status !== 'Ödendi';
    const vatAmount = invoice.vatRate ? (invoice.amount * invoice.vatRate / 100) : 0;
    const grandTotal = invoice.amount + vatAmount;

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.logo}>{company?.name || siteName}</Text>
                        <Text style={styles.subtitle}>Fatura</Text>
                    </View>
                    <View style={styles.invoiceInfo}>
                        <Text style={styles.invoiceNumber}>#{invoice.number}</Text>
                        <Text style={styles.invoiceDate}>{formatDate(invoice.createdAt)}</Text>
                        <Text style={[styles.statusBadge,
                        invoice.status === 'Ödendi' ? { backgroundColor: '#22c55e' } :
                            invoice.status === 'İptal' ? { backgroundColor: '#ef4444' } :
                                { backgroundColor: '#f59e0b' }
                        ]}>
                            {invoice.status}
                        </Text>
                    </View>
                </View>

                {/* Two Column Layout */}
                <View style={styles.twoColumn}>
                    {/* Supplier Info */}
                    <View style={styles.column}>
                        <Text style={styles.sectionTitle}>TEDARİKÇİ</Text>
                        <View style={styles.row}>
                            <Text style={styles.label}>Firma:</Text>
                            <Text style={styles.value}>{invoice.order?.supplier?.name || '-'}</Text>
                        </View>
                        {invoice.order?.supplier?.taxId && (
                            <View style={styles.row}>
                                <Text style={styles.label}>Vergi No:</Text>
                                <Text style={styles.value}>{invoice.order.supplier.taxId}</Text>
                            </View>
                        )}
                        {invoice.order?.supplier?.address && (
                            <View style={styles.row}>
                                <Text style={styles.label}>Adres:</Text>
                                <Text style={styles.value}>{invoice.order.supplier.address}</Text>
                            </View>
                        )}
                    </View>

                    {/* Invoice Details */}
                    <View style={styles.column}>
                        <Text style={styles.sectionTitle}>FATURA BİLGİLERİ</Text>
                        <View style={styles.row}>
                            <Text style={styles.label}>Sipariş No:</Text>
                            <Text style={styles.value}>{invoice.orderNo}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.label}>Vade Tarihi:</Text>
                            <Text style={[styles.value, isDue ? { color: '#ef4444' } : {}]}>{formatDate(invoice.dueDate)}</Text>
                        </View>
                        {invoice.withholdingCode && (
                            <View style={styles.row}>
                                <Text style={styles.label}>Tevkifat:</Text>
                                <Text style={styles.value}>{invoice.withholdingCode}</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Due Warning */}
                {isDue && (
                    <View style={styles.dueWarning}>
                        <Text style={styles.dueWarningText}>⚠️ Bu faturanın vade tarihi geçmiştir!</Text>
                    </View>
                )}

                {/* Items Table */}
                {invoice.items && invoice.items.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>FATURA KALEMLERİ</Text>
                        <View style={styles.table}>
                            <View style={styles.tableHeader}>
                                <Text style={[styles.tableHeaderCell, styles.col1]}>#</Text>
                                <Text style={[styles.tableHeaderCell, styles.col2]}>Açıklama</Text>
                                <Text style={[styles.tableHeaderCell, styles.col3]}>Miktar</Text>
                                <Text style={[styles.tableHeaderCell, styles.col4]}>KDV %</Text>
                                <Text style={[styles.tableHeaderCell, styles.col5]}>Birim Fiyat</Text>
                                <Text style={[styles.tableHeaderCell, styles.col6]}>Toplam</Text>
                            </View>
                            {invoice.items.map((item, index) => (
                                <View key={index} style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlt : {}]}>
                                    <Text style={[styles.tableCell, styles.col1]}>{index + 1}</Text>
                                    <Text style={[styles.tableCell, styles.col2]}>{item.name}</Text>
                                    <Text style={[styles.tableCell, styles.col3]}>{item.quantity}</Text>
                                    <Text style={[styles.tableCell, styles.col4]}>{item.taxRate || invoice.vatRate || 20}%</Text>
                                    <Text style={[styles.tableCell, styles.col5]}>{formatCurrency(item.unitPrice)}</Text>
                                    <Text style={[styles.tableCell, styles.col6]}>{formatCurrency(item.totalPrice)}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Totals */}
                <View style={styles.totals}>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Ara Toplam (KDV Hariç):</Text>
                        <Text style={styles.totalValue}>{formatCurrency(invoice.amount)}</Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>KDV ({invoice.vatRate || 20}%):</Text>
                        <Text style={styles.totalValue}>{formatCurrency(vatAmount)}</Text>
                    </View>
                    <View style={[styles.totalRow, styles.grandTotal]}>
                        <Text style={styles.totalLabel}>GENEL TOPLAM:</Text>
                        <Text style={[styles.totalValue, styles.grandTotalValue]}>{formatCurrency(grandTotal)}</Text>
                    </View>
                </View>

                {/* Payment Info */}
                {invoice.bank && (
                    <View style={styles.paymentInfo}>
                        <Text style={styles.paymentTitle}>ÖDEME BİLGİLERİ</Text>
                        <Text style={{ fontSize: 9, color: '#065f46' }}>Banka: {invoice.bank}</Text>
                    </View>
                )}

                {/* Footer */}
                <Text style={styles.footer}>
                    Bu belge {formatDate(invoice.createdAt)} tarihinde {siteName} sistemi üzerinden oluşturulmuştur. • Fatura No: {invoice.number}
                </Text>
            </Page>
        </Document>
    );
}
