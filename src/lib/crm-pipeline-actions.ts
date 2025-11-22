'use server';

import { prisma } from './prisma';
import { revalidatePath } from 'next/cache';

export async function getPipelines(tenantId: string) {
    try {
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
    } catch (error) {
        console.error('Failed to get pipelines:', error);
        throw new Error('Failed to get pipelines');
    }
}

export async function createPipeline(data: { name: string; tenantId: string }) {
    try {
        const pipeline = await prisma.pipeline.create({
            data: {
                name: data.name,
                tenantId: data.tenantId,
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
    } catch (error) {
        console.error('Failed to create pipeline:', error);
        throw new Error('Failed to create pipeline');
    }
}

export async function createOpportunity(data: {
    title: string;
    value: number;
    contactId: string;
    stageId: string;
    tenantId: string;
}) {
    try {
        const opportunity = await prisma.opportunity.create({
            data: {
                title: data.title,
                value: data.value,
                contactId: data.contactId,
                stageId: data.stageId,
                tenantId: data.tenantId,
            },
        });
        revalidatePath('/crm/pipelines');

        // Convert Decimal to number for client serialization
        return {
            ...opportunity,
            value: opportunity.value.toNumber(),
        };
    } catch (error) {
        console.error('Failed to create opportunity:', error);
        throw new Error('Failed to create opportunity');
    }
}

export async function updateOpportunityStage(opportunityId: string, stageId: string, oldStageId?: string) {
    try {
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
            }).catch(err => console.error('Workflow trigger failed:', err));
        }

        revalidatePath('/crm/pipelines');

        // Convert Decimal to number for client serialization
        return {
            ...opportunity,
            value: opportunity.value.toNumber(),
        };
    } catch (error) {
        console.error('Failed to update opportunity stage:', error);
        throw new Error('Failed to update opportunity stage');
    }
}
