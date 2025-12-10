
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSmtp() {
    const count = await prisma.smtpSetting.count({ where: { active: true } });
    const all = await prisma.smtpSetting.findMany();
    console.log(`Active SMTP Settings: ${count}`);
    console.log('All Settings:', all);
}

checkSmtp()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
