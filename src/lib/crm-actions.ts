'use server';

import { prisma } from './prisma';
import { revalidatePath } from 'next/cache';

export async function createContact(data: {
    name: string;
    email: string;
    phone?: string;
    stage?: string;
    tenantId: string;
}) {
    try {
        const contact = await prisma.contact.create({
            data: {
                name: data.name,
                email: data.email,
                phone: data.phone,
                stage: data.stage || 'LEAD',
                tenantId: data.tenantId,
            },
        });

        revalidatePath('/crm');
        return contact;
    } catch (error) {
        console.error('Failed to create contact:', error);
        throw new Error('Failed to create contact');
    }
}

export async function getContacts(tenantId: string) {
    try {
        const contacts = await prisma.contact.findMany({
            where: { tenantId },
            orderBy: {
                createdAt: 'desc',
            },
            include: {
                _count: {
                    select: { orders: true },
                },
            },
        });
        return contacts;
    } catch (error) {
        console.error('Failed to get contacts:', error);
        throw new Error('Failed to get contacts');
    }
}

export async function updateContact(id: string, data: {
    name?: string;
    email?: string;
    phone?: string;
    stage?: string;
}) {
    try {
        const contact = await prisma.contact.update({
            where: { id },
            data,
        });

        revalidatePath('/crm');
        return contact;
    } catch (error) {
        console.error('Failed to update contact:', error);
        throw new Error('Failed to update contact');
    }
}
