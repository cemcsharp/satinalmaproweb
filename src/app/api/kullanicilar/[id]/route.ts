import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureAdminApi } from "@/lib/apiAuth";
import { jsonError } from "@/lib/apiError";
import { hashPassword } from "@/lib/auth";
import { getToken } from "next-auth/jwt";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";


export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const admin = await ensureAdminApi(req);
    if (!admin) return jsonError(403, "forbidden");
    const { id } = await context.params;
    const body = await req.json();

    // Get old user data for sync
    const oldUser = await prisma.user.findUnique({ where: { id } });

    const data: any = {};
    if (typeof body.username === "string" && body.username.trim()) data.username = body.username.trim();
    if (typeof body.email === "string" && body.email.trim()) data.email = body.email.trim().toLowerCase();
    if (typeof body.password === "string" && body.password.trim().length >= 6) data.passwordHash = await hashPassword(body.password.trim());
    if (body.roleId !== undefined) data.roleId = body.roleId || null;
    if (body.unitId !== undefined) data.unitId = body.unitId || null;

    if (!Object.keys(data).length) return jsonError(400, "invalid_payload");

    await prisma.user.update({ where: { id }, data });

    // Sync with OptionItem (ilgiliKisi)
    if (oldUser && data.username && oldUser.username !== data.username) {
      try {
        const cat = await prisma.optionCategory.findUnique({ where: { key: "ilgiliKisi" } });
        if (cat) {
          // Try to find by old username
          const items = await prisma.optionItem.findMany({ where: { categoryId: cat.id, label: oldUser.username } });
          for (const item of items) {
            await prisma.optionItem.update({ where: { id: item.id }, data: { label: data.username } });
          }
        }
      } catch (e) { console.error("Sync update failed", e); }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return jsonError(500, "server_error", { message });
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    let admin = await ensureAdminApi(req);
    if (!admin) {
      const tok = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
      const role = (tok as any)?.role as string | undefined;
      const email = (tok as any)?.email as string | undefined;
      if (role === "admin" || (email && email.toLowerCase() === "admin@sirket.com")) {
        admin = { id: String((tok as any)?.userId || (tok as any)?.sub || email || "admin"), role: "admin" } as any;
      } else {
        const session = await getServerSession(authOptions);
        const semail = (session as any)?.user?.email as string | undefined;
        if (semail && semail.toLowerCase() === "admin@sirket.com") {
          admin = { id: String(semail), role: "admin" } as any;
        }
      }
    }
    if (!admin) return jsonError(403, "forbidden");
    const { id } = await context.params;
    if (admin.id === id) return jsonError(400, "cannot_delete_self");

    // Get user before delete
    const user = await prisma.user.findUnique({ where: { id } });

    await prisma.user.delete({ where: { id } });

    // Sync delete
    if (user) {
      try {
        const cat = await prisma.optionCategory.findUnique({ where: { key: "ilgiliKisi" } });
        if (cat) {
          const items = await prisma.optionItem.findMany({ where: { categoryId: cat.id, label: user.username } });
          for (const item of items) {
            // Check if used? If used, maybe just deactivate?
            // For now, let's try delete, if fails (foreign key), catch error
            try {
              await prisma.optionItem.delete({ where: { id: item.id } });
            } catch {
              // If in use, deactivate instead
              await prisma.optionItem.update({ where: { id: item.id }, data: { active: false } });
            }
          }
        }
      } catch (e) { console.error("Sync delete failed", e); }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return jsonError(500, "server_error", { message });
  }
}
