import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/apiError";
import { requireAuthApi } from "@/lib/apiAuth";

// Forced Cache Invalidation - Timestamp: 9999
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode");

    // Public Mode
    if (mode === "public") {
      const units = await prisma.optionItem.findMany({
        where: { category: { key: "birim" }, active: true },
        orderBy: { sort: "asc" },
        select: { id: true, label: true, active: true }
      });
      return NextResponse.json({ birim: units });
    }

    // Auth Check
    const auth = await requireAuthApi(req);
    if (!auth) return jsonError(401, "unauthorized");

    const keys = [
      "ilgiliKisi", "birim", "durum", "paraBirimi", "birimTipi",
      "siparisDurumu", "alimYontemi", "yonetmelikMaddesi",
      "projeKodu", "butceKodu"
      // "firma" and "tedarikci" are handled separately usually, but keys list might used to filter OptionItems too
    ];

    const results: Record<string, any[]> & { tedarikci?: any[], firma?: any[], kullanici?: any[] } = {};
    keys.forEach(k => { results[k] = []; });

    // Fetch Option Items
    const items = await prisma.optionItem.findMany({
      where: {
        active: true,
        category: { key: { in: keys } }
      },
      include: { category: true },
      orderBy: { sort: "asc" }
    });

    items.forEach(item => {
      const k = item.category.key;
      if (results[k]) results[k].push({ id: item.id, label: item.label, active: item.active });
    });

    // Fetch Standard Relations (always included in old version, so keeping it safe)
    const suppliers = await prisma.supplier.findMany({ where: { active: true }, orderBy: { name: 'asc' }, select: { id: true, name: true, active: true } });
    results.tedarikci = suppliers.map(x => ({ id: x.id, label: x.name, active: x.active }));

    const companies = await prisma.company.findMany({ where: { active: true }, orderBy: { name: 'asc' }, select: { id: true, name: true, active: true } });
    results.firma = companies.map(x => ({ id: x.id, label: x.name, active: x.active }));

    // Some option lists treated "firma" or "tedarikci" as OptionItems too? 
    // If so, they are mapped above. If they are relational tables, they are mapped here.
    // The previous code had "tedarikci" in 'keys' but also overwrote it with 'suppliers.map'.
    // So this explicit mapping is correct.

    const users = await prisma.user.findMany({ orderBy: { username: 'asc' }, select: { id: true, username: true, email: true } });
    results.kullanici = users.map(x => ({ id: x.id, label: x.username || x.email, active: true }));

    return NextResponse.json(results);

  } catch (e: any) {
    console.error("[API/Options] ERROR:", e);
    return jsonError(500, "server_error");
  }
}

// Helpers
async function getCategoryByKey(key: string) {
  const cat = await prisma.optionCategory.findUnique({ where: { key } });
  if (!cat) throw new Error("category_not_found");
  return cat;
}

async function listItemsByKey(key: string) {
  const cat = await getCategoryByKey(key);
  const items = await prisma.optionItem.findMany({
    where: { categoryId: cat.id },
    orderBy: [{ sort: "asc" }, { label: "asc" }],
  });
  return { key, items: items.map((it) => ({ id: it.id, label: it.label, active: it.active, sort: it.sort, email: it.email ?? null })) };
}

async function listCompanies() {
  const companies = await prisma.company.findMany({ orderBy: { name: "asc" } });
  return { key: "firma", items: companies.map((c, i) => ({ id: c.id, label: c.name, active: !!c.active, sort: i + 1 })) };
}

