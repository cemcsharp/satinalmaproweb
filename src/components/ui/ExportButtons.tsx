"use client";
import React from "react";
import Button from "@/components/ui/Button";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export type ExportColumn = {
    header: string;
    accessor: string | ((row: any) => any);
};

interface ExportButtonsProps {
    data: any[];
    columns: ExportColumn[];
    fileName: string;
    title: string;
}

export default function ExportButtons({ data, columns, fileName, title }: ExportButtonsProps) {
    const prepareData = () => {
        return data.map((row) => {
            const newRow: any = {};
            columns.forEach((col) => {
                const val = typeof col.accessor === "function" ? col.accessor(row) : row[col.accessor];
                newRow[col.header] = val ?? "";
            });
            return newRow;
        });
    };

    const handleExcel = () => {
        const exportData = prepareData();
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
        XLSX.writeFile(workbook, `${fileName}.xlsx`);
    };

    const handlePdf = async () => {
        const doc = new jsPDF();

        // Load Font for Turkish Char Support
        try {
            const fontUrl = "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf";
            const fontRes = await fetch(fontUrl);
            const fontBuffer = await fontRes.arrayBuffer();

            // Convert ArrayBuffer to base64 (browser compatible)
            let binary = "";
            const bytes = new Uint8Array(fontBuffer);
            for (let i = 0; i < bytes.byteLength; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            const base64Font = window.btoa(binary);

            doc.addFileToVFS("Roboto.ttf", base64Font);
            doc.addFont("Roboto.ttf", "Roboto", "normal");
            doc.setFont("Roboto");
        } catch (err) {
            console.error("Font loading failed, falling back to default.", err);
        }

        // Title
        doc.setFontSize(16);
        doc.text(title, 14, 15);
        doc.setFontSize(10);
        doc.text(`Tarih: ${new Date().toLocaleDateString("tr-TR")}`, 14, 22);

        // Table
        const exportData = prepareData();
        const headers = columns.map(c => c.header);
        const rows = exportData.map(obj => headers.map(h => obj[h]));

        autoTable(doc, {
            head: [headers],
            body: rows,
            startY: 28,
            styles: { fontSize: 8, font: "Roboto" }, // Use loaded font
            headStyles: { fillColor: [41, 128, 185] }, // Corporate Blue
        });

        doc.save(`${fileName}.pdf`);
    };

    return (
        <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExcel} className="gap-2">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Excel
            </Button>
            <Button variant="outline" size="sm" onClick={handlePdf} className="gap-2">
                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                PDF
            </Button>
        </div>
    );
}
