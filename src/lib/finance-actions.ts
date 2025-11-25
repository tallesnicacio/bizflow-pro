'use server';

import { prisma } from './prisma';
import { revalidatePath } from 'next/cache';
import { requireAuth } from './auth-helpers';

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

export async function getTransactions() {
    const { tenantId } = await requireAuth();

    const transactions = await prisma.transaction.findMany({
        where: { tenantId },
        orderBy: {
            date: 'desc',
        },
    });
    return transactions;
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
