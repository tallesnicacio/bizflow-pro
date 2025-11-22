'use server';

import { prisma } from './prisma';
import { revalidatePath } from 'next/cache';
import { convertDecimalToNumber } from './decimal-utils';

export async function createQuote(data: {
    customerName?: string;
    contactId?: string;
    validUntil?: Date;
    items: { productId?: string; description: string; quantity: number; unitPrice: number }[];
    tenantId: string;
}) {
    try {
        // Generate Quote Number (Simple implementation)
        const count = await prisma.quote.count({ where: { tenantId: data.tenantId } });
        const number = `Q-${1000 + count + 1}`;

        let total = 0;
        const quoteItemsData = data.items.map(item => {
            const itemTotal = item.quantity * item.unitPrice;
            total += itemTotal;
            return {
                productId: item.productId,
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                total: itemTotal,
            };
        });

        // If contactId is provided, ensure customerName is set
        let finalCustomerName = data.customerName;
        if (data.contactId && !finalCustomerName) {
            const contact = await prisma.contact.findUnique({ where: { id: data.contactId } });
            if (contact) finalCustomerName = contact.name;
        }

        const quote = await prisma.quote.create({
            data: {
                number,
                customerName: finalCustomerName,
                contactId: data.contactId,
                total,
                validUntil: data.validUntil,
                tenantId: data.tenantId,
                items: {
                    create: quoteItemsData,
                },
            },
        });

        revalidatePath('/orders/quotes');
        return convertDecimalToNumber(quote);
    } catch (error) {
        console.error('Failed to create quote:', error);
        throw new Error('Failed to create quote');
    }
}

export async function getQuotes(tenantId: string) {
    try {
        const quotes = await prisma.quote.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
            include: {
                contact: true,
                items: true,
            },
        });
        return convertDecimalToNumber(quotes);
    } catch (error) {
        console.error('Failed to get quotes:', error);
        throw new Error('Failed to get quotes');
    }
}
