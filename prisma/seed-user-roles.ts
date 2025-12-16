// Kullanıcıları Rollere Eşleme Script'i
// Usage: npx tsx prisma/seed-user-roles.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("🔄 Kullanıcıları yeni rollere eşliyorum...\n");

    // Önce rolleri al
    const roles = await prisma.role.findMany({
        select: { id: true, key: true, name: true }
    });

    const roleMap = new Map(roles.map(r => [r.key, r.id]));
    console.log("📋 Mevcut Roller:", roles.map(r => r.key).join(", "));

    // Tüm kullanıcıları al
    const users = await prisma.user.findMany({
        select: { id: true, username: true, email: true, role: true, roleId: true }
    });

    console.log(`\n👥 ${users.length} kullanıcı bulundu.\n`);

    let updated = 0;
    let skipped = 0;

    for (const user of users) {
        // Zaten roleId atanmış olanları atla
        if (user.roleId) {
            console.log(`  ⏭️  ${user.username} - zaten rol atanmış`);
            skipped++;
            continue;
        }

        // Eski role string'ine göre yeni rol belirle
        let newRoleKey = "birim_personeli"; // Default
        const oldRole = (user.role || "").toLowerCase();

        if (oldRole.includes("admin")) {
            newRoleKey = "admin";
        } else if (oldRole.includes("genel") && oldRole.includes("müdür")) {
            newRoleKey = "genel_mudur";
        } else if (oldRole.includes("satinalma") && oldRole.includes("müdür")) {
            newRoleKey = "satinalma_muduru";
        } else if (oldRole.includes("satinalma") || oldRole.includes("satın")) {
            newRoleKey = "satinalma_personeli";
        } else if (oldRole.includes("birim") && oldRole.includes("müdür")) {
            newRoleKey = "birim_muduru";
        } else if (oldRole.includes("manager") || oldRole.includes("yönetici")) {
            newRoleKey = "birim_muduru";
        } else if (oldRole.includes("firma") || oldRole.includes("yetkili")) {
            newRoleKey = "firma_yetkilisi";
        }

        const newRoleId = roleMap.get(newRoleKey);

        if (newRoleId) {
            await prisma.user.update({
                where: { id: user.id },
                data: { roleId: newRoleId }
            });
            console.log(`  ✅ ${user.username} → ${newRoleKey}`);
            updated++;
        } else {
            console.log(`  ⚠️  ${user.username} - rol bulunamadı: ${newRoleKey}`);
        }
    }

    console.log(`\n✅ Eşleme tamamlandı!`);
    console.log(`   Güncellenen: ${updated}`);
    console.log(`   Atlanan: ${skipped}`);

    // Özet
    console.log("\n📊 Rol Dağılımı:");
    for (const role of roles) {
        const count = await prisma.user.count({ where: { roleId: role.id } });
        if (count > 0) {
            console.log(`   ${role.name}: ${count} kullanıcı`);
        }
    }
}

main()
    .catch(e => {
        console.error("Hata:", e);
        process.exit(1);
    })
    .finally(() => {
        prisma.$disconnect();
    });
