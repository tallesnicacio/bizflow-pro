import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Create demo tenant
    const tenant = await prisma.tenant.upsert({
        where: { id: 'demo-tenant-1' },
        update: {},
        create: {
            id: 'demo-tenant-1',
            name: 'Demo Company',
            plan: 'PRO',
        },
    });

    console.log('✅ Created tenant:', tenant.name);

    // Create some sample contacts
    const contact1 = await prisma.contact.upsert({
        where: { id: 'contact-1' },
        update: {},
        create: {
            id: 'contact-1',
            tenantId: tenant.id,
            name: 'João Silva',
            email: 'joao@example.com',
            phone: '(11) 98765-4321',
            stage: 'LEAD',
        },
    });

    const contact2 = await prisma.contact.upsert({
        where: { id: 'contact-2' },
        update: {},
        create: {
            id: 'contact-2',
            tenantId: tenant.id,
            name: 'Maria Santos',
            email: 'maria@example.com',
            phone: '(11) 91234-5678',
            stage: 'CUSTOMER',
        },
    });

    console.log('✅ Created contacts:', contact1.name, contact2.name);

    console.log('🎉 Seeding completed!');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
