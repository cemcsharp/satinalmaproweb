import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
    const settings = {
        key: "gmail",
        name: "Gmail",
        host: "smtp.gmail.com",
        port: 587,
        secure: false, // STARTTLS
        user: "cemtur@gmail.com",
        pass: "mjen zygx glwn mhhg",
        from: "cemtur@gmail.com",
        active: true,
        isDefault: true
    };

    console.log("Upserting SMTP settings...");
    const result = await prisma.smtpSetting.upsert({
        where: { key: settings.key },
        update: settings,
        create: settings
    });

    console.log("Success:", JSON.stringify(result, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
