import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
    const token = "14b677c523cdb4575fcbe9ffe6b827bbb931b42080ab9cd0fd28775ea2ac5106";
    const invite = await prisma.rfqSupplier.findUnique({
        where: { token },
        include: { supplier: true }
    });
    console.log(JSON.stringify(invite, null, 2));
}
main().finally(() => prisma.$disconnect());
