import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";
const prisma = new PrismaClient();

async function upsertCategory(key, name, items) {
  const cat = await prisma.optionCategory.upsert({
    where: { key },
    update: { name },
    create: { key, name },
  });
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    await prisma.optionItem.upsert({
      where: { id: it.id },
      update: { label: it.label, active: true, sort: i + 1, categoryId: cat.id },
      create: { id: it.id, label: it.label, active: true, sort: i + 1, categoryId: cat.id },
    });
  }
}

async function main() {
  // 1. Create Default Tenant
  const defaultTenant = await prisma.tenant.upsert({
    where: { slug: "demo" },
    update: { name: "Demo Firma", email: "demo@sirket.com", plan: "pro", isActive: true },
    create: { id: "default-tenant", name: "Demo Firma", slug: "demo", email: "demo@sirket.com", plan: "pro", isActive: true },
  });

  // 2. Roles
  const adminRole = await prisma.role.upsert({
    where: { key: "admin" },
    update: {
      name: "Admin",
      permissions: [
        "talep:read", "talep:create", "talep:edit", "talep:delete",
        "siparis:read", "siparis:create", "siparis:edit", "siparis:delete",
        "rfq:read", "rfq:create", "rfq:edit", "rfq:delete",
        "teslimat:read", "teslimat:create", "teslimat:edit", "teslimat:delete",
        "fatura:read", "fatura:create", "fatura:edit", "fatura:delete",
        "sozlesme:read", "sozlesme:create", "sozlesme:edit", "sozlesme:delete",
        "tedarikci:read", "tedarikci:create", "tedarikci:edit", "tedarikci:delete",
        "evaluation:submit",
        "urun:read", "urun:create", "urun:edit", "urun:delete",
        "rapor:read",
        "ayarlar:read", "ayarlar:edit", "user:manage", "role:manage"
      ],
      description: "Tam yetkili yönetici"
    },
    create: {
      key: "admin",
      name: "Admin",
      permissions: [
        "talep:read", "talep:create", "talep:edit", "talep:delete",
        "siparis:read", "siparis:create", "siparis:edit", "siparis:delete",
        "rfq:read", "rfq:create", "rfq:edit", "rfq:delete",
        "teslimat:read", "teslimat:create", "teslimat:edit", "teslimat:delete",
        "fatura:read", "fatura:create", "fatura:edit", "fatura:delete",
        "sozlesme:read", "sozlesme:create", "sozlesme:edit", "sozlesme:delete",
        "tedarikci:read", "tedarikci:create", "tedarikci:edit", "tedarikci:delete",
        "evaluation:submit",
        "urun:read", "urun:create", "urun:edit", "urun:delete",
        "rapor:read",
        "ayarlar:read", "ayarlar:edit", "user:manage", "role:manage"
      ],
      description: "Tam yetkili yönetici"
    },
  });

  const managerRole = await prisma.role.upsert({
    where: { key: "satinalma_muduru" },
    update: {
      name: "Satın Alma Müdürü",
      permissions: [
        "talep:read", "talep:edit", "talep:delete",
        "siparis:read", "siparis:create", "siparis:edit", "siparis:delete",
        "rfq:read", "rfq:create", "rfq:edit", "rfq:delete",
        "teslimat:read", "teslimat:create", "teslimat:edit",
        "fatura:read", "fatura:create", "fatura:edit",
        "sozlesme:read", "sozlesme:create", "sozlesme:edit",
        "tedarikci:read", "tedarikci:create", "tedarikci:edit", "tedarikci:delete",
        "evaluation:submit",
        "urun:read", "urun:create", "urun:edit",
        "rapor:read",
        "ayarlar:read", "Log:read", "user:manage"
      ],
      description: "Satın alma departman yöneticisi"
    },
    create: {
      key: "satinalma_muduru",
      name: "Satın Alma Müdürü",
      permissions: [
        "talep:read", "talep:edit", "talep:delete",
        "siparis:read", "siparis:create", "siparis:edit", "siparis:delete",
        "rfq:read", "rfq:create", "rfq:edit", "rfq:delete",
        "teslimat:read", "teslimat:create", "teslimat:edit",
        "fatura:read", "fatura:create", "fatura:edit",
        "sozlesme:read", "sozlesme:create", "sozlesme:edit",
        "tedarikci:read", "tedarikci:create", "tedarikci:edit", "tedarikci:delete",
        "evaluation:submit",
        "urun:read", "urun:create", "urun:edit",
        "rapor:read",
        "ayarlar:read", "Log:read", "user:manage"
      ],
      description: "Satın alma departman yöneticisi"
    },
  });

  const userRole = await prisma.role.upsert({
    where: { key: "user" },
    update: { name: "Kullanıcı", permissions: ["talep:create", "talep:read"], description: "Standart kullanıcı" },
    create: { key: "user", name: "Kullanıcı", permissions: ["talep:create", "talep:read"], description: "Standart kullanıcı" },
  });

  const supplierRole = await prisma.role.upsert({
    where: { key: "supplier" },
    update: {
      name: "Tedarikçi",
      permissions: ["rfq:read", "offer:submit", "portal:access"],
      description: "Dış tedarikçi portal erişimi"
    },
    create: {
      key: "supplier",
      name: "Tedarikçi",
      permissions: ["rfq:read", "offer:submit", "portal:access"],
      description: "Dış tedarikçi portal erişimi"
    },
  });

  // 3. Ensure super admin user exists
  try {
    const demoUsername = "admin";
    const demoEmail = "admin@sirket.com";
    const demoPassword = "admin1234";
    const demoHash = await bcrypt.hash(demoPassword, 10);
    const demoUser = await prisma.user.upsert({
      where: { username: demoUsername },
      update: {
        email: demoEmail,
        passwordHash: demoHash,
        role: "admin",
        roleId: adminRole.id,
        isActive: true,
        isSuperAdmin: true, // Make admin a super admin
        tenantId: defaultTenant.id
      },
      create: {
        username: demoUsername,
        email: demoEmail,
        passwordHash: demoHash,
        role: "admin",
        roleId: adminRole.id,
        isActive: true,
        isSuperAdmin: true,
        tenantId: defaultTenant.id
      },
    });
  } catch (e) {
    console.warn("User creation skipped:", e.message);
  }

  // 4. Options and Categories
  await upsertCategory("ilgiliKisi", "İlgili Kişi", [
    { id: "p1", label: "Ali Yılmaz" },
    { id: "p2", label: "Ayşe Demir" },
  ]);
  await upsertCategory("birim", "Talep Eden Birim", [
    { id: "b1", label: "Satın Alma" },
    { id: "b2", label: "Üretim" },
  ]);
  await upsertCategory("durum", "Talep/Sipariş Durumu", [
    { id: "d1", label: "Taslak" },
    { id: "d2", label: "Onaylandı" },
  ]);
  await upsertCategory("paraBirimi", "Para Birimi", [
    { id: "c1", label: "TRY" },
    { id: "c2", label: "USD" },
    { id: "c3", label: "EUR" },
  ]);
  await upsertCategory("birimTipi", "Ürün Birimi", [
    { id: "u1", label: "Adet" },
    { id: "u2", label: "Kg" },
    { id: "u3", label: "Paket" },
  ]);
  await upsertCategory("siparisDurumu", "Sipariş Durumu", [
    { id: "s1", label: "Taslak" },
    { id: "s2", label: "Onaylandı" },
  ]);
  await upsertCategory("alimYontemi", "Alım Yöntemi", [
    { id: "m1", label: "Doğrudan Temin" },
    { id: "m2", label: "İhale" },
  ]);
  await upsertCategory("yonetmelikMaddesi", "Yönetmelik Maddesi", [
    { id: "y1", label: "Madde 22" },
    { id: "y2", label: "Madde 19" },
  ]);

  // 5. Suppliers (Global)
  const sup1 = await prisma.supplier.upsert({
    where: { id: "sup1" },
    update: {
      name: "ABC Tedarik",
      taxId: "1234567890",
      email: "info@abctedarik.com",
      platformApproved: true,
      registrationStatus: "approved"
    },
    create: {
      id: "sup1",
      name: "ABC Tedarik",
      taxId: "1234567890",
      email: "info@abctedarik.com",
      platformApproved: true,
      registrationStatus: "approved"
    },
  });

  const sup2 = await prisma.supplier.upsert({
    where: { id: "sup2" },
    update: {
      name: "XYZ Tedarik",
      taxId: "2234567890",
      email: "destek@xyz.com",
      platformApproved: true,
      registrationStatus: "approved"
    },
    create: {
      id: "sup2",
      name: "XYZ Tedarik",
      taxId: "2234567890",
      email: "destek@xyz.com",
      platformApproved: true,
      registrationStatus: "approved"
    },
  });

  // 6. Link Suppliers to Default Tenant
  await prisma.tenantSupplier.upsert({
    where: { tenantId_supplierId: { tenantId: defaultTenant.id, supplierId: sup1.id } },
    update: { status: "approved", approvedAt: new Date() },
    create: { tenantId: defaultTenant.id, supplierId: sup1.id, status: "approved", approvedAt: new Date() },
  });

  await prisma.tenantSupplier.upsert({
    where: { tenantId_supplierId: { tenantId: defaultTenant.id, supplierId: sup2.id } },
    update: { status: "approved", approvedAt: new Date() },
    create: { tenantId: defaultTenant.id, supplierId: sup2.id, status: "approved", approvedAt: new Date() },
  });

  // 7. Companies (Per Tenant)
  const co1 = await prisma.company.upsert({
    where: { id: "co1" },
    update: { name: "ABC Holding" },
    create: { id: "co1", name: "ABC Holding", taxId: "1111111110" }
  });

  // 8. Demo Data linked to Tenant
  const req = await prisma.request.upsert({
    where: { barcode: "REQ-2025-001" },
    update: { tenantId: defaultTenant.id },
    create: {
      barcode: "REQ-2025-001",
      subject: "Multi-tenant Demo Talep",
      budget: "10000",
      relatedPersonId: "p1",
      unitId: "b1",
      statusId: "d1",
      currencyId: "c1",
      tenantId: defaultTenant.id,
    },
  });

  const ord = await prisma.order.upsert({
    where: { barcode: "ORD-2025-001" },
    update: { tenantId: defaultTenant.id },
    create: {
      barcode: "ORD-2025-001",
      requestId: req.id,
      statusId: "s1",
      methodId: "m1",
      regulationId: "y1",
      currencyId: "c1",
      supplierId: "sup1",
      companyId: "co1",
      realizedTotal: "8500",
      tenantId: defaultTenant.id,
    },
  });

  console.log("Seed completed: Default tenant, super admin and linked data created.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
