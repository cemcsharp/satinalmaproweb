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

        // Determine role based on user type
        const role = userType === "supplier" ? "supplier" : "user";

        // Create user
        const user = await prisma.user.create({
            data: {
                username: fullName.trim(),
                email: email.toLowerCase().trim(),
                phone: phone.trim(),
                passwordHash,
                role,
                // Mark as pending approval for suppliers
                ...(userType === "supplier" ? { isApproved: false } : {})
            }
        });

        // If supplier, also create a supplier record
        if (userType === "supplier") {
            try {
                await prisma.supplier.create({
                    data: {
                        name: companyName.trim(),
                        email: email.toLowerCase().trim(),
                        phone: phone.trim(),
                        contactPerson: fullName.trim(),
                        status: "pending", // Requires admin approval
                        userId: user.id
                    }
                });
            } catch (e) {
                // If supplier creation fails, still continue - user is created
                console.error("Supplier record creation failed:", e);
            }
        }

        // Send welcome email
        try {
            const origin = req.nextUrl.origin;
            const welcomeHtml = renderEmailTemplate("generic", {
                title: "Hoş Geldiniz!",
                body: `
                    <p>Merhaba ${fullName},</p>
                    <p>Platformumuza kayıt olduğunuz için teşekkür ederiz!</p>
                    ${userType === "supplier"
                        ? "<p>Tedarikçi hesabınız onay sürecindedir. Onaylandığında size bilgi vereceğiz.</p>"
                        : "<p>Hemen giriş yaparak platformumuzu kullanmaya başlayabilirsiniz.</p>"
                    }
                    <p><strong>Şirket:</strong> ${companyName}</p>
                    <p><strong>E-posta:</strong> ${email}</p>
                `,
                actionUrl: `${origin}/login`,
                actionText: "Giriş Yap"
            });

            await dispatchEmail({
                to: email.toLowerCase(),
                subject: "Hoş Geldiniz!",
                html: welcomeHtml,
                category: "welcome"
            });
        } catch (e) {
            console.error("Welcome email failed:", e);
            // Don't fail registration if email fails
        }

        return NextResponse.json({
            ok: true,
            message: userType === "supplier"
                ? "Kayıt başarılı. Tedarikçi hesabınız onay bekliyor."
                : "Kayıt başarılı. Giriş yapabilirsiniz."
        }, { status: 201 });

    } catch (error: any) {
        console.error("Registration error:", error);
        return NextResponse.json(
            { error: "Kayıt işlemi başarısız oldu" },
            { status: 500 }
        );
    }
}
