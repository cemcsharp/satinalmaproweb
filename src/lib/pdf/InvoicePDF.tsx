"use client";

import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Register fonts for Turkish character support
Font.register({
    family: 'Roboto',
    fonts: [
        { src: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5WZLCzYlKw.ttf', fontWeight: 400 },
        { src: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlvAx05IsDqlA.ttf', fontWeight: 700 },
    ],
});

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: 'Roboto',
        fontSize: 10,
        color: '#1f2937',
    },
    header: {
        marginBottom: 30,
        borderBottomWidth: 2,
        borderBottomColor: '#2563eb',
        paddingBottom: 20,
    },
    logo: {
        fontSize: 24,
        fontWeight: 700,
        color: '#2563eb',
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 10,
        color: '#6b7280',
    },
    title: {
        fontSize: 18,
        fontWeight: 700,
        marginBottom: 20,
        color: '#111827',
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 700,
        marginBottom: 10,
        color: '#374151',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        paddingBottom: 5,
    },
    row: {
        flexDirection: 'row',
        marginBottom: 5,
    },
    label: {
        width: 150,
        fontWeight: 700,
        color: '#4b5563',
    },
    value: {
        flex: 1,
        color: '#1f2937',
    },
    table: {
        marginTop: 10,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f3f4f6',
        borderBottomWidth: 1,
        borderBottomColor: '#d1d5db',
        padding: 8,
        fontWeight: 700,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        padding: 8,
    },
    tableCell: {
        flex: 1,
    },
    tableCellSmall: {
        width: 60,
        textAlign: 'right',
    },
    tableCellMedium: {
        width: 100,
        textAlign: 'right',
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        textAlign: 'center',
        color: '#9ca3af',
        fontSize: 8,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        paddingTop: 10,
    },
    badge: {
        backgroundColor: '#dbeafe',
        color: '#1d4ed8',
        padding: '4 8',
        borderRadius: 4,
        fontSize: 9,
        alignSelf: 'flex-start',
    },
    amount: {
        fontSize: 16,
        fontWeight: 700,
        color: '#059669',
        marginTop: 10,
    },
});

import { useState, useEffect } from 'react';
import { SystemSettings, defaultSettings } from '@/lib/settings';

type InvoiceItem = {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
};

type InvoiceData = {
    invoiceNo: string;
    date: string;
    dueDate?: string;
    supplier: string;
    supplierAddress?: string;
    items: InvoiceItem[];
    subtotal: number;
    tax: number;
    total: number;
    status?: string;
    notes?: string;
};

export function InvoicePDF({ data }: { data: InvoiceData }) {
    const [siteSettings, setSiteSettings] = useState<Partial<SystemSettings>>(defaultSettings);

    useEffect(() => {
        fetch("/api/admin/settings")
            .then(res => res.json())
            .then(data => {
                if (data.ok && data.settings) {
                    setSiteSettings(data.settings);
                }
            })
            .catch(console.error);
    }, []);

    const siteName = siteSettings.siteName || defaultSettings.siteName;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY',
        }).format(amount);
    };

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.logo}>{siteName}</Text>
                    <Text style={styles.subtitle}>Fatura Belgesi</Text>
                </View>

                {/* Invoice Title */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
                    <Text style={styles.title}>Fatura #{data.invoiceNo}</Text>
                    {data.status && (
                        <Text style={styles.badge}>{data.status}</Text>
                    )}
                </View>

                {/* Invoice Info */}
                <View style={styles.section}>
                    <View style={styles.row}>
                        <Text style={styles.label}>Fatura Tarihi:</Text>
                        <Text style={styles.value}>{data.date}</Text>
                    </View>
                    {data.dueDate && (
                        <View style={styles.row}>
                            <Text style={styles.label}>Vade Tarihi:</Text>
                            <Text style={styles.value}>{data.dueDate}</Text>
                        </View>
                    )}
                    <View style={styles.row}>
                        <Text style={styles.label}>Tedarikçi:</Text>
                        <Text style={styles.value}>{data.supplier}</Text>
                    </View>
                    {data.supplierAddress && (
                        <View style={styles.row}>
                            <Text style={styles.label}>Adres:</Text>
                            <Text style={styles.value}>{data.supplierAddress}</Text>
                        </View>
                    )}
                </View>

                {/* Items Table */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Fatura Kalemleri</Text>
                    <View style={styles.table}>
                        {/* Table Header */}
                        <View style={styles.tableHeader}>
                            <Text style={styles.tableCell}>Açıklama</Text>
                            <Text style={styles.tableCellSmall}>Miktar</Text>
                            <Text style={styles.tableCellMedium}>Birim Fiyat</Text>
                            <Text style={styles.tableCellMedium}>Tutar</Text>
                        </View>
                        {/* Table Rows */}
                        {data.items.map((item, index) => (
                            <View style={styles.tableRow} key={index}>
                                <Text style={styles.tableCell}>{item.description}</Text>
                                <Text style={styles.tableCellSmall}>{item.quantity}</Text>
                                <Text style={styles.tableCellMedium}>{formatCurrency(item.unitPrice)}</Text>
                                <Text style={styles.tableCellMedium}>{formatCurrency(item.total)}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Totals */}
                <View style={{ alignItems: 'flex-end', marginTop: 20 }}>
                    <View style={styles.row}>
                        <Text style={{ ...styles.label, width: 100 }}>Ara Toplam:</Text>
                        <Text style={{ width: 100, textAlign: 'right' }}>{formatCurrency(data.subtotal)}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={{ ...styles.label, width: 100 }}>KDV:</Text>
                        <Text style={{ width: 100, textAlign: 'right' }}>{formatCurrency(data.tax)}</Text>
                    </View>
                    <View style={{ ...styles.row, borderTopWidth: 2, borderTopColor: '#2563eb', paddingTop: 5 }}>
                        <Text style={{ ...styles.label, width: 100, fontSize: 12 }}>TOPLAM:</Text>
                        <Text style={{ width: 100, textAlign: 'right', fontSize: 14, fontWeight: 700, color: '#059669' }}>
                            {formatCurrency(data.total)}
                        </Text>
                    </View>
                </View>

                {/* Notes */}
                {data.notes && (
                    <View style={{ marginTop: 30 }}>
                        <Text style={styles.sectionTitle}>Notlar</Text>
                        <Text style={{ color: '#6b7280' }}>{data.notes}</Text>
                    </View>
                )}

                {/* Footer */}
                <Text style={styles.footer}>
                    Bu belge {siteName} sistemi tarafından oluşturulmuştur. • {new Date().toLocaleDateString('tr-TR')}
                </Text>
            </Page>
        </Document>
    );
}

export default InvoicePDF;
