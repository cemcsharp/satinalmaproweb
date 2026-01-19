import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const [tenants, companies, suppliers] = await Promise.all([
        prisma.tenant.count(),
        prisma.company.count(),
        prisma.supplier.count()
    ]);
    console.log('--- Database Summary ---');
    console.log('Tenants:', tenants);
    console.log('Companies:', companies);
    console.log('Suppliers:', suppliers);
}

main().finally(() => prisma.$disconnect());
