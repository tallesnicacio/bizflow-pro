'use server';

import { prisma } from './prisma';
import { revalidatePath } from 'next/cache';
import { convertDecimalToNumber } from './decimal-utils';
import { requireAuth } from './auth-helpers';

export async function createProduct(data: {
    name: string;
    sku: string;
    price: number;
    stock: number;
}) {
    const { tenantId } = await requireAuth();

    const product = await prisma.product.create({
        data: {
            name: data.name,
            sku: data.sku,
            price: data.price,
            stock: data.stock,
            tenantId,
        },
    });

    revalidatePath('/inventory');
    return convertDecimalToNumber(product);
}

export async function getProducts() {
    const { tenantId } = await requireAuth();

    const products = await prisma.product.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
    });
    return convertDecimalToNumber(products);
}
