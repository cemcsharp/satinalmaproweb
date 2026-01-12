import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
    console.log("--- SMTP Settings ---");
    const smtp = await prisma.smtpSetting.findMany();
    console.log(JSON.stringify(smtp, null, 2));

    console.log("\n--- Last 5 Email Logs ---");
    const logs = await prisma.emailLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 5
    });
    console.log(JSON.stringify(logs, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
