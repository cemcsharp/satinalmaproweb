import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const roles = [
    {
        key: 'admin',
        name: 'Global Yönetici',
        description: 'Sistem genelinde tam yetki. UNSPSC hiyerarşisi ve Tenant yönetimi.',
        isSystem: true,
        permissions: [
            'admin:all',
            'user:manage',
            'role:manage',
            'ayarlar:read',
            'ayarlar:edit'
        ]
    },
    {
        key: 'satinalma_muduru',
        name: 'Satınalma Müdürü',
        description: 'Şirket içi satınalma stratejisi, üst limit onayları ve tedarikçi havuzu yönetimi.',
        isSystem: false,
        permissions: [
            'talep:read', 'talep:create', 'talep:edit', 'request:approve',
            'rfq:read', 'rfq:create', 'rfq:edit', 'rfq:manage', 'offer:view',
            'siparis:read', 'siparis:create', 'siparis:edit',
            'tedarikci:read', 'tedarikci:create', 'tedarikci:edit', 'evaluation:submit',
            'teslimat:read', 'teslimat:create',
            'fatura:read',
            'sozlesme:read', 'sozlesme:create',
            'urun:read', 'urun:create',
            'rapor:read', 'report:view', 'ai:forecast',
            'budget:view'
        ]
    },
    {
        key: 'finans_muduru',
        name: 'Finans Müdürü',
        description: 'Bütçe tanımlama, maliyet kontrolü ve ödeme onayları.',
        isSystem: false,
        permissions: [
            'budget:view', 'budget:manage', 'invoice:approve',
            'fatura:read', 'fatura:create', 'fatura:edit',
            'siparis:read',
            'sozlesme:read',
            'rapor:read', 'report:view'
        ]
    },
    {
        key: 'satinalma_uzmani',
        name: 'Satınalma Uzmanı',
        description: 'Talep toplama, RFQ yönetimi ve teklif değerlendirme.',
        isSystem: false,
        permissions: [
            'talep:read', 'talep:create', 'talep:edit',
            'rfq:read', 'rfq:create', 'rfq:edit', 'offer:view',
            'siparis:read', 'siparis:create',
            'tedarikci:read',
            'teslimat:read', 'teslimat:create',
            'urun:read', 'urun:create'
        ]
    },
    {
        key: 'talep_sahibi',
        name: 'Talep Sahibi',
        description: 'Mal ve hizmet talebi oluşturma, talep takibi.',
        isSystem: false,
        permissions: [
            'talep:read', 'talep:create'
        ]
    },
    {
        key: 'tedarikci',
        name: 'Onaylı Tedarikçi',
        description: 'Teklif verme, sipariş ve teslimat takibi.',
        isSystem: false,
        permissions: [
            'offer:submit',
            'siparis:read',
            'teslimat:read', 'teslimat:create',
            'portal:access'
        ]
    }
];

async function seedRoles() {
    console.log('🌱 Profesyonel Roller (v2.0) yükleniyor...');

    for (const role of roles) {
        await prisma.role.upsert({
            where: { key: role.key },
            update: {
                name: role.name,
                description: role.description,
                permissions: role.permissions,
                isSystem: role.isSystem
            },
            create: {
                key: role.key,
                name: role.name,
                description: role.description,
                permissions: role.permissions,
                isSystem: role.isSystem
            }
        });
        console.log(`✓ [${role.key}] ${role.name} senkronize edildi.`);
    }


    console.log('✅ Rol Matrisi (v2.0) başarıyla yüklendi.');
    await prisma.$disconnect();
}

seedRoles().catch(console.error);
