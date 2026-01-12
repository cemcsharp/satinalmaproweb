import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    console.log(`--- Email Logs from Today (${today.toISOString()}) ---`);
    const logs = await prisma.emailLog.findMany({
        where: {
            createdAt: { gte: today }
        },
        orderBy: { createdAt: "desc" }
    });

    logs.forEach(log => {
        console.log(`To: ${log.to} | Subject: ${log.subject} | Status: ${log.status}`);
        if (log.previewUrl) console.log(`   Preview: ${log.previewUrl}`);
    });

    if (logs.length === 0) {
        console.log("No logs found for today.");
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
