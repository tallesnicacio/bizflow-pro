'use server';

import { prisma } from './prisma';
import { revalidatePath } from 'next/cache';

// Type definition for Order Input
interface CreateOrderInput {
    tenantId: string;
    customerName: string;
    customerEmail: string;
    items: { productId: string; quantity: number }[];
}

/**
 * Sync Engine: createOrder
 * 1. Creates Order Record (Sales)
 * 2. Updates Inventory Stock (Inventory)
 * 3. Updates/Creates CRM Contact (CRM)
 * 4. Triggers Automation Rules (Automation)
 */
export async function createOrder(data: CreateOrderInput) {
    const { tenantId, customerName, customerEmail, items } = data;

    // 1. Calculate Total & Verify Stock
    let total = 0;
    const productUpdates: { id: string; decrement: number }[] = [];

    for (const item of items) {
        const product = await prisma.product.findUnique({
            where: { id: item.productId },
        });

        if (!product) throw new Error(`Product ${item.productId} not found`);
        if (product.stock < item.quantity) throw new Error(`Insufficient stock for ${product.name}`);

        total += Number(product.price) * item.quantity;
        productUpdates.push({
            id: item.productId,
            decrement: item.quantity,
        });
    }

    // Transaction: Ensure data integrity across modules
    const result = await prisma.$transaction(async (tx: any) => {
        // 2. Update Inventory
        for (const update of productUpdates) {
            await tx.product.update({
                where: { id: update.id },
                data: { stock: { decrement: update.decrement } },
            });
        }

        // 3. CRM Sync: Find or Create Contact
        let contact = await tx.contact.findFirst({
            where: { email: customerEmail, tenantId },
        });

        if (!contact) {
            contact = await tx.contact.create({
                data: {
                    name: customerName,
                    email: customerEmail,
                    tenantId,
                    stage: 'CUSTOMER', // Automatically move to Customer stage
                    score: 10, // Initial score
                },
            });
        } else {
            // Update existing contact
            await tx.contact.update({
                where: { id: contact.id },
                data: {
                    stage: 'CUSTOMER',
                    score: { increment: 10 }, // Increase score on purchase
                    updatedAt: new Date(),
                },
            });
        }

        // 1. Create Order
        const order = await tx.order.create({
            data: {
                tenantId,
                customerName,
                contactId: contact.id,
                total: total,
                status: 'COMPLETED',
                items: {
                    create: items.map((item) => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        price: 0, // Should fetch real price, simplified for demo
                    })),
                },
            },
        });

        return { order, contact };
    });

    // 4. Automation Triggers (Async - Fire and Forget)
    await checkTriggers(result.contact.id, result.order.id);

    revalidatePath('/');
    revalidatePath('/inventory');
    revalidatePath('/sales');
    revalidatePath('/crm');

    return result;
}

async function checkTriggers(contactId: string, orderId: string) {
    // Mock Automation Engine
    console.log(`[Automation] Checking triggers for Contact ${contactId} after Order ${orderId}...`);

    // Example Rule: If Score > 50, Send "VIP Welcome" Email
    const contact = await prisma.contact.findUnique({ where: { id: contactId } });
    if (contact && contact.score > 50) {
        console.log(`[Automation] TRIGGERED: Send VIP Email to ${contact.email}`);
        // await sendEmail(...)
    }
}
