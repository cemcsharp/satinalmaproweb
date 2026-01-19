import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const tenants = await prisma.tenant.findMany({ select: { id: true, name: true, plan: true, planExpiresAt: true, isActive: true } });
    const companies = await prisma.company.findMany({ select: { id: true, name: true, active: true } });
    const users = await prisma.user.findMany({ select: { email: true, tenantId: true, supplierId: true } });

    console.log('--- Tenants ---');
    console.table(tenants);

    console.log('--- Companies ---');
    console.table(companies);

    console.log('--- Users ---');
    console.table(users);
}

main().finally(() => prisma.$disconnect());
