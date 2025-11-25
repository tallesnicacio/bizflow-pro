'use server';

import { prisma } from './prisma';
import { revalidatePath } from 'next/cache';
import { convertDecimalToNumber } from './decimal-utils';
import { requireAuth, validateTenantAccess } from './auth-helpers';
import {
    PaginationParams,
    preparePagination,
    createPaginatedResponse
} from './pagination-utils';

export async function getWorkflows(paginationParams?: PaginationParams) {
    const { tenantId } = await requireAuth();

    const { page, limit, skip, take } = preparePagination(paginationParams);

    const where = { tenantId };

    const [workflows, total] = await Promise.all([
        prisma.workflow.findMany({
            where,
            include: {
                trigger: true,
                actions: {
                    orderBy: { order: 'asc' },
                },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take,
        }),
        prisma.workflow.count({ where }),
    ]);

    return createPaginatedResponse(workflows, total, page, limit);
}

export async function getWorkflow(workflowId: string) {
    const { tenantId } = await requireAuth();

    const workflow = await prisma.workflow.findUnique({
        where: { id: workflowId },
        include: {
            trigger: true,
            actions: {
                orderBy: { order: 'asc' },
            },
        },
    });

    if (!workflow) {
        throw new Error('Workflow not found');
    }

    validateTenantAccess(workflow.tenantId, tenantId);

    return workflow;
}

export async function createWorkflow(data: {
    name: string;
    description?: string;
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
    const { tenantId } = await requireAuth();

    const workflow = await prisma.workflow.create({
        data: {
            name: data.name,
            description: data.description,
            tenantId,
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
    const { tenantId } = await requireAuth();

    // Validate workflow belongs to tenant
    const existingWorkflow = await prisma.workflow.findUnique({
        where: { id: workflowId },
        select: { tenantId: true },
    });

    if (!existingWorkflow) {
        throw new Error('Workflow not found');
    }

    validateTenantAccess(existingWorkflow.tenantId, tenantId);

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
}

export async function deleteWorkflow(workflowId: string) {
    const { tenantId } = await requireAuth();

    // Validate workflow belongs to tenant
    const existingWorkflow = await prisma.workflow.findUnique({
        where: { id: workflowId },
        select: { tenantId: true },
    });

    if (!existingWorkflow) {
        throw new Error('Workflow not found');
    }

    validateTenantAccess(existingWorkflow.tenantId, tenantId);

    await prisma.workflow.delete({
        where: { id: workflowId },
    });

    revalidatePath('/automation');
    return { success: true };
}

export async function toggleWorkflowStatus(workflowId: string, isActive: boolean) {
    const { tenantId } = await requireAuth();

    // Validate workflow belongs to tenant
    const existingWorkflow = await prisma.workflow.findUnique({
        where: { id: workflowId },
        select: { tenantId: true },
    });

    if (!existingWorkflow) {
        throw new Error('Workflow not found');
    }

    validateTenantAccess(existingWorkflow.tenantId, tenantId);

    const workflow = await prisma.workflow.update({
        where: { id: workflowId },
        data: { isActive },
    });

    revalidatePath('/automation');
    return workflow;
}
