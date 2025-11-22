'use server';

import { prisma } from './prisma';
import { revalidatePath } from 'next/cache';

export async function getJobs(tenantId: string) {
    try {
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
    } catch (error) {
        console.error('Failed to get jobs:', error);
        throw new Error('Failed to get jobs');
    }
}

export async function createJob(data: {
    name: string;
    orderId?: string;
    tenantId: string;
}) {
    try {
        const job = await prisma.job.create({
            data: {
                name: data.name,
                orderId: data.orderId,
                tenantId: data.tenantId,
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
    } catch (error) {
        console.error('Failed to create job:', error);
        throw new Error('Failed to create job');
    }
}

export async function updateJobStage(stageId: string, status: string) {
    try {
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
    } catch (error) {
        console.error('Failed to update job stage:', error);
        throw new Error('Failed to update job stage');
    }
}
