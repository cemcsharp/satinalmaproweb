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
        marginBottom: 30,
        borderBottom: '2px solid #3b82f6',
        paddingBottom: 15,
    },
    logo: {
        fontSize: 18,
        fontWeight: 700,
        color: '#3b82f6',
    },
    subtitle: {
        fontSize: 9,
        color: '#64748b',
        marginTop: 2,
    },
    orderInfo: {
        textAlign: 'right',
    },
    orderNumber: {
        fontSize: 14,
        fontWeight: 700,
        color: '#0f172a',
    },
    orderDate: {
        fontSize: 9,
        color: '#64748b',
        marginTop: 4,
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
        width: 120,
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
    tableCell: {
        fontSize: 9,
        color: '#1e293b',
    },
    col1: { width: '8%' },
    col2: { width: '40%' },
    col3: { width: '12%', textAlign: 'center' },
    col4: { width: '15%', textAlign: 'right' },
    col5: { width: '25%', textAlign: 'right' },
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
        width: 100,
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
        borderTop: '2px solid #3b82f6',
    },
    grandTotalValue: {
        fontSize: 14,
        fontWeight: 700,
        color: '#3b82f6',
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
    signatures: {
        marginTop: 40,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    signatureBox: {
        width: '45%',
        textAlign: 'center',
    },
    signatureLine: {
        borderTop: '1px solid #1e293b',
        marginTop: 40,
        paddingTop: 8,
    },
    signatureLabel: {
        fontSize: 9,
        color: '#64748b',
    },
});

type OrderItem = {
    name: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    totalPrice: number;
};

type OrderPdfProps = {
    order: {
        barcode: string;
        createdAt: string;
        status: string;
        regulationRef?: string;
        officialDocNo?: string;
        notes?: string;
        items: OrderItem[];
        subtotal: number;
        vatAmount: number;
        grandTotal: number;
        currency: string;
        supplier?: { name: string; address?: string; taxId?: string };
        request?: { subject: string; unit?: { label: string } };
        responsible?: { username: string };
    };
    company?: {
        name: string;
        address?: string;
        taxId?: string;
    };
};

export default function OrderPdf({ order, company }: OrderPdfProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('tr-TR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount) + ' ' + (order.currency || 'TL');
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.logo}>{company?.name || 'SatınalmaPRO'}</Text>
                        <Text style={styles.subtitle}>Satın Alma Sipariş Formu</Text>
                    </View>
                    <View style={styles.orderInfo}>
                        <Text style={styles.orderNumber}>#{order.barcode}</Text>
                        <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
                    </View>
                </View>

                {/* Supplier Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>TEDARİKÇİ BİLGİLERİ</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Firma Adı:</Text>
                        <Text style={styles.value}>{order.supplier?.name || '-'}</Text>
                    </View>
                    {order.supplier?.address && (
                        <View style={styles.row}>
                            <Text style={styles.label}>Adres:</Text>
                            <Text style={styles.value}>{order.supplier.address}</Text>
                        </View>
                    )}
                    {order.supplier?.taxId && (
                        <View style={styles.row}>
                            <Text style={styles.label}>Vergi No:</Text>
                            <Text style={styles.value}>{order.supplier.taxId}</Text>
                        </View>
                    )}
                </View>

                {/* Order Details */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>SİPARİŞ BİLGİLERİ</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Talep Konusu:</Text>
                        <Text style={styles.value}>{order.request?.subject || '-'}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Birim:</Text>
                        <Text style={styles.value}>{order.request?.unit?.label || '-'}</Text>
                    </View>
                    {order.regulationRef && (
                        <View style={styles.row}>
                            <Text style={styles.label}>Mevzuat Ref:</Text>
                            <Text style={styles.value}>{order.regulationRef}</Text>
                        </View>
                    )}
                    {order.officialDocNo && (
                        <View style={styles.row}>
                            <Text style={styles.label}>Resmi Yazı No:</Text>
                            <Text style={styles.value}>{order.officialDocNo}</Text>
                        </View>
                    )}
                </View>

                {/* Items Table */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>SİPARİŞ KALEMLERİ</Text>
                    <View style={styles.table}>
                        <View style={styles.tableHeader}>
                            <Text style={[styles.tableHeaderCell, styles.col1]}>#</Text>
                            <Text style={[styles.tableHeaderCell, styles.col2]}>Ürün/Hizmet</Text>
                            <Text style={[styles.tableHeaderCell, styles.col3]}>Miktar</Text>
                            <Text style={[styles.tableHeaderCell, styles.col4]}>Birim Fiyat</Text>
                            <Text style={[styles.tableHeaderCell, styles.col5]}>Toplam</Text>
                        </View>
                        {order.items.map((item, index) => (
                            <View key={index} style={styles.tableRow}>
                                <Text style={[styles.tableCell, styles.col1]}>{index + 1}</Text>
                                <Text style={[styles.tableCell, styles.col2]}>{item.name}</Text>
                                <Text style={[styles.tableCell, styles.col3]}>{item.quantity} {item.unit}</Text>
                                <Text style={[styles.tableCell, styles.col4]}>{formatCurrency(item.unitPrice)}</Text>
                                <Text style={[styles.tableCell, styles.col5]}>{formatCurrency(item.totalPrice)}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Totals */}
                    <View style={styles.totals}>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Ara Toplam:</Text>
                            <Text style={styles.totalValue}>{formatCurrency(order.subtotal)}</Text>
                        </View>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>KDV:</Text>
                            <Text style={styles.totalValue}>{formatCurrency(order.vatAmount)}</Text>
                        </View>
                        <View style={[styles.totalRow, styles.grandTotal]}>
                            <Text style={styles.totalLabel}>GENEL TOPLAM:</Text>
                            <Text style={[styles.totalValue, styles.grandTotalValue]}>{formatCurrency(order.grandTotal)}</Text>
                        </View>
                    </View>
                </View>

                {/* Notes */}
                {order.notes && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>NOTLAR</Text>
                        <Text style={{ fontSize: 9, color: '#475569' }}>{order.notes}</Text>
                    </View>
                )}

                {/* Signatures */}
                <View style={styles.signatures}>
                    <View style={styles.signatureBox}>
                        <View style={styles.signatureLine}>
                            <Text style={styles.signatureLabel}>Hazırlayan</Text>
                            <Text style={{ fontSize: 9, marginTop: 4 }}>{order.responsible?.username || ''}</Text>
                        </View>
                    </View>
                    <View style={styles.signatureBox}>
                        <View style={styles.signatureLine}>
                            <Text style={styles.signatureLabel}>Onaylayan</Text>
                        </View>
                    </View>
                </View>

                {/* Footer */}
                <Text style={styles.footer}>
                    Bu belge {formatDate(order.createdAt)} tarihinde SatınalmaPRO sistemi üzerinden oluşturulmuştur. • Sipariş No: {order.barcode}
                </Text>
            </Page>
        </Document>
    );
}
