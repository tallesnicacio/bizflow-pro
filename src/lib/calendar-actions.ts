'use server';

import { prisma } from './prisma';
import { revalidatePath } from 'next/cache';
import { requireAuth, validateTenantAccess } from './auth-helpers';
import {
    PaginationParams,
    preparePagination,
    createPaginatedResponse
} from './pagination-utils';

export async function getAppointments(paginationParams?: PaginationParams) {
    const { tenantId } = await requireAuth();

    const { page, limit, skip, take } = preparePagination(paginationParams);

    const where = { tenantId };

    const [appointments, total] = await Promise.all([
        prisma.appointment.findMany({
            where,
            include: {
                contact: true,
            },
            orderBy: { startTime: 'asc' },
            skip,
            take,
        }),
        prisma.appointment.count({ where }),
    ]);

    return createPaginatedResponse(appointments, total, page, limit);
}

export async function createAppointment(data: {
    title: string;
    startTime: Date;
    endTime: Date;
    contactId?: string;
}) {
    const { tenantId } = await requireAuth();

    // Validate contact belongs to tenant if provided
    if (data.contactId) {
        const contact = await prisma.contact.findUnique({
            where: { id: data.contactId },
            select: { tenantId: true },
        });

        if (!contact) {
            throw new Error('Contact not found');
        }

        validateTenantAccess(contact.tenantId, tenantId);
    }

    // Ensure a default calendar exists
    let calendar = await prisma.calendar.findFirst({ where: { tenantId } });
    if (!calendar) {
        calendar = await prisma.calendar.create({
            data: { name: 'Main Calendar', tenantId },
        });
    }

    const appointment = await prisma.appointment.create({
        data: {
            title: data.title,
            startTime: data.startTime,
            endTime: data.endTime,
            contactId: data.contactId,
            calendarId: calendar.id,
            tenantId,
        },
    });
    revalidatePath('/crm/calendar');
    return appointment;
}
