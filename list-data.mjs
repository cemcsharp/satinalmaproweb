import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

(async () => {
    try {
        // Get all columns from User table
        console.log('=== USER TABLOSU TÜM VERİLER ===');
        const allUsers = await p.$queryRaw`SELECT * FROM "User" LIMIT 20`;
        console.log(allUsers);

        console.log('\n=== SUPPLIER TABLOSU TÜM VERİLER ===');
        const allSuppliers = await p.$queryRaw`SELECT * FROM "Supplier" LIMIT 20`;
        console.log(allSuppliers);

        console.log('\n=== COMPANY TABLOSU TÜM VERİLER ===');
        const allCompanies = await p.$queryRaw`SELECT * FROM "Company" LIMIT 20`;
        console.log(allCompanies);

    } catch (e) {
        console.error('Hata:', e.message);
    }
    await p.$disconnect();
})();
