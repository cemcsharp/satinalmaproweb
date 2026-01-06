import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const roleKey = "satinalma_muduru";
    const permissions = {
        talep: ["read", "edit", "delete", "create"], // Added create just in case
        siparis: ["create", "read", "edit", "delete"],
        fatura: ["create", "read", "edit"],
        sozlesme: ["create", "read", "edit"],
        tedarikci: ["create", "read", "edit", "delete", "evaluation"],
        evaluation: ["submit"],
        rapor: ["read"],
        ayarlar: ["read", "edit"],
        user: ["manage"],
        role: ["manage"] // Assuming manager can manage roles? detailed list had it.
    };

    console.log(`Creating/Updating role: ${roleKey}...`);

    const role = await prisma.role.upsert({
        where: { key: roleKey },
        update: { permissions },
        create: {
            key: roleKey,
            name: "Satınalma Müdürü",
            description: "Satınalma süreçlerinin tam yöneticisi",
            isSystem: true,
            permissions
        }
    });

    console.log(`Role ready: ${role.id}`);

    const email = "ctur@pirireis.edu.tr";
    console.log(`Assigning role to user: ${email}...`);

    const user = await prisma.user.update({
        where: { email },
        data: {
            role: roleKey,
            roleId: role.id
        }
    });

    console.log(`User upgraded. Role: ${user.role}, RoleId: ${user.roleId}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
