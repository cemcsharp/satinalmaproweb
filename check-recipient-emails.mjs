import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
    const email = "cmcsharp@gmail.com";
    console.log(`--- Email Logs for ${email} ---`);
    const logs = await prisma.emailLog.findMany({
        where: { to: email },
        orderBy: { createdAt: "desc" },
        take: 5
    });

    logs.forEach(log => {
        console.log(`Subject: ${log.subject} | Status: ${log.status} | CreatedAt: ${log.createdAt.toISOString()}`);
    });

    if (logs.length === 0) {
        console.log("No logs found for this email.");
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
