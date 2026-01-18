import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/apiError";

/**
 * Ürün Kategori API - SupplierCategory (UNSPSC) kullanır
 */

// GET: Kategori listesi (hiyerarşik veya düz)
export async function GET(req: NextRequest) {
    try {
        const { getUserWithPermissions } = await import("@/lib/apiAuth");
        const user = await getUserWithPermissions(req);
        if (!user) return jsonError(401, "unauthorized");

        const { searchParams } = new URL(req.url);
        const flat = searchParams.get("flat") === "true";

        if (flat) {
            const categories: any[] = await prisma.$queryRaw`
                SELECT sc.id, sc.name, sc.code, sc."parentId", sc.active,
                       p.name as "parentName", p.code as "parentCode"
                FROM "SupplierCategory" sc
                LEFT JOIN "SupplierCategory" p ON sc."parentId" = p.id
                ORDER BY sc.name ASC
            `;

            const items = categories.map(c => ({
                id: c.id,
                name: c.name,
                code: c.code || null,
                parentId: c.parentId,
                parentName: c.parentName || null,
                parentCode: c.parentCode || null,
                active: c.active
            }));

            return NextResponse.json({ items });
        } else {
            const rootCategories = await prisma.supplierCategory.findMany({
                where: { parentId: null },
                orderBy: [{ name: "asc" }],
                include: {
                    children: {
                        orderBy: [{ name: "asc" }],
                        include: {
                            children: {
                                orderBy: [{ name: "asc" }]
                            }
                        }
                    }
                }
            });

            const items = rootCategories.map((c: any) => ({
                id: c.id,
                name: c.name,
                code: c.code || c.name.substring(0, 3).toUpperCase(),
                active: c.active,
                children: c.children.map((ch: any) => ({
                    id: ch.id,
                    name: ch.name,
                    code: ch.code || ch.name.substring(0, 3).toUpperCase(),
                    parentId: c.id,
                    active: ch.active,
                    children: ch.children.map((gch: any) => ({
                        id: gch.id,
                        name: gch.name,
                        code: gch.code || gch.name.substring(0, 3).toUpperCase(),
                        parentId: ch.id,
                        active: gch.active
                    }))
                }))
            }));

            return NextResponse.json({ items });
        }
    } catch (e: any) {
        console.error("Category GET Error:", e);
        return jsonError(500, "server_error", { message: e.message });
    }
}

// POST: Manuel kategori oluşturma (Kısıtlandı)
export async function POST() {
    return jsonError(405, "method_not_allowed", { message: "Standardı korumak için manuel kategori ekleme özelliği devre dışıdır." });
}

