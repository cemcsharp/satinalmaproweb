import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
    const password = 'Admin123!';
    const hash = await bcrypt.hash(password, 10);

    // Get admin role
    const role = await prisma.role.findFirst({
        where: { key: 'admin' }
    });

    // Create or update admin user
    const user = await prisma.user.upsert({
        where: { email: 'admin@sirket.com' },
        update: { passwordHash: hash },
        create: {
            email: 'admin@sirket.com',
            username: 'admin',
            passwordHash: hash,
            role: 'admin',
            roleId: role?.id
        }
    });

    console.log('✅ Admin kullanıcı oluşturuldu!');
    console.log('📧 Email:', user.email);
    console.log('🔑 Şifre:', password);

    await prisma.$disconnect();
}

createAdmin().catch(console.error);
