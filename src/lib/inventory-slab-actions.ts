'use server';

import { prisma } from './prisma';
import { revalidatePath } from 'next/cache';
import { requireAuth, validateTenantAccess } from './auth-helpers';

export async function getProduct(productId: string) {
    const { tenantId } = await requireAuth();

    const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
            slabs: true,
        },
    });

    if (!product) {
        throw new Error('Product not found');
    }

    validateTenantAccess(product.tenantId, tenantId);

    return product;
}

export async function createSlab(data: {
    serialNumber: string;
    length: number;
    height: number;
    thickness: number;
    finish: string;
    productId: string;
}) {
    const { tenantId } = await requireAuth();

    // Validate product belongs to tenant
    const product = await prisma.product.findUnique({
        where: { id: data.productId },
        select: { tenantId: true },
    });

    if (!product) {
        throw new Error('Product not found');
    }

    validateTenantAccess(product.tenantId, tenantId);

    const slab = await prisma.slab.create({
        data: {
            serialNumber: data.serialNumber,
            length: data.length,
            height: data.height,
            thickness: data.thickness,
            finish: data.finish,
            productId: data.productId,
            tenantId,
        },
    });
    revalidatePath(`/inventory/${data.productId}`);
    return slab;
}

export async function getSlabs(productId: string) {
    const { tenantId } = await requireAuth();

    // Validate product belongs to tenant
    const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { tenantId: true },
    });

    if (!product) {
        throw new Error('Product not found');
    }

    validateTenantAccess(product.tenantId, tenantId);

    const slabs = await prisma.slab.findMany({
        where: { productId },
        orderBy: { createdAt: 'desc' },
    });
    return slabs;
}
