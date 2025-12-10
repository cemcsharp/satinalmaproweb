"use client";
import React, { useRef, useState } from "react";
import Button from "@/components/ui/Button";
import * as XLSX from "xlsx";
import { useToast } from "@/components/ui/Toast";
import Modal from "@/components/ui/Modal";

interface ImportExcelProps {
    onDataReady: (data: any[]) => void;
    isLoading?: boolean;
}

export default function ImportExcel({ onDataReady, isLoading }: ImportExcelProps) {
    const { show } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [modalOpen, setModalOpen] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: "binary" });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws);

            if (data.length === 0) {
                show({ title: "Hata", description: "Excel dosyası boş veya okunamadı.", variant: "error" });
                return;
            }

            setPreviewData(data);
            setModalOpen(true);
            // Reset input
            if (fileInputRef.current) fileInputRef.current.value = "";
        };
        reader.readAsBinaryString(file);
    };

    const confirmImport = () => {
        onDataReady(previewData);
        setModalOpen(false);
        setPreviewData([]);
    };

    return (
        <>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".xlsx, .xls"
            />
            <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                loading={isLoading}
                className="gap-2"
            >
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                İçe Aktar
            </Button>

            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title="İçe Aktarma Önizleme"
                size="lg"
                footer={
                    <>
                        <Button variant="outline" onClick={() => setModalOpen(false)}>İptal</Button>
                        <Button onClick={confirmImport}>Onayla ve Yükle ({previewData.length} Kayıt)</Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <p className="text-sm text-slate-500">
                        Aşağıdaki veriler sisteminize aktarılacaktır. Lütfen sütun başlıklarının doğru olduğundan emin olun.
                    </p>
                    <div className="border rounded-lg overflow-x-auto max-h-[400px]">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-slate-50 border-b">
                                <tr>
                                    {previewData.length > 0 && Object.keys(previewData[0]).map((key) => (
                                        <th key={key} className="px-4 py-2 font-medium text-slate-700">{key}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {previewData.slice(0, 5).map((row, i) => (
                                    <tr key={i}>
                                        {Object.values(row).map((val: any, j) => (
                                            <td key={j} className="px-4 py-2 text-slate-600 truncate max-w-[150px]">{String(val)}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {previewData.length > 5 && (
                            <div className="p-2 text-center text-xs text-slate-400 bg-slate-50">
                                ... ve {previewData.length - 5} satır daha
                            </div>
                        )}
                    </div>
                </div>
            </Modal>
        </>
    );
}
