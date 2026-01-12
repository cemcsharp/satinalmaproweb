import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
    const id = "cmk53oidf000ifdjg3c1x2pbq";
    console.log(`--- RFQ search for ID ${id} ---`);
    const rfq = await prisma.rfq.findUnique({
        where: { id },
        include: {
            suppliers: true
        }
    });

    if (rfq) {
        console.log(`ID: ${rfq.id} | Code: ${rfq.rfxCode} | CreatedAt: ${rfq.createdAt.toISOString()}`);
        console.log(`Suppliers: ${rfq.suppliers.map(s => s.email).join(", ")}`);
    } else {
        console.log("RFQ NOT FOUND");
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
