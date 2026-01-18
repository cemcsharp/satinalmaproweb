import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateBrand() {
    console.log('🔄 Updating brand to satinalma.app...');

    try {
        // Update siteName
        await prisma.systemSetting.upsert({
            where: { key: 'siteName' },
            update: { value: 'satinalma.app' },
            create: { key: 'siteName', value: 'satinalma.app' }
        });
        console.log('✅ siteName updated to satinalma.app');

        // Update siteDescription
        await prisma.systemSetting.upsert({
            where: { key: 'siteDescription' },
            update: { value: 'Kurumsal e-Satınalma Platformu' },
            create: { key: 'siteDescription', value: 'Kurumsal e-Satınalma Platformu' }
        });
        console.log('✅ siteDescription updated');

        // Update supportEmail
        await prisma.systemSetting.upsert({
            where: { key: 'supportEmail' },
            update: { value: 'destek@satinalma.app' },
            create: { key: 'supportEmail', value: 'destek@satinalma.app' }
        });
        console.log('✅ supportEmail updated to destek@satinalma.app');

        // Show current settings
        const settings = await prisma.systemSetting.findMany();
        console.log('\n📋 Current System Settings:');
        settings.forEach(s => console.log(`   ${s.key}: ${s.value}`));

        console.log('\n🎉 Brand update complete!');
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

updateBrand();
