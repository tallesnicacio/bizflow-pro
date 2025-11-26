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

export async function createQuote(data: {
    customerName?: string;
    contactId?: string;
    validUntil?: Date;
    items: { productId?: string; description: string; quantity: number; unitPrice: number }[];
}) {
    const { tenantId } = await requireAuth();

    // Generate Quote Number (Simple implementation)
    const count = await prisma.quote.count({ where: { tenantId } });
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

    // If contactId is provided, validate and get customerName
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

    const quote = await prisma.quote.create({
        data: {
            number,
            customerName: finalCustomerName,
            contactId: data.contactId,
            total,
            validUntil: data.validUntil,
            tenantId,
            items: {
                create: quoteItemsData,
            },
        },
    });

    revalidatePath('/orders/quotes');
    return convertDecimalToNumber(quote);
}

export async function getQuotes(paginationParams?: PaginationParams) {
    const { tenantId } = await requireAuth();

    const { page, limit, skip, take } = preparePagination(paginationParams);

    const where = { tenantId };

    const [quotes, total] = await Promise.all([
        prisma.quote.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                contact: true,
                items: true,
            },
            skip,
            take,
        }),
        prisma.quote.count({ where }),
    ]);

    return createPaginatedResponse(
        convertDecimalToNumber(quotes),
        total,
        page,
        limit
    );
}
