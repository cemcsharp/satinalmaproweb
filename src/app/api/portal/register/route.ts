import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            // Supplier info
            companyName,
            taxId,
            taxOffice,
            address,
            phone,
            website,
            // Additional supplier info
            categoryId,
            bankName,
            bankBranch,
            bankIban,
            bankAccountNo,
            bankCurrency,
            commercialRegistrationNo,
            mersisNo,
            // User info
            contactName,
            email,
            password,
        } = body;

        // Validation
        if (!companyName || !email || !password || !contactName) {
            return NextResponse.json(
                { error: "Zorunlu alanlar eksik: Firma adı, email, şifre ve yetkili adı gereklidir." },
                { status: 400 }
            );
        }

        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            return NextResponse.json(
                { error: "Bu e-posta adresi zaten kayıtlı." },
                { status: 400 }
            );
        }

        // Check if company name or taxId already exists
        const existingSupplier = await prisma.supplier.findFirst({
            where: {
                OR: [
                    { name: companyName },
                    ...(taxId ? [{ taxId }] : []),
                ],
            },
        });
        if (existingSupplier) {
            return NextResponse.json(
                { error: "Bu firma adı veya vergi numarası zaten kayıtlı." },
                { status: 400 }
            );
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 12);

        // Create supplier and user in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // Create supplier with pending status
            const supplier = await tx.supplier.create({
                data: {
                    name: companyName,
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
                    active: false, // Will be activated after approval
                    registrationStatus: "pending",
                    registrationSource: "self",
                },
            });

            // Create user linked to supplier
            const user = await tx.user.create({
                data: {
                    username: email,
                    email: email,
                    // Note: User model doesn't have a 'name' field in schema
                    passwordHash: passwordHash,
                    role: "supplier",
                    isActive: false, // Will be activated after approval
                    supplierId: supplier.id,
                },
            });

            return { supplier, user };
        });

        return NextResponse.json({
            success: true,
            message: "Kayıt başarılı! Hesabınız admin onayı bekliyor.",
            supplierId: result.supplier.id,
        });
    } catch (error: any) {
        console.error("Registration error:", error);
        return NextResponse.json(
            { error: "Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyin." },
            { status: 500 }
        );
    }
}
