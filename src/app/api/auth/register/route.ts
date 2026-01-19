import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { dispatchEmail, renderEmailTemplate } from "@/lib/mailer";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { companyName, fullName, email, phone, password, userType } = body;

        // Validation
        if (!companyName || !fullName || !email || !phone || !password) {
            return NextResponse.json(
                { error: "Tüm alanlar zorunludur" },
                { status: 400 }
            );
        }

        if (password.length < 8) {
            return NextResponse.json(
                { error: "Şifre en az 8 karakter olmalıdır" },
                { status: 400 }
            );
        }

        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        });

        if (existingUser) {
            return NextResponse.json(
                { error: "Bu e-posta adresi zaten kayıtlı" },
                { status: 409 }
            );
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 12);

        // Determine if this is a buyer or supplier registration
        const isBuyerRegistration = userType === "buyer" || userType === "company";
        const isSupplierRegistration = userType === "supplier";

        // Find appropriate default role - exact match first
        let defaultRole = null;
        try {
            const roleKey = isBuyerRegistration ? "buyer_admin" : "supplier_admin";
            defaultRole = await prisma.role.findFirst({
                where: { key: roleKey, active: true }
            });

            // Fallback to generic roles if specific not found
            if (!defaultRole) {
                defaultRole = await prisma.role.findFirst({
                    where: { key: isBuyerRegistration ? "admin" : "supplier", active: true }
                });
            }
        } catch (e) {
            console.error("Role lookup failed:", e);
        }

        // Create Tenant first (for both buyer and supplier)
        const tenant = await prisma.tenant.create({
            data: {
                name: companyName.trim(),
                slug: companyName.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now().toString(36),
                email: email.toLowerCase().trim(),
                phone: phone.trim(),
                contactName: fullName.trim(),
                registrationStatus: isSupplierRegistration ? "pending" : "approved", // Suppliers need approval, buyers auto-approved
                isSupplier: isSupplierRegistration,
                isBuyer: isBuyerRegistration,
                isActive: isBuyerRegistration // Buyers are active immediately, suppliers need approval
            }
        });

        // Create user and link to tenant
        const user = await prisma.user.create({
            data: {
                username: fullName.trim(),
                email: email.toLowerCase().trim(),
                phone: phone.trim(),
                passwordHash,
                tenantId: tenant.id,
                roleId: defaultRole?.id || null,
                isActive: isBuyerRegistration, // Buyers are active immediately
                isSuperAdmin: false
            }
        });

        // Send welcome email
        try {
            const origin = req.nextUrl.origin;
            const isApprovalNeeded = isSupplierRegistration;

            const welcomeHtml = renderEmailTemplate("generic", {
                title: "Hoş Geldiniz!",
                body: isApprovalNeeded ? `
                    <p>Merhaba ${fullName},</p>
                    <p>Platformumuza tedarikçi olarak kayıt olduğunuz için teşekkür ederiz!</p>
                    <p>Hesabınız admin onay sürecindedir. Onaylandığında giriş yapabileceksiniz ve size bilgi vereceğiz.</p>
                    <p><strong>Şirket:</strong> ${companyName}</p>
                    <p><strong>E-posta:</strong> ${email}</p>
                ` : `
                    <p>Merhaba ${fullName},</p>
                    <p>Platformumuza alıcı firma olarak kayıt olduğunuz için teşekkür ederiz!</p>
                    <p>Hesabınız aktif hale getirilmiştir. Hemen giriş yapabilirsiniz.</p>
                    <p><strong>Şirket:</strong> ${companyName}</p>
                    <p><strong>E-posta:</strong> ${email}</p>
                `,
                actionUrl: `${origin}/login`,
                actionText: "Giriş Yap"
            });

            await dispatchEmail({
                to: email.toLowerCase(),
                subject: isApprovalNeeded ? "Kaydınız Alındı - Onay Bekliyor" : "Hoş Geldiniz - Hesabınız Aktif!",
                html: welcomeHtml,
                category: "welcome"
            });
        } catch (e) {
            console.error("Welcome email failed:", e);
        }

        const message = isSupplierRegistration
            ? "Kayıt başarılı. Hesabınız admin onayı bekliyor. Onaylandığında e-posta ile bilgilendirileceksiniz."
            : "Kayıt başarılı. Hesabınız aktif! Giriş yapabilirsiniz.";

        return NextResponse.json({
            ok: true,
            message,
            userType: isBuyerRegistration ? "buyer" : "supplier"
        }, { status: 201 });

    } catch (error: any) {
        console.error("Registration error:", error);
        return NextResponse.json(
            { error: "Kayıt işlemi başarısız oldu" },
            { status: 500 }
        );
    }
}
