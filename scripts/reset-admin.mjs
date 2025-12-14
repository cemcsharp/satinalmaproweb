import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetAdminPassword() {
    const newPassword = 'admin';
    const hash = await bcrypt.hash(newPassword, 10);

    const admin = await prisma.user.update({
        where: { email: 'admin@sirket.com' },
        data: { passwordHash: hash }
    });

    console.log('✅ Admin password reset to:', newPassword);
    console.log('   Email:', admin.email);
    console.log('   Username:', admin.username);
    console.log('   Role:', admin.role);
}

resetAdminPassword()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
