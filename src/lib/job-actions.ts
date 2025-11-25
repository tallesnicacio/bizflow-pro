'use server';

import { prisma } from './prisma';
import { revalidatePath } from 'next/cache';
import { requireAuth, validateTenantAccess } from './auth-helpers';

export async function getJobs() {
    const { tenantId } = await requireAuth();

    const jobs = await prisma.job.findMany({
        where: { tenantId },
        include: {
            order: true,
            stages: {
                orderBy: { order: 'asc' },
            },
        },
        orderBy: { createdAt: 'desc' },
    });
    return jobs;
}

export async function createJob(data: {
    name: string;
    orderId?: string;
}) {
    const { tenantId } = await requireAuth();

    // Validate order belongs to tenant if provided
    if (data.orderId) {
        const order = await prisma.order.findUnique({
            where: { id: data.orderId },
            select: { tenantId: true },
        });

        if (!order) {
            throw new Error('Order not found');
        }

        validateTenantAccess(order.tenantId, tenantId);
    }

    const job = await prisma.job.create({
        data: {
            name: data.name,
            orderId: data.orderId,
            tenantId,
            status: 'PENDING',
            stages: {
                create: [
                    { name: 'Corte (Cutting)', order: 0, status: 'PENDING' },
                    { name: 'Acabamento (Polishing)', order: 1, status: 'PENDING' },
                    { name: 'Montagem (Assembly)', order: 2, status: 'PENDING' },
                    { name: 'Instalação (Installation)', order: 3, status: 'PENDING' },
                ],
            },
        },
    });
    revalidatePath('/jobs');
    return job;
}

export async function updateJobStage(stageId: string, status: string) {
    const { tenantId } = await requireAuth();

    // Validate stage belongs to tenant
    const existingStage = await prisma.jobStage.findUnique({
        where: { id: stageId },
        include: { job: { select: { tenantId: true } } },
    });

    if (!existingStage) {
        throw new Error('Job stage not found');
    }

    validateTenantAccess(existingStage.job.tenantId, tenantId);

    const stage = await prisma.jobStage.update({
        where: { id: stageId },
        data: {
            status,
            completedAt: status === 'COMPLETED' ? new Date() : null,
        },
    });

    // Check if all stages are completed to update job status
    const job = await prisma.job.findUnique({
        where: { id: stage.jobId },
        include: { stages: true },
    });

    if (job) {
        const allCompleted = job.stages.every((s: any) => s.status === 'COMPLETED');
        if (allCompleted) {
            await prisma.job.update({
                where: { id: job.id },
                data: { status: 'COMPLETED', endDate: new Date() },
            });
        } else if (job.status === 'PENDING' && status !== 'PENDING') {
            await prisma.job.update({
                where: { id: job.id },
                data: { status: 'IN_PROGRESS', startDate: new Date() },
            });
        }
    }

    revalidatePath('/jobs');
    return stage;
}
