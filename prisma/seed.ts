import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const tenantId = 'demo-tenant-1';

    // Create Tenant
    const tenant = await prisma.tenant.upsert({
        where: { id: tenantId },
        update: {},
        create: {
            id: tenantId,
            name: 'Demo Company',
        },
    });

    console.log({ tenant });

    // Create Admin User with Hashed Password
    const hashedPassword = await bcrypt.hash('123456', 10);

    const user = await prisma.user.upsert({
        where: { email: 'admin@bizflow.com' },
        update: {
            password: hashedPassword, // Ensure password is set/updated
        },
        create: {
            email: 'admin@bizflow.com',
            name: 'Admin User',
            password: hashedPassword,
            role: 'ADMIN',
            tenantId: tenant.id,
        },
    });

    console.log({ user });

    // ... (Rest of the seed script for contacts, etc. - keeping it minimal for this update)
    // Re-seeding contacts if needed, but user/tenant is the priority for Auth.
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
