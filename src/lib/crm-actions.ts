'use server';

import { prisma } from './prisma';
import { revalidatePath } from 'next/cache';
import { requireAuth, validateTenantAccess } from './auth-helpers';

export async function createContact(data: {
    name: string;
    email: string;
    phone?: string;
    stage?: string;
}) {
    const { tenantId } = await requireAuth();

    const contact = await prisma.contact.create({
        data: {
            name: data.name,
            email: data.email,
            phone: data.phone,
            stage: data.stage || 'LEAD',
            tenantId,
        },
    });

    revalidatePath('/crm');
    return contact;
}

export async function getContacts() {
    const { tenantId } = await requireAuth();

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
}

export async function updateContact(id: string, data: {
    name?: string;
    email?: string;
    phone?: string;
    stage?: string;
}) {
    const { tenantId } = await requireAuth();

    // First verify the contact belongs to this tenant
    const existingContact = await prisma.contact.findUnique({
        where: { id },
        select: { tenantId: true },
    });

    if (!existingContact) {
        throw new Error('Contact not found');
    }

    validateTenantAccess(existingContact.tenantId, tenantId);

    const contact = await prisma.contact.update({
        where: { id },
        data,
    });

    revalidatePath('/crm');
    return contact;
}
