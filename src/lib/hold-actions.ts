'use server';

import { prisma } from './prisma';
import { revalidatePath } from 'next/cache';
import { convertDecimalToNumber } from './decimal-utils';
import { requireAuth, validateTenantAccess } from './auth-helpers';
import {
    PaginationParams,
    preparePagination,
    createPaginatedResponse
} from './pagination-utils';

// ============= HOLD CRUD =============

export async function getHolds(
    filters?: {
        status?: string;
        contactId?: string;
        slabId?: string;
    },
    paginationParams?: PaginationParams
) {
    const { tenantId } = await requireAuth();

    const { page, limit, skip, take } = preparePagination(paginationParams);

    const where: any = { tenantId };

    if (filters?.status) {
        where.status = filters.status;
    }
    if (filters?.contactId) {
        where.contactId = filters.contactId;
    }
    if (filters?.slabId) {
        where.slabId = filters.slabId;
    }

    const [holds, total] = await Promise.all([
        prisma.hold.findMany({
            where,
            include: {
                slab: {
                    include: {
                        product: true,
                    },
                },
                contact: true,
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take,
        }),
        prisma.hold.count({ where }),
    ]);

    const mappedHolds = holds.map(hold => ({
        ...hold,
        slab: hold.slab ? {
            ...hold.slab,
            length: convertDecimalToNumber(hold.slab.length),
            height: convertDecimalToNumber(hold.slab.height),
            thickness: convertDecimalToNumber(hold.slab.thickness),
            product: hold.slab.product ? {
                ...hold.slab.product,
                price: convertDecimalToNumber(hold.slab.product.price),
            } : null,
        } : null,
    }));

    return createPaginatedResponse(mappedHolds, total, page, limit);
}

export async function getHold(holdId: string) {
    const { tenantId } = await requireAuth();

    const hold = await prisma.hold.findUnique({
        where: { id: holdId },
        include: {
            slab: {
                include: {
                    product: true,
                },
            },
            contact: true,
        },
    });

    if (!hold) return null;

    validateTenantAccess(hold.tenantId, tenantId);

    return {
        ...hold,
        slab: hold.slab ? {
            ...hold.slab,
            length: convertDecimalToNumber(hold.slab.length),
            height: convertDecimalToNumber(hold.slab.height),
            thickness: convertDecimalToNumber(hold.slab.thickness),
            product: hold.slab.product ? {
                ...hold.slab.product,
                price: convertDecimalToNumber(hold.slab.product.price),
            } : null,
        } : null,
    };
}

export async function getSlabHolds(slabId: string) {
    const { tenantId } = await requireAuth();

    // Validate slab belongs to tenant
    const slab = await prisma.slab.findUnique({
        where: { id: slabId },
        select: { tenantId: true },
    });

    if (!slab) {
        throw new Error('Slab not found');
    }

    validateTenantAccess(slab.tenantId, tenantId);

    const holds = await prisma.hold.findMany({
        where: { slabId },
        include: {
            contact: true,
        },
        orderBy: { createdAt: 'desc' },
    });

    return holds;
}

export async function createHold(data: {
    slabId: string;
    contactId?: string;
    reason?: string;
    notes?: string;
    expiresAt: Date;
    createdBy?: string;
}) {
    const { tenantId } = await requireAuth();

    // Validate slab belongs to tenant
    const slab = await prisma.slab.findUnique({
        where: { id: data.slabId },
        select: { status: true, tenantId: true },
    });

    if (!slab) {
        throw new Error('Slab not found');
    }

    validateTenantAccess(slab.tenantId, tenantId);

    if (slab.status !== 'AVAILABLE') {
        throw new Error('Slab is not available for hold');
    }

    // Validate contact belongs to tenant if provided
    if (data.contactId) {
        const contact = await prisma.contact.findUnique({
            where: { id: data.contactId },
            select: { tenantId: true },
        });

        if (!contact) {
            throw new Error('Contact not found');
        }

        validateTenantAccess(contact.tenantId, tenantId);
    }

    // Create hold and update slab status in transaction
    const [hold] = await prisma.$transaction([
        prisma.hold.create({
            data: {
                slabId: data.slabId,
                contactId: data.contactId,
                tenantId,
                reason: data.reason,
                notes: data.notes,
                expiresAt: data.expiresAt,
                createdBy: data.createdBy,
                status: 'ACTIVE',
            },
            include: {
                slab: {
                    include: {
                        product: true,
                    },
                },
                contact: true,
            },
        }),
        prisma.slab.update({
            where: { id: data.slabId },
            data: { status: 'HOLD' },
        }),
    ]);

    revalidatePath('/inventory');
    revalidatePath('/holds');

    return {
        ...hold,
        slab: hold.slab ? {
            ...hold.slab,
            length: convertDecimalToNumber(hold.slab.length),
            height: convertDecimalToNumber(hold.slab.height),
            thickness: convertDecimalToNumber(hold.slab.thickness),
        } : null,
    };
}

export async function releaseHold(holdId: string) {
    const { tenantId } = await requireAuth();

    const hold = await prisma.hold.findUnique({
        where: { id: holdId },
        select: { id: true, status: true, slabId: true, tenantId: true },
    });

    if (!hold) {
        throw new Error('Hold not found');
    }

    validateTenantAccess(hold.tenantId, tenantId);

    if (hold.status !== 'ACTIVE') {
        throw new Error('Hold is not active');
    }

    // Release hold and update slab status in transaction
    const [updatedHold] = await prisma.$transaction([
        prisma.hold.update({
            where: { id: holdId },
            data: {
                status: 'RELEASED',
                releasedAt: new Date(),
            },
        }),
        prisma.slab.update({
            where: { id: hold.slabId },
            data: { status: 'AVAILABLE' },
        }),
    ]);

    revalidatePath('/inventory');
    revalidatePath('/holds');

    return updatedHold;
}

export async function convertHoldToSale(holdId: string) {
    const { tenantId } = await requireAuth();

    const hold = await prisma.hold.findUnique({
        where: { id: holdId },
        select: { id: true, status: true, slabId: true, tenantId: true },
    });

    if (!hold) {
        throw new Error('Hold not found');
    }

    validateTenantAccess(hold.tenantId, tenantId);

    if (hold.status !== 'ACTIVE') {
        throw new Error('Hold is not active');
    }

    // Convert hold and update slab status in transaction
    const [updatedHold] = await prisma.$transaction([
        prisma.hold.update({
            where: { id: holdId },
            data: {
                status: 'CONVERTED',
                convertedAt: new Date(),
            },
        }),
        prisma.slab.update({
            where: { id: hold.slabId },
            data: { status: 'SOLD' },
        }),
    ]);

    revalidatePath('/inventory');
    revalidatePath('/holds');

    return updatedHold;
}

export async function extendHold(holdId: string, newExpiresAt: Date) {
    const { tenantId } = await requireAuth();

    const hold = await prisma.hold.findUnique({
        where: { id: holdId },
        select: { status: true, tenantId: true },
    });

    if (!hold) {
        throw new Error('Hold not found');
    }

    validateTenantAccess(hold.tenantId, tenantId);

    if (hold.status !== 'ACTIVE') {
        throw new Error('Can only extend active holds');
    }

    const updatedHold = await prisma.hold.update({
        where: { id: holdId },
        data: { expiresAt: newExpiresAt },
    });

    revalidatePath('/holds');

    return updatedHold;
}

export async function updateHold(holdId: string, data: {
    contactId?: string;
    reason?: string;
    notes?: string;
    expiresAt?: Date;
}) {
    const { tenantId } = await requireAuth();

    // Validate hold belongs to tenant
    const existingHold = await prisma.hold.findUnique({
        where: { id: holdId },
        select: { tenantId: true },
    });

    if (!existingHold) {
        throw new Error('Hold not found');
    }

    validateTenantAccess(existingHold.tenantId, tenantId);

    // Validate contact belongs to tenant if provided
    if (data.contactId) {
        const contact = await prisma.contact.findUnique({
            where: { id: data.contactId },
            select: { tenantId: true },
        });

        if (!contact) {
            throw new Error('Contact not found');
        }

        validateTenantAccess(contact.tenantId, tenantId);
    }

    const hold = await prisma.hold.update({
        where: { id: holdId },
        data,
        include: {
            slab: {
                include: {
                    product: true,
                },
            },
            contact: true,
        },
    });

    revalidatePath('/holds');

    return hold;
}

export async function deleteHold(holdId: string) {
    const { tenantId } = await requireAuth();

    const hold = await prisma.hold.findUnique({
        where: { id: holdId },
        select: { status: true, slabId: true, tenantId: true },
    });

    if (!hold) {
        throw new Error('Hold not found');
    }

    validateTenantAccess(hold.tenantId, tenantId);

    // If hold was active, release the slab
    if (hold.status === 'ACTIVE') {
        await prisma.$transaction([
            prisma.hold.delete({
                where: { id: holdId },
            }),
            prisma.slab.update({
                where: { id: hold.slabId },
                data: { status: 'AVAILABLE' },
            }),
        ]);
    } else {
        await prisma.hold.delete({
            where: { id: holdId },
        });
    }

    revalidatePath('/inventory');
    revalidatePath('/holds');

    return { success: true };
}

// ============= EXPIRY MANAGEMENT =============

export async function processExpiredHolds() {
    const { tenantId } = await requireAuth();

    const now = new Date();

    // Find all expired active holds
    const expiredHolds = await prisma.hold.findMany({
        where: {
            tenantId,
            status: 'ACTIVE',
            expiresAt: {
                lt: now,
            },
        },
    });

    // Process each expired hold
    const results = [];
    for (const hold of expiredHolds) {
        await prisma.$transaction([
            prisma.hold.update({
                where: { id: hold.id },
                data: {
                    status: 'EXPIRED',
                    releasedAt: now,
                },
            }),
            prisma.slab.update({
                where: { id: hold.slabId },
                data: { status: 'AVAILABLE' },
            }),
        ]);
        results.push(hold.id);
    }

    revalidatePath('/inventory');
    revalidatePath('/holds');

    return {
        success: true,
        processedCount: results.length,
        processedIds: results,
    };
}

export async function getExpiringHolds(daysAhead: number = 3) {
    const { tenantId } = await requireAuth();

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const holds = await prisma.hold.findMany({
        where: {
            tenantId,
            status: 'ACTIVE',
            expiresAt: {
                lte: futureDate,
                gte: new Date(),
            },
        },
        include: {
            slab: {
                include: {
                    product: true,
                },
            },
            contact: true,
        },
        orderBy: { expiresAt: 'asc' },
    });

    return holds.map(hold => ({
        ...hold,
        slab: hold.slab ? {
            ...hold.slab,
            length: convertDecimalToNumber(hold.slab.length),
            height: convertDecimalToNumber(hold.slab.height),
            thickness: convertDecimalToNumber(hold.slab.thickness),
        } : null,
    }));
}

// ============= STATISTICS =============

export async function getHoldStats() {
    const { tenantId } = await requireAuth();

    const [active, expired, released, converted, expiringIn3Days] = await Promise.all([
        prisma.hold.count({ where: { tenantId, status: 'ACTIVE' } }),
        prisma.hold.count({ where: { tenantId, status: 'EXPIRED' } }),
        prisma.hold.count({ where: { tenantId, status: 'RELEASED' } }),
        prisma.hold.count({ where: { tenantId, status: 'CONVERTED' } }),
        prisma.hold.count({
            where: {
                tenantId,
                status: 'ACTIVE',
                expiresAt: {
                    lte: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                    gte: new Date(),
                },
            },
        }),
    ]);

    return {
        active,
        expired,
        released,
        converted,
        expiringIn3Days,
        total: active + expired + released + converted,
    };
}
