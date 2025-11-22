'use server';

import { prisma } from './prisma';
import { revalidatePath } from 'next/cache';
import { convertDecimalToNumber } from './decimal-utils';

export async function createProduct(data: {
    name: string;
    sku: string;
    price: number;
    stock: number;
    tenantId: string;
}) {
    const product = await prisma.product.create({
        data: {
            name: data.name,
            sku: data.sku,
            price: data.price,
            stock: data.stock,
            tenantId: data.tenantId,
        },
    });

    revalidatePath('/inventory');
    return convertDecimalToNumber(product);
}

export async function getProducts(tenantId: string) {
    const products = await prisma.product.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
    });
    return convertDecimalToNumber(products);
}