// Create new option item under given category key
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuthApi(req);
    if (!auth) return jsonError(401, "unauthorized");
    const body = await req.json();
    const action = String(body?.action || "");
    if (action === "sync_users") {
      const cat = await getCategoryByKey("ilgiliKisi");
      const users = await prisma.user.findMany();
      const existingItems = await prisma.optionItem.findMany({ where: { categoryId: cat.id } });
      const existingLabels = new Set(existingItems.map(i => i.label));

      let addedCount = 0;
      for (const u of users) {
        if (!existingLabels.has(u.username)) {
          await prisma.optionItem.create({
            data: {
              label: u.username,
              categoryId: cat.id,
              active: true,
              sort: 999
            }
          });
          addedCount++;
        }
      }
      return NextResponse.json({ message: "Synced", added: addedCount });
    }

    if (action !== "add") return jsonError(400, "invalid_action");
    const key = String(body?.key || "").trim();
    const label = String(body?.label || "").trim();
    if (!key) return jsonError(400, "invalid_payload");
    if (key === "firma") {
      const name = String((body?.name ?? label) || "").trim();
      if (!name) return jsonError(400, "invalid_payload", { message: "name_required" });
      const taxId = body?.taxId == null ? null : String(body.taxId || "");
      const address = body?.address == null ? null : String(body.address || "");
      const taxOffice = body?.taxOffice == null ? null : String(body.taxOffice || "");
      const phone = body?.phone == null ? null : String(body.phone || "");
      const email = body?.email == null ? null : String(body.email || "");
      try {
        await prisma.company.create({ data: { name, taxId, address, taxOffice, phone, email, active: true } });
      } catch (e: any) {
        const code = e?.code || "";
        if (code === "P2002") {
          const target = (e?.meta?.target as string[]) || [];
          return jsonError(409, "conflict", { message: "Firma adı veya vergi no zaten mevcut", details: { fields: target } });
        }
        const message = e instanceof Error ? e.message : String(e);
        return jsonError(500, "server_error", { message });
      }
      const payload = await listCompanies();
      return NextResponse.json(payload, { status: 201 });
    }
    if (!label) return jsonError(400, "invalid_payload");
    if (key === "tedarikci") return jsonError(400, "unsupported_category", { message: "Bu kategori Ayarlar'dan düzenlenemez" });
    const cat = await getCategoryByKey(key);
    const agg = await prisma.optionItem.aggregate({ where: { categoryId: cat.id }, _max: { sort: true } });
    const nextSort = (agg._max.sort ?? 0) + 1;
    if (key === "birim") {
      const emailRaw = body?.email == null ? null : String(body.email || "").trim();
      const email = emailRaw ? emailRaw : null;
      await prisma.optionItem.create({ data: { label, active: true, sort: nextSort, categoryId: cat.id, email } });
    } else {
      await prisma.optionItem.create({ data: { label, active: true, sort: nextSort, categoryId: cat.id } });
    }
    const payload = await listItemsByKey(key);
    return NextResponse.json(payload, { status: 201 });
  } catch (e: any) {
    console.error(e);
    const msg = e?.message || "server_error";
    if (msg === "category_not_found") return jsonError(404, "category_not_found");
    return jsonError(500, "options_update_failed");
  }
}

