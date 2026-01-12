import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
    const rfq = await prisma.rfq.findFirst({
        include: {
            suppliers: true
        }
    });

    if (rfq) {
        console.log(`RFQ ID: ${rfq.id}`);
        rfq.suppliers.forEach(s => {
            console.log(`- ${s.email}`);
        });
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
