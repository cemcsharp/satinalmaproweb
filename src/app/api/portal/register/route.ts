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

        // Check for existing user
        console.log("[Register] Checking for existing user email:", email);
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            console.log("[Register] User already exists:", email);
            return NextResponse.json(
                { error: "Bu e-posta adresi zaten kayıtlı." },
                { status: 400 }
            );
        }

        // Find appropriate default role
        const roleKey = isBuyerRegistration ? "buyer_admin" : "supplier_admin";
        console.log("[Register] Looking for role:", roleKey);
        const defaultRole = await prisma.role.findFirst({
            where: { key: roleKey, active: true }
        });
        console.log("[Register] Role found:", defaultRole?.id);

        if (taxId) {
            console.log("[Register] Checking for existing Tax ID:", taxId);
            const existingTenant = await prisma.tenant.findUnique({
                where: { taxId }
            });
            if (existingTenant) {
                console.log("[Register] Tenant with Tax ID already exists:", taxId);
                return NextResponse.json(
                    { error: "Bu Vergi Kimlik Numarası (VKN) ile kayıtlı bir firma zaten var." },
                    { status: 400 }
                );
            }
        }

        const passwordHash = await bcrypt.hash(password, 12);

        console.log("[Register] Starting transaction...");
        const result = await prisma.$transaction(async (tx) => {
            // Create tenant with status based on type
            console.log("[Register] Creating tenant:", companyName);
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
                    isActive: false, // All registrations need approval
                    isSupplier: isSupplierRegistration,
                    isBuyer: isBuyerRegistration,
                    registrationStatus: "pending", // All currently pending
                    registrationSource: "self",
                },
            });

            // Create user linked to tenant and role
            console.log("[Register] Creating user:", email);
            const user = await tx.user.create({
                data: {
                    username: email, // Use email as username to ensure uniqueness
                    email: email,
                    passwordHash: passwordHash,
                    isActive: false, // User also inactive until approved
                    tenantId: tenant.id,
                    roleId: defaultRole?.id || null
                },
            });
            return { tenant, user };
        });

        console.log("[Register] Transaction success.");

        return NextResponse.json({
            success: true,
            message: "Kayıt başarılı! Hesabınız admin onayı bekliyor.",
            supplierId: result.tenant.id,
        });
    } catch (error: any) {
        console.error("FULL REGISTRATION ERROR OBJECT:", JSON.stringify(error, null, 2));
        console.error("ERROR MESSAGE:", error.message);
        console.error("ERROR STACK:", error.stack);
        return NextResponse.json(
            { error: "Kayıt sırasında bir hata oluştu: " + (error.message || "Bilinmeyen hata") },
            { status: 500 }
        );
    }
}
