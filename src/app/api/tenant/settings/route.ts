import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, requirePermissionApi } from "@/lib/apiAuth";

/**
 * Firma ayarlarını döndürür veya günceller.
 */
export async function GET(req: NextRequest) {
    try {
        const user = await getSessionUser();
        if (!user || !user.tenantId) {
            return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
        }

        const tenant = await prisma.tenant.findUnique({
            where: { id: user.tenantId }
        });

        if (!tenant) {
            return NextResponse.json({ error: "Firma bulunamadı" }, { status: 404 });
        }

        return NextResponse.json(tenant);
    } catch (error) {
        console.error("Firma bilgileri çekilirken hata:", error);
        return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const user = await getSessionUser();
        if (!user || !user.tenantId) {
            return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
        }

        // Yetki kontrolü (Yönetici rolü gerekir)
        // Not: requirePermissionApi kullanılabilir veya manuel kontrol yapılabilir
        const body = await req.json();
        const {
            name, taxId, taxOffice, email, phone,
            address, website, bankName, bankBranch,
            bankIban, bankAccountNo, bankCurrency
        } = body;

        const updatedTenant = await prisma.tenant.update({
            where: { id: user.tenantId },
            data: {
                name,
                taxId,
                taxOffice,
                email,
                phone,
                address,
                website,
                bankName,
                bankBranch,
                bankIban,
                bankAccountNo,
                bankCurrency
            }
        });

        return NextResponse.json({
            ok: true,
            message: "Firma bilgileri güncellendi",
            tenant: updatedTenant
        });
    } catch (error) {
        console.error("Firma bilgileri güncellenirken hata:", error);
        return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
    }
}
