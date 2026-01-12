import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
    const rfqCode = "RFQ-112233";
    console.log(`--- Email Logs for ${rfqCode} ---`);
    const logs = await prisma.emailLog.findMany({
        where: {
            subject: { contains: rfqCode }
        },
        orderBy: { createdAt: "desc" }
    });

    logs.forEach(log => {
        console.log(`To: ${log.to} | Status: ${log.status} | CreatedAt: ${log.createdAt.toISOString()}`);
        if (log.previewUrl) console.log(`   Preview URL: ${log.previewUrl}`);
        if (log.lastError) console.log(`   Error: ${log.lastError}`);
    });

    if (logs.length === 0) {
        console.log("No logs found for this RFQ code.");
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
