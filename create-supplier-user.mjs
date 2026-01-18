import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Tedarikçi kullanıcısı oluşturuluyor...');

    // İlk tedarikçiyi bul
    const supplier = await prisma.supplier.findFirst({
        where: { active: true }
    });

    if (!supplier) {
        console.log('Tedarikçi bulunamadı!');
        return;
    }

    console.log('Tedarikçi:', supplier.name);

    // Şifreyi hashle
    const passwordHash = await bcrypt.hash('123456', 10);

    // Tedarikçi kullanıcısı oluştur
    const email = 'supplier@demo.com';

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
        console.log('Kullanıcı zaten var:', email);
        console.log('\nGiriş bilgileri:');
        console.log('Email: supplier@demo.com');
        console.log('Şifre: 123456');
        console.log('Portal: http://localhost:3000/portal');
        return;
    }

    const user = await prisma.user.create({
        data: {
            username: 'supplier_demo',
            email: email,
            passwordHash: passwordHash,
            role: 'supplier',
            supplierId: supplier.id,
            isActive: true,
        }
    });

    console.log('\n✅ Tedarikçi kullanıcısı oluşturuldu!');
    console.log('\nGiriş bilgileri:');
    console.log('Email: supplier@demo.com');
    console.log('Şifre: 123456');
    console.log('Portal: http://localhost:3000/portal');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
