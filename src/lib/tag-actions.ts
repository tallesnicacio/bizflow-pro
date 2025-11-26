'use server';

import { prisma } from './prisma';
import { revalidatePath } from 'next/cache';

export async function getTags(tenantId: string) {
    try {
        const tags = await prisma.tag.findMany({
            where: { tenantId },
            include: {
                _count: {
                    select: { contacts: true }
                }
            },
            orderBy: { name: 'asc' }
        });
        return tags;
    } catch (error) {
        console.error('Error fetching tags:', error);
        return [];
    }
}

export async function createTag(data: { name: string; color: string; tenantId: string }) {
    try {
        const existingTag = await prisma.tag.findFirst({
            where: {
                name: data.name,
                tenantId: data.tenantId
            }
        });

        if (existingTag) {
            return { success: false, error: 'Tag already exists' };
        }

        const tag = await prisma.tag.create({
            data: {
                name: data.name,
                color: data.color,
                tenantId: data.tenantId
            }
        });

        revalidatePath('/settings');
        return { success: true, tag };
    } catch (error: any) {
        console.error('Error creating tag:', error);
        return { success: false, error: error.message };
    }
}

export async function deleteTag(tagId: string, tenantId: string) {
    try {
        await prisma.tag.delete({
            where: { id: tagId, tenantId }
        });

        revalidatePath('/settings');
        return { success: true };
    } catch (error: any) {
        console.error('Error deleting tag:', error);
        return { success: false, error: error.message };
    }
}
