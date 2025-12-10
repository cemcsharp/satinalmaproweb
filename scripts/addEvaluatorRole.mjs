// Script to add birim_evaluator role using pure SQL
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    // Check current columns in Role table
    const columns = await prisma.$queryRaw`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'Role'
  `;
    console.log("Role table columns:", columns);

    // Try to insert role using only existing columns
    try {
        await prisma.$executeRaw`
      INSERT INTO "Role" (id, key, name, description, permissions, "createdAt", "updatedAt")
      VALUES (
        'role_birim_eval',
        'birim_evaluator',
        'Birim Değerlendiricisi',
        'Sadece tedarikçi değerlendirmesi yapabilir',
        '["evaluation:submit"]'::jsonb,
        NOW(),
        NOW()
      )
      ON CONFLICT (key) DO UPDATE SET name = 'Birim Değerlendiricisi'
    `;
        console.log("Created/updated birim_evaluator role successfully!");
    } catch (e) {
        console.error("Error creating role:", e.message);
    }
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
