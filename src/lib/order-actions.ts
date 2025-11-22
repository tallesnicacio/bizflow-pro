'use server';

import { prisma } from './prisma';
import { revalidatePath } from 'next/cache';
import { convertDecimalToNumber } from './decimal-utils';

export async function createOrder(data: {
    customerName?: string;
    contactId?: string;
    items: { productId: string; quantity: number }[];
    tenantId: string;
}) {
    try {
        // 1. Calculate total and verify stock
        let total = 0;
        const orderItemsData: { productId: string; quantity: number; price: any }[] = [];

        // If contactId is provided, get the name
        let finalCustomerName = data.customerName;
        if (data.contactId && !finalCustomerName) {
            const contact = await prisma.contact.findUnique({ where: { id: data.contactId } });
            if (contact) finalCustomerName = contact.name;
        }

        for (const item of data.items) {
            const product = await prisma.product.findUnique({
                where: { id: item.productId },
            });

            if (!product) {
                throw new Error(`Product not found: ${item.productId}`);
            }

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
                    tenantId: data.tenantId,
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
    } catch (error) {
        console.error('Failed to create order:', error);
        throw error;
    }
}

export async function getOrders(tenantId: string) {
    try {
        const orders = await prisma.order.findMany({
            where: { tenantId },
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
        });
        return convertDecimalToNumber(orders);
    } catch (error) {
        console.error('Failed to get orders:', error);
        throw new Error('Failed to get orders');
    }
}
