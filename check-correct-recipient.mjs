import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
    const email = "cemcsharp@gmail.com";
    console.log(`--- Email Logs for ${email} ---`);
    const logs = await prisma.emailLog.findMany({
        where: { to: email },
        orderBy: { createdAt: "desc" }
    });

    logs.forEach(log => {
        console.log(`Subject: ${log.subject} | Status: ${log.status} | CreatedAt: ${log.createdAt.toISOString()}`);
        if (log.previewUrl) console.log(`   Preview: ${log.previewUrl}`);
    });

    if (logs.length === 0) {
        console.log("No logs found for this email.");
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
