'use server';

import { prisma } from './prisma';
import { revalidatePath } from 'next/cache';
import { Decimal } from '@prisma/client/runtime/library';
import { triggerAutomations } from './automation-actions';

// --- Pipeline Management ---

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
            orderBy: { createdAt: 'asc' }
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
        console.error('Error fetching pipelines:', error);
        return [];
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
                        { name: 'Lead', order: 0, color: '#94a3b8' },
                        { name: 'Contacted', order: 1, color: '#3b82f6' },
                        { name: 'Proposal', order: 2, color: '#eab308' },
                        { name: 'Won', order: 3, color: '#22c55e' },
                        { name: 'Lost', order: 4, color: '#ef4444' }
                    ]
                }
            },
            include: {
                stages: {
                    orderBy: { order: 'asc' },
                    include: {
                        opportunities: {
                            include: { contact: true }
                        }
                    }
                }
            }
        });

        revalidatePath('/crm/pipelines');

        // Serialization
        return {
            success: true,
            pipeline: {
                ...pipeline,
                stages: pipeline.stages.map((stage: any) => ({
                    ...stage,
                    opportunities: []
                }))
            }
        };
    } catch (error: any) {
        console.error('Error creating pipeline:', error);
        return { success: false, error: error.message };
    }
}

// --- Stage Management ---

export async function createStage(data: { name: string; color: string; pipelineId: string; order: number }) {
    try {
        const stage = await prisma.pipelineStage.create({
            data: {
                name: data.name,
                color: data.color,
                order: data.order,
                pipelineId: data.pipelineId
            }
        });

        revalidatePath('/crm/pipelines/settings');
        revalidatePath('/crm/pipelines');
        return { success: true, stage };
    } catch (error: any) {
        console.error('Error creating stage:', error);
        return { success: false, error: error.message };
    }
}

export async function updateStage(stageId: string, data: { name?: string; color?: string }) {
    try {
        const stage = await prisma.pipelineStage.update({
            where: { id: stageId },
            data
        });

        revalidatePath('/crm/pipelines/settings');
        revalidatePath('/crm/pipelines');
        return { success: true, stage };
    } catch (error: any) {
        console.error('Error updating stage:', error);
        return { success: false, error: error.message };
    }
}

export async function deleteStage(stageId: string) {
    try {
        // Check if stage has opportunities
        const count = await prisma.opportunity.count({
            where: { stageId }
        });

        if (count > 0) {
            return { success: false, error: 'Cannot delete stage with opportunities. Move them first.' };
        }

        await prisma.pipelineStage.delete({
            where: { id: stageId }
        });

        revalidatePath('/crm/pipelines/settings');
        revalidatePath('/crm/pipelines');
        return { success: true };
    } catch (error: any) {
        console.error('Error deleting stage:', error);
        return { success: false, error: error.message };
    }
}

export async function updateStageOrder(stages: { id: string; order: number }[]) {
    try {
        await prisma.$transaction(
            stages.map((stage) =>
                prisma.pipelineStage.update({
                    where: { id: stage.id },
                    data: { order: stage.order }
                })
            )
        );

        revalidatePath('/crm/pipelines/settings');
        revalidatePath('/crm/pipelines');
        return { success: true };
    } catch (error: any) {
        console.error('Error updating stage order:', error);
        return { success: false, error: error.message };
    }
}

// Helper to serialize Decimal to number for client
function serializeOpportunity<T extends { value: Decimal }>(opportunity: T) {
    return {
        ...opportunity,
        value: opportunity.value.toNumber(),
    };
}

// --- Opportunity Management ---

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
                tenantId: data.tenantId
            },
            include: {
                stage: true // Need pipelineId
            }
        });

        // Trigger Automation
        await triggerAutomations('CARD_CREATED', {
            pipelineId: opportunity.stage.pipelineId,
            stageId: opportunity.stageId,
            opportunityId: opportunity.id,
            userId: 'system', // TODO: Pass actual user ID
            tenantId: data.tenantId
        });

        revalidatePath('/crm/pipelines');
        return { success: true, opportunity: serializeOpportunity(opportunity) };
    } catch (error: any) {
        console.error('Error creating opportunity:', error);
        return { success: false, error: error.message };
    }
}

export async function updateOpportunityStage(opportunityId: string, newStageId: string, oldStageId: string) {
    try {
        const opportunity = await prisma.opportunity.update({
            where: { id: opportunityId },
            data: { stageId: newStageId },
            include: { stage: true }
        });

        // Trigger Automation
        await triggerAutomations('STAGE_ENTER', {
            pipelineId: opportunity.stage.pipelineId,
            stageId: newStageId,
            opportunityId: opportunity.id,
            userId: 'system', // TODO: Pass actual user ID
            tenantId: opportunity.tenantId
        });

        revalidatePath('/crm/pipelines');
        return { success: true, opportunity: serializeOpportunity(opportunity) };
    } catch (error: any) {
        console.error('Error updating opportunity stage:', error);
        return { success: false, error: error.message };
    }
}