// Update operations: rename, toggle active, move ordering
export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAuthApi(req);
    if (!auth) return jsonError(401, "unauthorized");
    const body = await req.json();
    const action = String(body?.action || "");
    const id = String(body?.id || "").trim();
    if (!id) return jsonError(400, "invalid_payload");
    const company = await prisma.company.findUnique({ where: { id } });
    if (company) {
      if (action === "toggle") {
        const active = Boolean(body?.active);
        await prisma.company.update({ where: { id }, data: { active } });
        const payload = await listCompanies();
        return NextResponse.json(payload);
      } else if (action === "rename") {
        const label = String(body?.label || "").trim();
        if (!label) return jsonError(400, "invalid_payload");
        await prisma.company.update({ where: { id }, data: { name: label } });
        const payload = await listCompanies();
        return NextResponse.json(payload);
      } else if (action === "update") {
        const name = body?.name == null ? undefined : String(body.name);
        const taxId = body?.taxId == null ? undefined : String(body.taxId || "");
        const address = body?.address == null ? undefined : String(body.address || "");
        const taxOffice = body?.taxOffice == null ? undefined : String(body.taxOffice || "");
        const phone = body?.phone == null ? undefined : String(body.phone || "");
        const email = body?.email == null ? undefined : String(body.email || "");
        const data: any = {};
        if (typeof name !== "undefined") data.name = name;
        if (typeof taxId !== "undefined") data.taxId = taxId || null;
        if (typeof address !== "undefined") data.address = address || null;
        if (typeof taxOffice !== "undefined") data.taxOffice = taxOffice || null;
        if (typeof phone !== "undefined") data.phone = phone || null;
        if (typeof email !== "undefined") data.email = email || null;
        if (!Object.keys(data).length) return jsonError(400, "no_fields_to_update");
        await prisma.company.update({ where: { id }, data });
        const payload = await listCompanies();
        return NextResponse.json(payload);
      } else {
        return jsonError(400, "unsupported_action");
      }
    }

    const item = await prisma.optionItem.findUnique({ where: { id }, include: { category: true } });
    if (!item || !item.category) return jsonError(404, "not_found");
    const key = item.category.key;
    if (["tedarikci", "firma"].includes(key)) return jsonError(400, "unsupported_category", { message: "Bu kategori Ayarlar'dan düzenlenemez" });

    if (action === "rename") {
      const label = String(body?.label || "").trim();
      if (!label) return jsonError(400, "invalid_payload");
      const data: any = { label };
      if (key === "birim") {
        const emailRaw = body?.email == null ? undefined : String(body.email || "").trim();
        if (typeof emailRaw !== "undefined") data.email = emailRaw || null;
      }
      await prisma.optionItem.update({ where: { id }, data });
    } else if (action === "toggle") {
      const active = Boolean(body?.active);
      await prisma.optionItem.update({ where: { id }, data: { active } });
    } else if (action === "move") {
      const dir = Number(body?.dir);
      if (![-1, 1].includes(dir)) return jsonError(400, "invalid_payload");
      const items = await prisma.optionItem.findMany({ where: { categoryId: (item as any).categoryId }, orderBy: [{ sort: "asc" }, { label: "asc" }] });
      const idx = items.findIndex((x) => x.id === id);
      if (idx < 0) return jsonError(404, "not_found");
      const newIdx = Math.max(0, Math.min(items.length - 1, idx + dir));
      const arr = [...items];
      const [it] = arr.splice(idx, 1);
      arr.splice(newIdx, 0, it);
      const updates = arr.map((x, i) => prisma.optionItem.update({ where: { id: x.id }, data: { sort: i + 1 } }));
      await prisma.$transaction(updates);
    } else {
      return jsonError(400, "invalid_action");
    }

    const payload = await listItemsByKey(key);
    return NextResponse.json(payload);
  } catch (e) {
    console.error(e);
    return jsonError(500, "options_update_failed");
  }
}

// Delete an option item
export async function DELETE(req: NextRequest) {
  console.log("[API/Options] DELETE Request started");
  try {
    const auth = await requireAuthApi(req);
    if (!auth) return jsonError(401, "unauthorized");
    const body = await req.json();
    const id = String(body?.id || "").trim();
    console.log("[API/Options] DELETE id:", id);

    if (!id) return jsonError(400, "invalid_payload");

    // Check if it's a company
    const company = await prisma.company.findUnique({ where: { id } });
    if (company) {
      console.log("[API/Options] Deleting company:", company.name);
      const inUseCount = await prisma.order.count({ where: { companyId: id } });
      if (inUseCount > 0) return jsonError(409, "in_use", { message: "Firma bağlı kayıtlar nedeniyle silinemiyor" });
      await prisma.company.delete({ where: { id } });
      const payload = await listCompanies();
      return NextResponse.json(payload);
    }

    // Check if it's an option item
    const item = await prisma.optionItem.findUnique({ where: { id }, include: { category: true } });
    if (!item || !item.category) {
      console.log("[API/Options] Item not found:", id);
      return jsonError(404, "not_found");
    }

    console.log("[API/Options] Deleting item:", item.label, "Category:", item.category.key);
    const key = item.category.key;
    if (["tedarikci", "firma"].includes(key)) return jsonError(400, "unsupported_category", { message: "Bu kategori Ayarlar'dan düzenlenemez" });

    await prisma.optionItem.delete({ where: { id } });

    // Reorder remaining items
    const items = await prisma.optionItem.findMany({ where: { categoryId: item.categoryId }, orderBy: [{ sort: "asc" }, { label: "asc" }] });
    const updates = items.map((x, i) => prisma.optionItem.update({ where: { id: x.id }, data: { sort: i + 1 } }));
    if (updates.length) await prisma.$transaction(updates);

    const payload = await listItemsByKey(key);
    return NextResponse.json(payload);
  } catch (e: any) {
    console.error("[API/Options] DELETE ERROR:", e);
    if (e.code === "P2003") {
      return jsonError(409, "in_use", { message: "Bu kayıt kullanımda olduğu için silinemez. Lütfen önce ilişkili kayıtları kontrol edin." });
    }
    return jsonError(500, "options_update_failed", { message: e?.message || String(e), details: e });
  }
}
