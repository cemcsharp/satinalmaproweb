import { PrismaClient } from "@prisma/client";

async function main() {
  const prisma = new PrismaClient({ log: ["error", "warn"] });
  try {
    const users = await prisma.user.findMany({ select: { id: true, username: true, email: true } });
    console.log(JSON.stringify(users, null, 2));
  } catch (e) {
    console.error("ERR", e?.message || e);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();