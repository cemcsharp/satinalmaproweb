import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureAdminApi } from "@/lib/apiAuth";
import { jsonError } from "@/lib/apiError";
import { hashPassword } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const admin = await ensureAdminApi(req);
    // Even if not admin, maybe allow? User said "remove role system", so maybe everyone can view users?
    // But ensureAdminApi now just checks if logged in basically since I allowed everyone.
    if (!admin) return jsonError(403, "forbidden");
    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.toLowerCase() || "";

    const list = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        unit: true,
        roleRef: true
      }
    });

    const items = list
      .filter((u: any) => (q ? ((u.username || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q)) : true))
      .map((u: any) => ({
        id: u.id,
        username: u.username,
        email: u.email || null,
        createdAt: u.createdAt,
        role: u.role,
        roleId: u.roleId,
        isActive: u.isActive,
        roleRef: u.roleRef ? {
          id: u.roleRef.id,
          name: u.roleRef.name,
          key: u.roleRef.key
        } : null,
        unit: u.unit ? {
          id: u.unit.id,
          label: u.unit.label
        } : null
      }));
    return NextResponse.json({ items, total: items.length });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return jsonError(500, "server_error", { message });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await ensureAdminApi(req);
    if (!admin) return jsonError(403, "forbidden");
    const body = await req.json();
    const username = String(body?.username || "").trim();
    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "").trim();
    let roleId = body?.roleId || null;
    let roleString = body?.role || "user";
    const unitId = body?.unitId || null;
    const isActive = body?.isActive !== undefined ? body.isActive : true;

    // If roleId is provided, sync the roleString with Role.key
    if (roleId) {
      const dbRole = await prisma.role.findUnique({ where: { id: roleId } });
      if (dbRole) {
        roleString = dbRole.key;
      }
    }

    if (!username || !email || password.length < 6) return jsonError(400, "invalid_payload");
    const existingU = await prisma.user.findUnique({ where: { username } });
    if (existingU) return jsonError(409, "username_taken");
    const existingE = await prisma.user.findUnique({ where: { email } }).catch(() => null);
    if (existingE) return jsonError(409, "email_taken");
    const passwordHash = await hashPassword(password);

    const created = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        role: roleString,
        roleId,
        unitId,
        isActive
      }
    });

    // Sync with OptionItem (ilgiliKisi)
    try {
      const cat = await prisma.optionCategory.findUnique({ where: { key: "ilgiliKisi" } });
      if (cat) {
        await prisma.optionItem.create({
          data: {
            label: username,
            categoryId: cat.id,
            active: true,
            sort: 999
          }
        });
      }
    } catch (e) {
      console.error("Failed to sync user to option item", e);
    }

    return NextResponse.json({ id: created.id }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return jsonError(500, "server_error", { message });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await ensureAdminApi(req);
    if (!admin) return jsonError(403, "forbidden");

    const body = await req.json();
    if (!body.id) return jsonError(400, "missing_id");

    const updateData: any = {};
    if (body.username) updateData.username = body.username;
    if (body.email) updateData.email = body.email;
    if (body.unitId !== undefined) updateData.unitId = body.unitId || null;
    if (body.roleId !== undefined) {
      updateData.roleId = body.roleId || null;
      if (body.roleId) {
        const dbRole = await prisma.role.findUnique({ where: { id: body.roleId } });
        if (dbRole) {
          updateData.role = dbRole.key; // Sync flat string
        }
      } else {
        updateData.role = "user"; // Fallback to user if roleId is cleared
      }
    } else if (body.role) {
      updateData.role = body.role;
    }
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.password) updateData.passwordHash = await hashPassword(body.password);

    const updated = await prisma.user.update({
      where: { id: body.id },
      data: updateData
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return jsonError(500, "update_failed", { message: String(e) });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await ensureAdminApi(req);
    if (!admin) return jsonError(403, "forbidden");

    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return jsonError(400, "missing_id");

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return jsonError(404, "user_not_found");

    // Check for related records that would prevent deletion
    const [requestCount, orderCount, invoiceCount] = await Promise.all([
      prisma.request.count({ where: { OR: [{ ownerUserId: id }, { responsibleUserId: id }] } }),
      prisma.order.count({ where: { responsibleUserId: id } }),
      prisma.invoice.count({ where: { responsibleUserId: id } }),
    ]);

    if (requestCount > 0 || orderCount > 0 || invoiceCount > 0) {
      return jsonError(409, "user_has_records", {
        message: `Bu kullanıcının ${requestCount} talep, ${orderCount} sipariş, ${invoiceCount} fatura kaydı var. Önce bu kayıtları başka kullanıcıya atayın.`
      });
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[DELETE User Error]", e);
    return jsonError(500, "delete_failed", { message: e?.message || String(e) });
  }
}
