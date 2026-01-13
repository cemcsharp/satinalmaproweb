import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

(async () => {
    try {
        console.log('=== SYSTEM SETTINGS ===\n');
        const settings = await p.systemSettings.findMany();

        if (settings.length === 0) {
            console.log('Henüz kayıtlı ayar yok.');
        } else {
            settings.forEach(s => {
                console.log(`${s.key}: "${s.value}"`);
            });
            console.log(`\nToplam ${settings.length} ayar mevcut.`);
        }
    } catch (e) {
        console.error('Hata:', e.message);
    }
    await p.$disconnect();
})();
