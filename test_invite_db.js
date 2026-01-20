
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Starting Invite DB Test...");

    try {
        // 1. Get a Tenant
        console.log("Fetching a tenant...");
        const tenant = await prisma.tenant.findFirst();
        if (!tenant) {
            console.error("❌ No tenant found!");
            return;
        }
        console.log("Tenant found:", tenant.name, tenant.id);

        // 2. Get a User (Inviter)
        console.log("Fetching a user...");
        const user = await prisma.user.findFirst({ where: { tenantId: tenant.id } });
        if (!user) {
            console.error("❌ No user found for tenant!");
            return;
        }
        console.log("User found:", user.email, user.id);

        // 3. Get a Role
        console.log("Fetching a role...");
        const role = await prisma.role.findFirst();
        if (!role) {
            console.error("❌ No role found!");
            return;
        }
        console.log("Role found:", role.name, role.id);

        // 4. Create Invitation
        console.log("Creating invitation...");
        const email = `test.invite.${Date.now()}@example.com`;
        const token = `test-token-${Date.now()}`;
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        const invite = await prisma.invitation.create({
            data: {
                email: email,
                roleId: role.id,
                tenantId: tenant.id,
                invitedById: user.id,
                token: token,
                expiresAt: expiresAt,
                status: "pending"
            },
            include: {
                tenant: true,
                role: true
            }
        });

        console.log("✅ Invitation created successfully:", invite.id);

        // Clean up
        await prisma.invitation.delete({ where: { id: invite.id } });
        console.log("Test invitation cleaned up.");

    } catch (e) {
        console.error("❌ INVITE DB TEST FAILED:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
