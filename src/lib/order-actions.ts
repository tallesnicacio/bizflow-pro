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

export async function createOrder(data: {
    customerName?: string;
    contactId?: string;
    items: { productId: string; quantity: number }[];
}) {
    const { tenantId } = await requireAuth();

    // 1. Calculate total and verify stock
    let total = 0;
    const orderItemsData: { productId: string; quantity: number; price: any }[] = [];

    // If contactId is provided, validate it belongs to tenant and get the name
    let finalCustomerName = data.customerName;
    if (data.contactId) {
        const contact = await prisma.contact.findUnique({
            where: { id: data.contactId },
            select: { name: true, tenantId: true },
        });

        if (!contact) {
            throw new Error('Contact not found');
        }

        validateTenantAccess(contact.tenantId, tenantId);

        if (!finalCustomerName) {
            finalCustomerName = contact.name;
        }
    }

    // Validate all products belong to tenant
    for (const item of data.items) {
        const product = await prisma.product.findUnique({
            where: { id: item.productId },
            select: { price: true, stock: true, name: true, tenantId: true },
        });

        if (!product) {
            throw new Error(`Product not found: ${item.productId}`);
        }

        validateTenantAccess(product.tenantId, tenantId);

        if (product.stock < item.quantity) {
            throw new Error(`Insufficient stock for product: ${product.name}`);
        }

        const itemTotal = Number(product.price) * item.quantity;
        total += itemTotal;

        orderItemsData.push({
            productId: item.productId,
            quantity: item.quantity,
            price: product.price,
        });
    }

    // 2. Create Order and OrderItems in a transaction
    const order = await prisma.$transaction(async (tx) => {
        // Create the order
        const newOrder = await tx.order.create({
            data: {
                customerName: finalCustomerName,
                contactId: data.contactId,
                total: total,
                tenantId,
                status: 'PENDING',
                items: {
                    create: orderItemsData,
                },
            },
            include: {
                items: true,
            },
        });

        // Update stock for each product
        for (const item of orderItemsData) {
            await tx.product.update({
                where: { id: item.productId },
                data: {
                    stock: {
                        decrement: item.quantity,
                    },
                },
            });
        }

        return newOrder;
    });

    revalidatePath('/orders');
    revalidatePath('/inventory'); // Stock changed
    return convertDecimalToNumber(order);
}

export async function getOrders(paginationParams?: PaginationParams) {
    const { tenantId } = await requireAuth();

    const { page, limit, skip, take } = preparePagination(paginationParams);

    const where = { tenantId };

    const [orders, total] = await Promise.all([
        prisma.order.findMany({
            where,
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
            skip,
            take,
        }),
        prisma.order.count({ where }),
    ]);

    return createPaginatedResponse(
        convertDecimalToNumber(orders),
        total,
        page,
        limit
    );
}
