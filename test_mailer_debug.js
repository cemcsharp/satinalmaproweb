
const { PrismaClient } = require('@prisma/client');
const nodemailer = require('nodemailer');
const prisma = new PrismaClient();

async function main() {
    console.log("Starting email dispatch test...");

    try {
        // 1. Fetch SMTP Settings
        console.log("Fetching SMTP settings...");
        const settings = await prisma.smtpSetting.findFirst({ where: { active: true } });

        if (!settings) {
            console.error("❌ No active SMTP settings found in database!");
            return;
        }
        console.log("Found SMTP settings:", {
            host: settings.host,
            port: settings.port,
            user: settings.user,
            secure: settings.secure,
            isDefault: settings.isDefault
        });

        // 2. Create Transporter
        const transporter = nodemailer.createTransport({
            host: settings.host,
            port: settings.port,
            secure: settings.secure,
            auth: {
                user: settings.user,
                pass: settings.pass
            }
        });

        // 3. Verify Connection
        console.log("Verifying SMTP connection...");
        await transporter.verify();
        console.log("✅ SMTP Connection Verified!");

        // 4. Send Test Email
        console.log("Sending test email...");
        const info = await transporter.sendMail({
            from: settings.from || 'test@example.com',
            to: 'dummytarget@example.com', // Just to test handshake, might bounce but shouldn't 500
            subject: 'Test Email from Debug Script',
            text: 'This is a test email.'
        });

        console.log("✅ Email sent:", info.messageId);

    } catch (e) {
        console.error("❌ EMAIL TEST FAILED:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
