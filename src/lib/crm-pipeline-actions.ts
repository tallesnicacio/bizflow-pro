'use server';

import { prisma } from './prisma';
import { revalidatePath } from 'next/cache';
import { requireAuth, validateTenantAccess } from './auth-helpers';

export async function getPipelines() {
    const { tenantId } = await requireAuth();

    const pipelines = await prisma.pipeline.findMany({
        where: { tenantId },
        include: {
            stages: {
                orderBy: { order: 'asc' },
                include: {
                    opportunities: {
                        include: {
                            contact: true,
                        },
                    },
                },
            },
        },
    });

    // Convert Decimal to number for client serialization
    return pipelines.map((pipeline: any) => ({
        ...pipeline,
        stages: pipeline.stages.map((stage: any) => ({
            ...stage,
            opportunities: stage.opportunities.map((opp: any) => ({
                ...opp,
                value: opp.value.toNumber(),
            })),
        })),
    }));
}

export async function createPipeline(data: { name: string }) {
    const { tenantId } = await requireAuth();

    const pipeline = await prisma.pipeline.create({
        data: {
            name: data.name,
            tenantId,
            stages: {
                create: [
                    { name: 'New Lead', order: 0 },
                    { name: 'Qualified', order: 1 },
                    { name: 'Proposal Sent', order: 2 },
                    { name: 'Won', order: 3 },
                    { name: 'Lost', order: 4 },
                ],
            },
        },
        include: {
            stages: {
                orderBy: { order: 'asc' },
                include: {
                    opportunities: {
                        include: {
                            contact: true,
                        },
                    },
                },
            },
        },
    });

    // Convert Decimal to number for client serialization
    return {
        ...pipeline,
        stages: pipeline.stages.map((stage: any) => ({
            ...stage,
            opportunities: stage.opportunities.map((opp: any) => ({
                ...opp,
                value: opp.value.toNumber(),
            })),
        })),
    };
}

export async function createOpportunity(data: {
    title: string;
    value: number;
    contactId: string;
    stageId: string;
}) {
    const { tenantId } = await requireAuth();

    // Validate contact belongs to tenant
    const contact = await prisma.contact.findUnique({
        where: { id: data.contactId },
        select: { tenantId: true },
    });

    if (!contact) {
        throw new Error('Contact not found');
    }

    validateTenantAccess(contact.tenantId, tenantId);

    // Validate stage belongs to tenant
    const stage = await prisma.pipelineStage.findUnique({
        where: { id: data.stageId },
        include: { pipeline: { select: { tenantId: true } } },
    });

    if (!stage) {
        throw new Error('Pipeline stage not found');
    }

    validateTenantAccess(stage.pipeline.tenantId, tenantId);

    const opportunity = await prisma.opportunity.create({
        data: {
            title: data.title,
            value: data.value,
            contactId: data.contactId,
            stageId: data.stageId,
            tenantId,
        },
    });
    revalidatePath('/crm/pipelines');

    // Convert Decimal to number for client serialization
    return {
        ...opportunity,
        value: opportunity.value.toNumber(),
    };
}

export async function updateOpportunityStage(opportunityId: string, stageId: string, oldStageId?: string) {
    const { tenantId } = await requireAuth();

    // Validate opportunity belongs to tenant
    const existingOpportunity = await prisma.opportunity.findUnique({
        where: { id: opportunityId },
        select: { tenantId: true },
    });

    if (!existingOpportunity) {
        throw new Error('Opportunity not found');
    }

    validateTenantAccess(existingOpportunity.tenantId, tenantId);

    // Validate new stage belongs to tenant
    const stage = await prisma.pipelineStage.findUnique({
        where: { id: stageId },
        include: { pipeline: { select: { tenantId: true } } },
    });

    if (!stage) {
        throw new Error('Pipeline stage not found');
    }

    validateTenantAccess(stage.pipeline.tenantId, tenantId);

    const opportunity = await prisma.opportunity.update({
        where: { id: opportunityId },
        data: { stageId },
    });

    // Trigger workflow automation
    if (oldStageId) {
        const { triggerPipelineStageChanged } = await import('./workflow-triggers');
        await triggerPipelineStageChanged({
            opportunityId,
            oldStageId,
            newStageId: stageId,
            tenantId: opportunity.tenantId,
        }).catch(() => {
            // Silent fail for workflow triggers - don't block the main operation
        });
    }

    revalidatePath('/crm/pipelines');

    // Convert Decimal to number for client serialization
    return {
        ...opportunity,
        value: opportunity.value.toNumber(),
    };
}