// PUT: Kategori güncelle (admin only - aktiflik durumu veya senkronizasyon için)
export async function PUT(req: NextRequest) {
    try {
        const { getUserWithPermissions } = await import("@/lib/apiAuth");
        const user = await getUserWithPermissions(req);
        if (!user) return jsonError(401, "unauthorized");
        if (!user.isAdmin) return jsonError(403, "forbidden");

        const body = await req.json();
        const { id, active, sync } = body;

        // STANDART LİSTEYİ SENKRONİZE ET
        if (sync === true) {
            const unspscData = [
                { code: "14", name: "Kağıt ve Ofis Ürünleri", parent: null },
                { code: "14-10", name: "Kağıt Malzemeleri", parent: "14" },
                { code: "14-11", name: "Ofis Sarf Malzemeleri", parent: "14" },
                { code: "14-12", name: "Etiket ve Formlar", parent: "14" },
                { code: "22", name: "İnşaat ve Yapı Malzemeleri", parent: null },
                { code: "22-10", name: "İnşaat Makineleri", parent: "22" },
                { code: "22-11", name: "Yapı Malzemeleri", parent: "22" },
                { code: "22-12", name: "Zemin Kaplamaları", parent: "22" },
                { code: "23", name: "Sanayi ve Üretim Makineleri", parent: null },
                { code: "23-10", name: "Metal İşleme Makineleri", parent: "23" },
                { code: "23-11", name: "Endüstriyel Robotlar", parent: "23" },
                { code: "23-12", name: "Paketleme Makineleri", parent: "23" },
                { code: "25", name: "Araç ve Taşıtlar", parent: null },
                { code: "25-10", name: "Motorlu Taşıtlar", parent: "25" },
                { code: "25-11", name: "Taşıt Yedek Parçaları", parent: "25" },
                { code: "25-12", name: "Lastikler", parent: "25" },
                { code: "26", name: "Elektrik ve Aydınlatma", parent: null },
                { code: "26-10", name: "Elektrik Kabloları", parent: "26" },
                { code: "26-11", name: "Aydınlatma Ürünleri", parent: "26" },
                { code: "26-12", name: "Elektrik Panoları ve Şalterleri", parent: "26" },
                { code: "26-13", name: "Jeneratörler", parent: "26" },
                { code: "26-14", name: "Transformatörler", parent: "26" },
                { code: "27", name: "Araç Gereç ve El Aletleri", parent: null },
                { code: "27-10", name: "El Aletleri", parent: "27" },
                { code: "27-11", name: "Elektrikli El Aletleri", parent: "27" },
                { code: "27-12", name: "Ölçüm Aletleri", parent: "27" },
                { code: "31", name: "Üretim Bileşenleri", parent: null },
                { code: "31-10", name: "Rulmanlar ve Yataklar", parent: "31" },
                { code: "31-11", name: "Contalar ve Keçeler", parent: "31" },
                { code: "31-12", name: "Bağlantı Elemanları", parent: "31" },
                { code: "31-13", name: "Valfler ve Vanalar", parent: "31" },
                { code: "40", name: "HVAC ve İklimlendirme", parent: null },
                { code: "40-10", name: "Isıtma Sistemleri", parent: "40" },
                { code: "40-11", name: "Soğutma Sistemleri", parent: "40" },
                { code: "40-12", name: "Havalandırma Ekipmanları", parent: "40" },
                { code: "40-13", name: "Sıhhi Tesisat", parent: "40" },
                { code: "43", name: "Bilgi Teknolojileri", parent: null },
                { code: "43-20", name: "Bilgisayar Aksesuarları", parent: "43" },
                { code: "43-21", name: "Bilgisayarlar", parent: "43" },
                { code: "43-22", name: "Yazılım", parent: "43" },
                { code: "43-23", name: "Ağ Ekipmanları", parent: "43" },
                { code: "43-24", name: "Veri Depolama", parent: "43" },
                { code: "44", name: "Ofis Ekipmanları", parent: null },
                { code: "44-10", name: "Kırtasiye Malzemeleri", parent: "44" },
                { code: "44-11", name: "Ofis Mobilyaları", parent: "44" },
                { code: "44-12", name: "Yazıcı ve Fotokopi Makineleri", parent: "44" },
                { code: "44-13", name: "Telefon ve Faks", parent: "44" },
                { code: "45", name: "Yayın ve Baskı", parent: null },
                { code: "45-10", name: "Baskı Makineleri", parent: "45" },
                { code: "45-11", name: "Baskı Sarf Malzemeleri", parent: "45" },
                { code: "46", name: "Güvenlik Ekipmanları", parent: null },
                { code: "46-10", name: "Kişisel Koruyucu Ekipmanlar (KKD)", parent: "46" },
                { code: "46-11", name: "Yangın Söndürme Ekipmanları", parent: "46" },
                { code: "46-12", name: "Güvenlik Kameraları", parent: "46" },
                { code: "46-13", name: "Geçiş Kontrol Sistemleri", parent: "46" },
                { code: "47", name: "Temizlik ve Hijyen", parent: null },
                { code: "47-13", name: "Temizlik Kimyasalları", parent: "47" },
                { code: "47-14", name: "Kağıt Ürünleri (Havlu, Peçete)", parent: "47" },
                { code: "47-15", name: "Temizlik Ekipmanları", parent: "47" },
                { code: "47-16", name: "Çöp Torbaları", parent: "47" },
                { code: "50", name: "Gıda ve İçecek", parent: null },
                { code: "50-10", name: "Yiyecekler", parent: "50" },
                { code: "50-11", name: "İçecekler", parent: "50" },
                { code: "50-12", name: "Kahve ve Çay", parent: "50" },
                { code: "50-13", name: "Şekerleme ve Atıştırmalık", parent: "50" },
                { code: "51", name: "İlaç ve Medikal Malzemeler", parent: null },
                { code: "51-10", name: "İlaçlar", parent: "51" },
                { code: "51-11", name: "Tıbbi Sarf Malzemeleri", parent: "51" },
                { code: "51-12", name: "Tıbbi Cihazlar", parent: "51" },
                { code: "51-13", name: "Laboratuvar Malzemeleri", parent: "51" },
                { code: "53", name: "Tekstil ve Giyim", parent: null },
                { code: "53-10", name: "İş Elbiseleri", parent: "53" },
                { code: "53-11", name: "Kumaş ve Tekstil Ürünleri", parent: "53" },
                { code: "53-12", name: "Promosyon Tekstil", parent: "53" },
                { code: "56", name: "Mobilya ve Dekorasyon", parent: null },
                { code: "56-10", name: "Ofis Mobilyaları", parent: "56" },
                { code: "56-11", name: "Oturma Grupları", parent: "56" },
                { code: "56-12", name: "Depolama ve Raflar", parent: "56" },
                { code: "72", name: "İnşaat Hizmetleri", parent: null },
                { code: "72-10", name: "Yapı İnşaat Hizmetleri", parent: "72" },
                { code: "72-11", name: "Tadilat ve Renovasyon", parent: "72" },
                { code: "72-12", name: "Tesisat Hizmetleri", parent: "72" },
                { code: "74", name: "Personel ve İK Hizmetleri", parent: null },
                { code: "80", name: "İş Destek Hizmetleri", parent: null },
                { code: "80-10", name: "Danışmanlık Hizmetleri", parent: "80" },
                { code: "80-11", name: "İnsan Kaynakları Hizmetleri", parent: "80" },
                { code: "80-12", name: "Muhasebe Hizmetleri", parent: "80" },
                { code: "80-13", name: "Hukuk Hizmetleri", parent: "80" },
                { code: "81", name: "Mühendislik ve Teknik Hizmetler", parent: null },
                { code: "81-10", name: "Mühendislik Danışmanlık", parent: "81" },
                { code: "81-11", name: "Bakım ve Onarım", parent: "81" },
                { code: "81-12", name: "Kalibrasyon Hizmetleri", parent: "81" },
                { code: "82", name: "Reklam ve Pazarlama", parent: null },
                { code: "82-10", name: "Reklam Hizmetleri", parent: "82" },
                { code: "82-11", name: "Promosyon Ürünleri", parent: "82" },
                { code: "82-12", name: "Etkinlik Organizasyonu", parent: "82" },
                { code: "86", name: "Eğitim ve Seminer", parent: null },
                { code: "86-10", name: "Mesleki Eğitimler", parent: "86" },
                { code: "86-11", name: "Sertifika Programları", parent: "86" },
                { code: "86-12", name: "Konferans ve Seminer", parent: "86" }
            ];

            const codeToId = new Map<string, string>();
            const segments = unspscData.filter(c => c.parent === null);
            for (const cat of segments) {
                const existing = await prisma.supplierCategory.findFirst({ where: { name: cat.name } });
                if (existing) { codeToId.set(cat.code, existing.id); }
                else {
                    const created = await prisma.supplierCategory.create({ data: { name: cat.name, code: cat.code, parentId: null } });
                    codeToId.set(cat.code, created.id);
                }
            }
            const families = unspscData.filter(c => c.parent !== null);
            for (const cat of families) {
                const parentId = codeToId.get(cat.parent!);
                if (!parentId) continue;
                const existing = await prisma.supplierCategory.findFirst({ where: { name: cat.name, parentId } });
                if (!existing) {
                    await prisma.supplierCategory.create({ data: { name: cat.name, code: cat.code, parentId } });
                }
            }
            return NextResponse.json({ ok: true, message: "Katalog standart hale getirildi." });
        }

        if (!id) return jsonError(400, "missing_id");
        const category = await prisma.supplierCategory.update({
            where: { id },
            data: { active: active ?? undefined }
        });
        return NextResponse.json(category);
    } catch (e: any) {
        console.error("Category PUT Error:", e);
        return jsonError(500, "server_error", { message: e.message });
    }
}

// DELETE: Kısıtlandı
export async function DELETE() {
    return jsonError(405, "method_not_allowed", { message: "Standardı korumak için kategori silme özelliği devre dışıdır." });
}
