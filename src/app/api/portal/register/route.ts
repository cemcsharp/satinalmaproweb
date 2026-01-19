import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            companyName,
            taxId,
            taxOffice,
            address,
            phone,
            website,
            categoryId,
            bankName,
            bankBranch,
            bankIban,
            bankAccountNo,
            bankCurrency,
            commercialRegistrationNo,
            mersisNo,
            contactName,
            email,
            password,
            userType // Yeni parametre
        } = body;

        if (!companyName || !email || !password || !contactName) {
            return NextResponse.json(
                { error: "Zorunlu alanlar eksik: Firma adı, email, şifre ve yetkili adı gereklidir." },
                { status: 400 }
            );
        }

        // Determine type
        const isBuyerRegistration = userType === "buyer" || userType === "company";
        const isSupplierRegistration = userType === "supplier" || !userType; // Default to supplier if not provided (old compatibility)

        const existingUser = await prisma.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            return NextResponse.json(
                { error: "Bu e-posta adresi zaten kayıtlı." },
                { status: 400 }
            );
        }

        // Find appropriate default role
        const roleKey = isBuyerRegistration ? "buyer_admin" : "supplier_admin";
        const defaultRole = await prisma.role.findFirst({
            where: { key: roleKey, active: true }
        });

        const passwordHash = await bcrypt.hash(password, 12);

        const result = await prisma.$transaction(async (tx) => {
            // Create tenant with status based on type
            const tenant = await tx.tenant.create({
                data: {
                    name: companyName,
                    slug: companyName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now().toString(36),
                    taxId: taxId || null,
                    taxOffice: taxOffice || null,
                    address: address || null,
                    phone: phone || null,
                    website: website || null,
                    contactName: contactName,
                    email: email,
                    categoryId: categoryId || null,
                    bankName: bankName || null,
                    bankBranch: bankBranch || null,
                    bankIban: bankIban || null,
                    bankAccountNo: bankAccountNo || null,
                    bankCurrency: bankCurrency || "TRY",
                    commercialRegistrationNo: commercialRegistrationNo || null,
                    mersisNo: mersisNo || null,
                    isActive: isBuyerRegistration, // Buyers active, suppliers need approval
                    isSupplier: isSupplierRegistration,
                    isBuyer: isBuyerRegistration,
                    registrationStatus: isBuyerRegistration ? "approved" : "pending",
                    registrationSource: "self",
                },
            });

            // Create user linked to tenant and role
            const user = await tx.user.create({
                data: {
                    username: contactName,
                    email: email,
                    passwordHash: passwordHash,
                    isActive: isBuyerRegistration,
                    tenantId: tenant.id,
                    roleId: defaultRole?.id || null
                },
            });

            return { tenant, user };
        });

        return NextResponse.json({
            success: true,
            message: isBuyerRegistration
                ? "Kayıt başarılı! Giriş yapabilirsiniz."
                : "Kayıt başarılı! Hesabınız admin onayı bekliyor.",
            supplierId: result.tenant.id,
        });
    } catch (error: any) {
        console.error("Registration error:", error);
        return NextResponse.json(
            { error: "Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyin." },
            { status: 500 }
        );
    }
}
