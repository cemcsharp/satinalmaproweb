
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuthApi, getUserWithPermissions } from "@/lib/apiAuth";

// GET /api/templates
// List available templates (public + user's own)
export async function GET(req: NextRequest) {
    try {
        const auth = await requireAuthApi(req);
        if (!auth) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const templates = await prisma.requestTemplate.findMany({
            where: {
                OR: [
                    { isPublic: true },
                    { createdById: auth.userId }
                ]
            },
            orderBy: { createdAt: "desc" },
            include: {
                createdBy: {
                    select: { username: true }
                }
            }
        });

        return NextResponse.json(templates);
    } catch (error) {
        console.error("Templates fetch error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST /api/templates
// Create a new template
export async function POST(req: NextRequest) {
    try {
        // We need full user details to check for admin role
        const user = await getUserWithPermissions(req);
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { name, description, subject, items, isPublic } = body;

        if (!name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        // Check admin for public templates
        let finalIsPublic = false;
        if (isPublic) {
            if (user.role === "admin" || user.isAdmin) {
                finalIsPublic = true;
            }
        }

        const template = await prisma.requestTemplate.create({
            data: {
                name,
                description,
                subject,
                items: items || [], // Should be array of item objects
                isPublic: finalIsPublic,
                createdById: String(user.id)
            }
        });

        return NextResponse.json(template);
    } catch (error) {
        console.error("Template create error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
