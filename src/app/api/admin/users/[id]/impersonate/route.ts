import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import jwt from "jsonwebtoken";

// POST: Generate impersonation token for a user
export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        // Only admins can impersonate
        if ((session?.user as any)?.role !== "admin") {
            return NextResponse.json({ error: "unauthorized" }, { status: 401 });
        }

        const userId = params.id;

        const targetUser = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                supplier: true
            }
        });

        if (!targetUser) {
            return NextResponse.json({ error: "user_not_found" }, { status: 404 });
        }

        // Don't allow impersonating other admins
        if (targetUser.role === "admin") {
            return NextResponse.json({ error: "cannot_impersonate_admin" }, { status: 403 });
        }

        // Create an impersonation session token
        // In a real implementation, you would create a special session
        // For now, we'll just return the redirect URL based on user role

        let redirectUrl = "/dashboard";
        if (targetUser.role === "supplier") {
            redirectUrl = "/portal";
        }

        // Log this action for security
        await prisma.auditLog.create({
            data: {
                action: "IMPERSONATE",
                userId: session.user?.email || "admin",
                targetId: targetUser.id,
                targetType: "User",
                details: {
                    adminEmail: session.user?.email,
                    targetEmail: targetUser.email,
                    targetRole: targetUser.role
                }
            }
        });

        return NextResponse.json({
            ok: true,
            message: `Kullanıcı ${targetUser.email} olarak görüntüleme için hazırlanıyor.`,
            user: {
                id: targetUser.id,
                email: targetUser.email,
                role: targetUser.role
            },
            redirectUrl,
            // Note: Full impersonation would require session manipulation
            // This is a simplified version that shows the info
            note: "Tam impersonate özelliği için session yönetimi gerekir."
        });
    } catch (error) {
        console.error("Impersonate error:", error);
        return NextResponse.json({ error: "internal_error" }, { status: 500 });
    }
}
