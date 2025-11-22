'use server';

import { prisma } from './prisma';
import { revalidatePath } from 'next/cache';

export async function getAppointments(tenantId: string) {
    try {
        const appointments = await prisma.appointment.findMany({
            where: { tenantId },
            include: {
                contact: true,
            },
            orderBy: { startTime: 'asc' },
        });
        return appointments;
    } catch (error) {
        console.error('Failed to get appointments:', error);
        throw new Error('Failed to get appointments');
    }
}

export async function createAppointment(data: {
    title: string;
    startTime: Date;
    endTime: Date;
    contactId?: string;
    tenantId: string;
}) {
    try {
        // Ensure a default calendar exists
        let calendar = await prisma.calendar.findFirst({ where: { tenantId: data.tenantId } });
        if (!calendar) {
            calendar = await prisma.calendar.create({
                data: { name: 'Main Calendar', tenantId: data.tenantId },
            });
        }

        const appointment = await prisma.appointment.create({
            data: {
                title: data.title,
                startTime: data.startTime,
                endTime: data.endTime,
                contactId: data.contactId,
                calendarId: calendar.id,
                tenantId: data.tenantId,
            },
        });
        revalidatePath('/crm/calendar');
        return appointment;
    } catch (error) {
        console.error('Failed to create appointment:', error);
        throw new Error('Failed to create appointment');
    }
}
