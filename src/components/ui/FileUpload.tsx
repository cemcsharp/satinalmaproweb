"use client";
import { useState, useRef } from "react";
import Button from "./Button";

type UploadedFile = {
    file: File;
    preview?: string;
};

type FileUploadProps = {
    onFilesChange: (files: File[]) => void;
    accept?: string;
    maxSize?: number; // MB
    maxFiles?: number;
};

export default function FileUpload({
    onFilesChange,
    accept = ".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg",
    maxSize = 10,
    maxFiles = 10,
}: FileUploadProps) {
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [dragActive, setDragActive] = useState(false);
    const [error, setError] = useState<string>("");
    const inputRef = useRef<HTMLInputElement>(null);

    const validateFile = (file: File): string | null => {
        // Boyut kontrolü
        if (file.size > maxSize * 1024 * 1024) {
            return `${file.name}: Dosya boyutu ${maxSize}MB'dan büyük olamaz`;
        }

        // Tip kontrolü
        const allowedTypes = accept.split(",").map((t) => t.trim());
        const fileExt = "." + file.name.split(".").pop()?.toLowerCase();
        if (!allowedTypes.includes(fileExt)) {
            return `${file.name}: Desteklenmeyen dosya tipi`;
        }

        return null;
    };

    const handleFiles = (newFiles: FileList | null) => {
        if (!newFiles) return;

        setError("");
        const fileArray = Array.from(newFiles);

        // Toplam dosya sayısı kontrolü
        if (files.length + fileArray.length > maxFiles) {
            setError(`En fazla ${maxFiles} dosya yükleyebilirsiniz`);
            return;
        }

        // Dosyaları validate et
        const validFiles: UploadedFile[] = [];
        for (const file of fileArray) {
            const validationError = validateFile(file);
            if (validationError) {
                setError(validationError);
                return;
            }

            // Görsel dosyalar için preview oluştur
            const isImage = file.type.startsWith("image/");
            if (isImage) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    validFiles.push({ file, preview: reader.result as string });
                    if (validFiles.length === fileArray.length) {
                        updateFiles([...files, ...validFiles]);
                    }
                };
                reader.readAsDataURL(file);
            } else {
                validFiles.push({ file });
            }
        }

        if (!fileArray.some((f) => f.type.startsWith("image/"))) {
            updateFiles([...files, ...validFiles]);
        }
    };

    const updateFiles = (newFiles: UploadedFile[]) => {
        setFiles(newFiles);
        onFilesChange(newFiles.map((f) => f.file));
    };

    const removeFile = (index: number) => {
        const newFiles = files.filter((_, i) => i !== index);
        updateFiles(newFiles);
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        handleFiles(e.dataTransfer.files);
    };

    const getFileIcon = (fileName: string) => {
        const ext = fileName.split(".").pop()?.toLowerCase();
        switch (ext) {
            case "pdf":
                return "📄";
            case "doc":
            case "docx":
                return "📝";
            case "xls":
            case "xlsx":
                return "📊";
            case "png":
            case "jpg":
            case "jpeg":
                return "🖼️";
            default:
                return "📎";
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
    };

    return (
        <div className="space-y-4">
            {/* Upload Area */}
            <div
                className={`
                    relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300
                    ${dragActive
                        ? "border-blue-500 bg-blue-50/50 backdrop-blur-sm scale-[1.02]"
                        : "border-slate-200/60 bg-white/30 backdrop-blur-sm hover:border-blue-400/50 hover:bg-white/50"
                    }
                `}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <input
                    ref={inputRef}
                    type="file"
                    multiple
                    accept={accept}
                    onChange={(e) => handleFiles(e.target.files)}
                    className="hidden"
                />

                <div className="space-y-3">
                    <div className={`
                        w-16 h-16 mx-auto rounded-full flex items-center justify-center text-3xl
                        bg-gradient-to-br from-blue-50 to-purple-50 border border-white/50 shadow-sm
                        ${dragActive ? 'animate-bounce' : ''}
                    `}>
                        📁
                    </div>
                    <div className="text-sm text-slate-600">
                        <p className="font-medium">Dosyaları sürükleyip bırakın</p>
                        <p className="text-slate-400 my-1">veya</p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => inputRef.current?.click()}
                            className="bg-white/50 hover:bg-white"
                        >
                            Dosya Seç
                        </Button>
                    </div>
                    <p className="text-xs text-slate-400">
                        PDF, Word, Excel, PNG, JPEG (Max {maxSize}MB)
                    </p>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="rounded-lg bg-red-50/50 border border-red-200/50 p-3 text-sm text-red-600 flex items-center gap-2 backdrop-blur-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {error}
                </div>
            )}

            {/* File List */}
            {files.length > 0 && (
                <div className="space-y-3">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide ml-1">
                        Seçilen Dosyalar ({files.length})
                    </div>
                    <div className="grid gap-2">
                        {files.map((uploadedFile, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-3 p-3 border border-slate-200/60 rounded-xl bg-white/60 backdrop-blur-sm hover:bg-white/80 transition-all group shadow-sm"
                            >
                                {/* Icon / Preview */}
                                <div className="flex-shrink-0">
                                    {uploadedFile.preview ? (
                                        <img
                                            src={uploadedFile.preview}
                                            alt={uploadedFile.file.name}
                                            className="w-12 h-12 object-cover rounded-lg border border-white/50 shadow-sm"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 flex items-center justify-center text-2xl bg-slate-50 rounded-lg border border-slate-100">
                                            {getFileIcon(uploadedFile.file.name)}
                                        </div>
                                    )}
                                </div>

                                {/* File Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-slate-700 truncate group-hover:text-blue-600 transition-colors">
                                        {uploadedFile.file.name}
                                    </div>
                                    <div className="text-xs text-slate-400">
                                        {formatFileSize(uploadedFile.file.size)}
                                    </div>
                                </div>

                                {/* Remove Button */}
                                <button
                                    type="button"
                                    onClick={() => removeFile(index)}
                                    className="flex-shrink-0 p-2 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                                    aria-label="Dosyayı kaldır"
                                >
                                    <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
