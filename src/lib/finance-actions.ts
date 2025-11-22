'use server';

import { prisma } from './prisma';
import { revalidatePath } from 'next/cache';

export async function createTransaction(data: {
    description: string;
    amount: number;
    type: 'INCOME' | 'EXPENSE';
    category: string;
    date: Date;
    tenantId: string;
}) {
    try {
        const transaction = await prisma.transaction.create({
            data: {
                description: data.description,
                amount: data.amount,
                type: data.type,
                category: data.category,
                date: data.date,
                tenantId: data.tenantId,
            },
        });

        revalidatePath('/finance');
        return transaction;
    } catch (error) {
        console.error('Failed to create transaction:', error);
        throw new Error('Failed to create transaction');
    }
}

export async function getTransactions(tenantId: string) {
    try {
        const transactions = await prisma.transaction.findMany({
            where: { tenantId },
            orderBy: {
                date: 'desc',
            },
        });
        return transactions;
    } catch (error) {
        console.error('Failed to get transactions:', error);
        throw new Error('Failed to get transactions');
    }
}

export async function getFinancialSummary(tenantId: string) {
    try {
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
    } catch (error) {
        console.error('Failed to get financial summary:', error);
        throw new Error('Failed to get financial summary');
    }
}
