'use server';

import { prisma } from './prisma';
import { revalidatePath } from 'next/cache';

export async function getUserTasks(userId: string, tenantId: string) {
    try {
        const tasks = await prisma.task.findMany({
            where: {
                assignedToId: userId,
                tenantId
            },
            include: {
                contact: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: { dueDate: 'asc' }
        });
        return tasks;
    } catch (error) {
        console.error('Error fetching tasks:', error);
        return [];
    }
}

export async function completeTask(taskId: string, tenantId: string) {
    try {
        const task = await prisma.task.update({
            where: { id: taskId, tenantId },
            data: { status: 'COMPLETED' }
        });

        revalidatePath('/crm/tasks');
        return { success: true, task };
    } catch (error: any) {
        console.error('Error completing task:', error);
        return { success: false, error: error.message };
    }
}

export async function createTask(data: { title: string; description?: string; dueDate: Date; assignedToId: string; contactId?: string; tenantId: string }) {
    try {
        const task = await prisma.task.create({
            data: {
                title: data.title,
                description: data.description,
                dueDate: data.dueDate,
                status: 'TODO',
                assignedToId: data.assignedToId,
                contactId: data.contactId,
                tenantId: data.tenantId
            }
        });

        revalidatePath('/crm/tasks');
        return { success: true, task };
    } catch (error: any) {
        console.error('Error creating task:', error);
        return { success: false, error: error.message };
    }
}
