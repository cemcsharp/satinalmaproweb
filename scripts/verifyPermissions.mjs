import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// permissions.ts dosyasındaki mantığın aynısı
function hasPermission(userPermissions, requiredPermission, userRole) {
    if (userRole === "admin") return true;
    if (!userPermissions || userPermissions.length === 0) return false;
    if (Array.isArray(requiredPermission)) {
        return requiredPermission.some(p => userPermissions.includes(p));
    }
    return userPermissions.includes(requiredPermission);
}

// İzinleri JSON'dan array'e çevirme (Profile route'undaki mantık)
function getPermissionsFromRole(role) {
    if (!role || !role.permissions) return [];

    // permissions JSON objesi { "talep": ["read", "create"], ... } formatında olabilir
    // veya zaten array olabilir mi? Schema Json diyor.
    // Genelde { "talep": ["read"], "siparis": ["read"] } gibi saklanıyor sanırım.
    // permissions.ts içindeki mantık aslında flat list bekliyor.

    const perms = [];
    if (typeof role.permissions === 'object') {
        for (const [module, actions] of Object.entries(role.permissions)) {
            if (Array.isArray(actions)) {
                actions.forEach(action => perms.push(`${module}:${action}`));
            }
        }
    }
    return perms;
}

async function verify() {
    console.log('🔍 Yetki Doğrulama Başlatılıyor...\n');

    const email = 'ctur@pirireis.edu.tr'; // Hedef kullanıcı
    const user = await prisma.user.findUnique({
        where: { email },
        include: { roleRef: true, unit: true }
    });

    if (!user) {
        console.log(`❌ Kullanıcı bulunamadı: ${email}`);
        return;
    }

    console.log(`👤 Kullanıcı: ${user.username} (${user.email})`);
    console.log(`   Rol Alanı (string): ${user.role}`);
    console.log(`   Birim: ${user.unit ? user.unit.label : 'YOK'} (${user.unitId || 'null'})`);

    if (user.roleRef) {
        console.log(`   Rol (İlişki): ${user.roleRef.name} (${user.roleRef.key})`);
        console.log(`   Rol İzinleri (Raw):`, JSON.stringify(user.roleRef.permissions));

        const flatPermissions = getPermissionsFromRole(user.roleRef);
        console.log(`   İzinler (Liste):`, flatPermissions);

        // Testler
        console.log('\n🧪 İzin Testleri:');

        const testCase1 = hasPermission(flatPermissions, 'talep:read', user.roleRef.key);
        console.log(`   [talep:read] Var mı? -> ${testCase1 ? '✅ EVET' : '❌ HAYIR'}`);

        const testCase2 = hasPermission(flatPermissions, 'talep:create', user.roleRef.key);
        console.log(`   [talep:create] Var mı? -> ${testCase2 ? '✅ EVET' : '❌ HAYIR'}`);

        const testCase3 = hasPermission(flatPermissions, 'yonetim:full', user.roleRef.key);
        console.log(`   [yonetim:full] Var mı? -> ${testCase3 ? '✅ EVET' : '❌ HAYIR'}`);

    } else {
        console.log(`❌ Kullanıcının roleRef ilişkisi YOK! (Sadece users tablosunda 'role' alanı dolu olabilir)`);
    }

    console.log('\n💾 Veritabanı Bağlantısı Kapatılıyor...');
    await prisma.$disconnect();
}

verify();
