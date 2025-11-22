'use server';

import { prisma } from './prisma';
import { revalidatePath } from 'next/cache';
import { convertDecimalToNumber } from './decimal-utils';

// ============= HOLD CRUD =============

export async function getHolds(tenantId: string, filters?: {
    status?: string;
    contactId?: string;
    slabId?: string;
}) {
    try {
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

        const holds = await prisma.hold.findMany({
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
        });

        return holds.map(hold => ({
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
    } catch (error) {
        console.error('Failed to get holds:', error);
        throw new Error('Failed to get holds');
    }
}

export async function getHold(holdId: string) {
    try {
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
    } catch (error) {
        console.error('Failed to get hold:', error);
        throw new Error('Failed to get hold');
    }
}

export async function getSlabHolds(slabId: string) {
    try {
        const holds = await prisma.hold.findMany({
            where: { slabId },
            include: {
                contact: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        return holds;
    } catch (error) {
        console.error('Failed to get slab holds:', error);
        throw new Error('Failed to get slab holds');
    }
}

export async function createHold(data: {
    slabId: string;
    contactId?: string;
    tenantId: string;
    reason?: string;
    notes?: string;
    expiresAt: Date;
    createdBy?: string;
}) {
    try {
        // Check if slab is available
        const slab = await prisma.slab.findUnique({
            where: { id: data.slabId },
        });

        if (!slab) {
            throw new Error('Slab not found');
        }

        if (slab.status !== 'AVAILABLE') {
            throw new Error('Slab is not available for hold');
        }

        // Create hold and update slab status in transaction
        const [hold] = await prisma.$transaction([
            prisma.hold.create({
                data: {
                    slabId: data.slabId,
                    contactId: data.contactId,
                    tenantId: data.tenantId,
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
    } catch (error: any) {
        console.error('Failed to create hold:', error);
        throw new Error(error.message || 'Failed to create hold');
    }
}

export async function releaseHold(holdId: string) {
    try {
        const hold = await prisma.hold.findUnique({
            where: { id: holdId },
        });

        if (!hold) {
            throw new Error('Hold not found');
        }

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
    } catch (error: any) {
        console.error('Failed to release hold:', error);
        throw new Error(error.message || 'Failed to release hold');
    }
}

export async function convertHoldToSale(holdId: string) {
    try {
        const hold = await prisma.hold.findUnique({
            where: { id: holdId },
        });

        if (!hold) {
            throw new Error('Hold not found');
        }

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
    } catch (error: any) {
        console.error('Failed to convert hold:', error);
        throw new Error(error.message || 'Failed to convert hold');
    }
}

export async function extendHold(holdId: string, newExpiresAt: Date) {
    try {
        const hold = await prisma.hold.findUnique({
            where: { id: holdId },
        });

        if (!hold) {
            throw new Error('Hold not found');
        }

        if (hold.status !== 'ACTIVE') {
            throw new Error('Can only extend active holds');
        }

        const updatedHold = await prisma.hold.update({
            where: { id: holdId },
            data: { expiresAt: newExpiresAt },
        });

        revalidatePath('/holds');

        return updatedHold;
    } catch (error: any) {
        console.error('Failed to extend hold:', error);
        throw new Error(error.message || 'Failed to extend hold');
    }
}

export async function updateHold(holdId: string, data: {
    contactId?: string;
    reason?: string;
    notes?: string;
    expiresAt?: Date;
}) {
    try {
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
    } catch (error) {
        console.error('Failed to update hold:', error);
        throw new Error('Failed to update hold');
    }
}

export async function deleteHold(holdId: string) {
    try {
        const hold = await prisma.hold.findUnique({
            where: { id: holdId },
        });

        if (!hold) {
            throw new Error('Hold not found');
        }

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
    } catch (error) {
        console.error('Failed to delete hold:', error);
        throw new Error('Failed to delete hold');
    }
}

// ============= EXPIRY MANAGEMENT =============

export async function processExpiredHolds(tenantId: string) {
    try {
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
    } catch (error) {
        console.error('Failed to process expired holds:', error);
        throw new Error('Failed to process expired holds');
    }
}

export async function getExpiringHolds(tenantId: string, daysAhead: number = 3) {
    try {
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
    } catch (error) {
        console.error('Failed to get expiring holds:', error);
        throw new Error('Failed to get expiring holds');
    }
}

// ============= STATISTICS =============

export async function getHoldStats(tenantId: string) {
    try {
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
    } catch (error) {
        console.error('Failed to get hold stats:', error);
        throw new Error('Failed to get hold stats');
    }
}
