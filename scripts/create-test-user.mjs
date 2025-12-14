import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createTestUser() {
    console.log('🧪 Creating test user...');

    // Get user role
    const userRole = await prisma.role.findUnique({
        where: { key: 'user' }
    });

    if (!userRole) {
        throw new Error('User role not found! Run seed-roles.mjs first.');
    }

    const password = 'testpass123';
    const passwordHash = await bcrypt.hash(password, 10);

    // Create or update test user
    const testUser = await prisma.user.upsert({
        where: { email: 'test@sirket.com' },
        update: {
            passwordHash,
            role: 'user',
            roleId: userRole.id
        },
        create: {
            username: 'testuser',
            email: 'test@sirket.com',
            passwordHash,
            role: 'user',
            roleId: userRole.id
        }
    });

    console.log('✅ Test user created/updated:');
    console.log('   Email:', testUser.email);
    console.log('   Username:', testUser.username);
    console.log('   Password:', password);
    console.log('   Role:', testUser.role);
    console.log('   RoleId:', testUser.roleId);

    return testUser;
}

createTestUser()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
