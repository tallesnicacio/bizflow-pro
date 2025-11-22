'use server';

import { prisma } from './prisma';
import { revalidatePath } from 'next/cache';

export async function getProduct(productId: string) {
    try {
        const product = await prisma.product.findUnique({
            where: { id: productId },
            include: {
                slabs: true,
            },
        });
        return product;
    } catch (error) {
        console.error('Failed to get product:', error);
        throw new Error('Failed to get product');
    }
}

export async function createSlab(data: {
    serialNumber: string;
    length: number;
    height: number;
    thickness: number;
    finish: string;
    productId: string;
    tenantId: string;
}) {
    try {
        const slab = await prisma.slab.create({
            data: {
                serialNumber: data.serialNumber,
                length: data.length,
                height: data.height,
                thickness: data.thickness,
                finish: data.finish,
                productId: data.productId,
                tenantId: data.tenantId,
            },
        });
        revalidatePath(`/inventory/${data.productId}`);
        return slab;
    } catch (error) {
        console.error('Failed to create slab:', error);
        throw new Error('Failed to create slab');
    }
}

export async function getSlabs(productId: string) {
    try {
        const slabs = await prisma.slab.findMany({
            where: { productId },
            orderBy: { createdAt: 'desc' },
        });
        return slabs;
    } catch (error) {
        console.error('Failed to get slabs:', error);
        throw new Error('Failed to get slabs');
    }
}
