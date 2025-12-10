import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

// Load DATABASE_URL from .env without requiring extra deps
try {
  const envPath = path.join(__dirname, "..", ".env");
  const env = fs.readFileSync(envPath, "utf8");
  const m = env.match(/DATABASE_URL\s*=\s*"([^"]+)"/);
  if (m) process.env.DATABASE_URL = m[1];
} catch {}

const prisma = new PrismaClient({ log: ["error", "warn"] });

async function main() {
  try {
    const res = await prisma.$queryRaw`SELECT 1 AS ok`;
    console.log("DB connection OK:", res);
  } catch (e) {
    console.error("DB connection FAILED:", e?.message || e);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();