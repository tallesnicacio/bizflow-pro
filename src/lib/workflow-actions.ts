'use server';

import { prisma } from './prisma';
import { revalidatePath } from 'next/cache';
import { convertDecimalToNumber } from './decimal-utils';

export async function getWorkflows(tenantId: string) {
    try {
        const workflows = await prisma.workflow.findMany({
            where: { tenantId },
            include: {
                trigger: true,
                actions: {
                    orderBy: { order: 'asc' },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        return workflows;
    } catch (error) {
        console.error('Failed to get workflows:', error);
        throw new Error('Failed to get workflows');
    }
}

export async function getWorkflow(workflowId: string) {
    try {
        const workflow = await prisma.workflow.findUnique({
            where: { id: workflowId },
            include: {
                trigger: true,
                actions: {
                    orderBy: { order: 'asc' },
                },
            },
        });
        return workflow;
    } catch (error) {
        console.error('Failed to get workflow:', error);
        throw new Error('Failed to get workflow');
    }
}

export async function createWorkflow(data: {
    name: string;
    description?: string;
    tenantId: string;
    trigger: {
        type: string;
        config: any;
    };
    actions: Array<{
        type: string;
        config: any;
        order: number;
    }>;
}) {
    try {
        const workflow = await prisma.workflow.create({
            data: {
                name: data.name,
                description: data.description,
                tenantId: data.tenantId,
                trigger: {
                    create: {
                        type: data.trigger.type,
                        config: data.trigger.config,
                    },
                },
                actions: {
                    create: data.actions.map((action) => ({
                        type: action.type,
                        config: action.config,
                        order: action.order,
                    })),
                },
            },
            include: {
                trigger: true,
                actions: {
                    orderBy: { order: 'asc' },
                },
            },
        });

        revalidatePath('/automation');
        return workflow;
    } catch (error) {
        console.error('Failed to create workflow:', error);
        throw new Error('Failed to create workflow');
    }
}

export async function updateWorkflow(
    workflowId: string,
    data: {
        name?: string;
        description?: string;
        isActive?: boolean;
        trigger?: {
            type: string;
            config: any;
        };
        actions?: Array<{
            type: string;
            config: any;
            order: number;
        }>;
    }
) {
    try {
        // Update workflow basic info
        const updateData: any = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.isActive !== undefined) updateData.isActive = data.isActive;

        // If trigger is being updated, delete old and create new
        if (data.trigger) {
            await prisma.workflowTrigger.deleteMany({
                where: { workflowId },
            });
            updateData.trigger = {
                create: {
                    type: data.trigger.type,
                    config: data.trigger.config,
                },
            };
        }

        // If actions are being updated, delete old and create new
        if (data.actions) {
            await prisma.workflowAction.deleteMany({
                where: { workflowId },
            });
            updateData.actions = {
                create: data.actions.map((action) => ({
                    type: action.type,
                    config: action.config,
                    order: action.order,
                })),
            };
        }

        const workflow = await prisma.workflow.update({
            where: { id: workflowId },
            data: updateData,
            include: {
                trigger: true,
                actions: {
                    orderBy: { order: 'asc' },
                },
            },
        });

        revalidatePath('/automation');
        return workflow;
    } catch (error) {
        console.error('Failed to update workflow:', error);
        throw new Error('Failed to update workflow');
    }
}

export async function deleteWorkflow(workflowId: string) {
    try {
        await prisma.workflow.delete({
            where: { id: workflowId },
        });

        revalidatePath('/automation');
        return { success: true };
    } catch (error) {
        console.error('Failed to delete workflow:', error);
        throw new Error('Failed to delete workflow');
    }
}

export async function toggleWorkflowStatus(workflowId: string, isActive: boolean) {
    try {
        const workflow = await prisma.workflow.update({
            where: { id: workflowId },
            data: { isActive },
        });

        revalidatePath('/automation');
        return workflow;
    } catch (error) {
        console.error('Failed to toggle workflow status:', error);
        throw new Error('Failed to toggle workflow status');
    }
}
