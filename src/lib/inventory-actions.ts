'use server';

import { prisma } from './prisma';
import { revalidatePath } from 'next/cache';
import { convertDecimalToNumber } from './decimal-utils';
import { requireAuth } from './auth-helpers';
import {
    PaginationParams,
    preparePagination,
    createPaginatedResponse
} from './pagination-utils';

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

export async function getProducts(paginationParams?: PaginationParams) {
    const { tenantId } = await requireAuth();

    const { page, limit, skip, take } = preparePagination(paginationParams);

    const where = { tenantId };

    const [products, total] = await Promise.all([
        prisma.product.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take,
        }),
        prisma.product.count({ where }),
    ]);

    return createPaginatedResponse(
        convertDecimalToNumber(products),
        total,
        page,
        limit
    );
}
