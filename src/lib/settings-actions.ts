'use server';

import { prisma } from './prisma';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';

export async function getUsers(tenantId: string) {
    try {
        const users = await prisma.user.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
            }
        });
        return users;
    } catch (error) {
        console.error('Error fetching users:', error);
        return [];
    }
}

export async function createUser(data: { name: string; email: string; role: string; tenantId: string }) {
    try {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email }
        });

        if (existingUser) {
            throw new Error('User with this email already exists');
        }

        // Create user with default password '123456' (in production this should be an invite flow)
        const hashedPassword = await bcrypt.hash('123456', 10);

        const user = await prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                password: hashedPassword,
                role: data.role,
                tenantId: data.tenantId,
            }
        });

        revalidatePath('/settings');
        return { success: true, user };
    } catch (error: any) {
        console.error('Error creating user:', error);
        return { success: false, error: error.message };
    }
}

export async function deleteUser(userId: string, tenantId: string) {
    try {
        // Prevent deleting the last admin or yourself (logic simplified for now)
        await prisma.user.delete({
            where: { id: userId, tenantId } // Ensure user belongs to tenant
        });

        revalidatePath('/settings');
        return { success: true };
    } catch (error: any) {
        console.error('Error deleting user:', error);
        return { success: false, error: error.message };
    }
}

export async function getTenant(tenantId: string) {
    try {
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId }
        });
        return tenant;
    } catch (error) {
        console.error('Error fetching tenant:', error);
        return null;
    }
}

export async function updateTenant(tenantId: string, data: { name: string }) {
    try {
        const tenant = await prisma.tenant.update({
            where: { id: tenantId },
            data: { name: data.name }
        });

        revalidatePath('/settings');
        return { success: true, tenant };
    } catch (error: any) {
        console.error('Error updating tenant:', error);
        return { success: false, error: error.message };
    }
}
