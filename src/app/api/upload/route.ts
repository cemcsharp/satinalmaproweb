import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function POST(req: NextRequest) {
    try {
        const { getUserWithPermissions } = await import("@/lib/apiAuth");
        const user = await getUserWithPermissions(req);
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const formData = await req.formData();
        const files = formData.getAll("files") as File[];
        const targetFolder = req.nextUrl.searchParams.get("folder") || "general";

        if (!files || files.length === 0) {
            return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
        }

        // Structure: public/uploads/{tenantId}/{targetFolder}/
        const tenantDir = user.tenantId || "common";
        const uploadDir = join(process.cwd(), "public", "uploads", tenantDir, targetFolder);

        // Upload dizinini oluştur (yoksa)
        if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true });
        }

        const uploadedFiles = [];

        for (const file of files) {
            // Dosya validasyonu
            const allowedTypes = [
                "application/pdf",
                "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "application/vnd.ms-excel",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "image/png",
                "image/jpeg",
                "image/webp"
            ];

            if (!allowedTypes.includes(file.type)) {
                return NextResponse.json(
                    { error: `Unsupported file type: ${file.type}` },
                    { status: 400 }
                );
            }

            // Maksimum dosya boyutu: 10MB
            const maxSize = 10 * 1024 * 1024;
            if (file.size > maxSize) {
                return NextResponse.json(
                    { error: `File too large: ${file.name} (max 10MB)` },
                    { status: 400 }
                );
            }

            // Benzersiz dosya adı oluştur
            const timestamp = Date.now();
            const randomStr = Math.random().toString(36).substring(2, 8);
            const rawExt = file.name.split(".").pop() || "";
            const ext = rawExt.toLowerCase();
            const fileName = `${timestamp}-${randomStr}.${ext}`;
            const filePath = join(uploadDir, fileName);

            // Dosyayı kaydet
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            await writeFile(filePath, buffer);

            uploadedFiles.push({
                fileName: file.name,
                url: `/uploads/${tenantDir}/${targetFolder}/${fileName}`,
                mimeType: file.type,
                size: file.size,
            });
        }

        return NextResponse.json({ files: uploadedFiles }, { status: 200 });
    } catch (error: any) {
        console.error("Upload error:", error);
        return NextResponse.json(
            { error: "Upload failed", message: error?.message },
            { status: 500 }
        );
    }
}
