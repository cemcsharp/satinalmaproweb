import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
    const code = "RFQ-112233";
    console.log(`--- RFQs with code ${code} ---`);
    const rfqs = await prisma.rfq.findMany({
        where: { rfxCode: { contains: code } },
        include: {
            suppliers: true
        }
    });

    rfqs.forEach(rfq => {
        console.log(`ID: ${rfq.id} | Code: ${rfq.rfxCode} | CreatedAt: ${rfq.createdAt.toISOString()}`);
        console.log(`   Suppliers: ${rfq.suppliers.map(s => s.email).join(", ")}`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
