import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function verifySync() {
    console.log("--- RBAC Synchronization Verification ---");

    // 1. Find a role (manager)
    const managerRole = await prisma.role.findUnique({ where: { key: "satinalma_muduru" } });
    if (!managerRole) {
        console.error("Manager role not found. Please run seed first.");
        return;
    }

    // 2. Find a user (admin as test subject)
    const testUser = await prisma.user.findUnique({ where: { username: "admin" } });
    if (!testUser) {
        console.error("Admin user not found. Please run seed first.");
        return;
    }

    console.log(`Original State: role="${testUser.role}", roleId="${testUser.roleId}"`);

    // 3. Simulate PUT /api/kullanicilar (Logic from route.ts)
    console.log("Simulating role update via API logic...");
    const body = { id: testUser.id, roleId: managerRole.id };

    const updateData = {};
    if (body.roleId !== undefined) {
        updateData.roleId = body.roleId || null;
        if (body.roleId) {
            const dbRole = await prisma.role.findUnique({ where: { id: body.roleId } });
            if (dbRole) {
                updateData.role = dbRole.key; // This is the logic we added
            }
        } else {
            updateData.role = "user";
        }
    }

    const updatedUser = await prisma.user.update({
        where: { id: body.id },
        data: updateData,
        include: { roleRef: true }
    });

    console.log(`Updated State: role="${updatedUser.role}", roleId="${updatedUser.roleId}" (Key: ${updatedUser.roleRef?.key})`);

    if (updatedUser.role === managerRole.key) {
        console.log("SUCCESS: Flat role string synchronized with Role.key");
    } else {
        console.error("FAILURE: Flat role string is out of sync!");
    }

    // 4. Revert back to admin
    const adminRole = await prisma.role.findUnique({ where: { key: "admin" } });
    if (adminRole) {
        await prisma.user.update({
            where: { id: testUser.id },
            data: { role: "admin", roleId: adminRole.id }
        });
        console.log("Reverted user back to Admin role.");
    }
}

verifySync()
    .catch(err => console.error(err))
    .finally(() => prisma.$disconnect());
