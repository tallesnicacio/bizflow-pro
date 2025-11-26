'use server';

import { prisma } from './prisma';
import { revalidatePath } from 'next/cache';
import { requireAuth } from './auth-helpers';
import {
    PaginationParams,
    preparePagination,
    createPaginatedResponse
} from './pagination-utils';

export async function createTransaction(data: {
    description: string;
    amount: number;
    type: 'INCOME' | 'EXPENSE';
    category: string;
    date: Date;
}) {
    const { tenantId } = await requireAuth();

    const transaction = await prisma.transaction.create({
        data: {
            description: data.description,
            amount: data.amount,
            type: data.type,
            category: data.category,
            date: data.date,
            tenantId,
        },
    });

    revalidatePath('/finance');
    return transaction;
}

export async function getTransactions(paginationParams?: PaginationParams) {
    const { tenantId } = await requireAuth();

    const { page, limit, skip, take } = preparePagination(paginationParams);

    const where = { tenantId };

    const [transactions, total] = await Promise.all([
        prisma.transaction.findMany({
            where,
            orderBy: {
                date: 'desc',
            },
            skip,
            take,
        }),
        prisma.transaction.count({ where }),
    ]);

    return createPaginatedResponse(transactions, total, page, limit);
}

export async function getFinancialSummary() {
    const { tenantId } = await requireAuth();

    const transactions = await prisma.transaction.findMany({
        where: { tenantId },
    });

    const income = transactions
        .filter((t) => t.type === 'INCOME')
        .reduce((acc, t) => acc + Number(t.amount), 0);

    const expense = transactions
        .filter((t) => t.type === 'EXPENSE')
        .reduce((acc, t) => acc + Number(t.amount), 0);

    return {
        income,
        expense,
        balance: income - expense,
    };
}
