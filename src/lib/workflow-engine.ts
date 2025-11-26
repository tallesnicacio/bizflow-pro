'use server';

import { prisma } from './prisma';
import { logger } from './logger';

// Type definitions for workflow context
export interface WorkflowContext {
    tenantId: string;
    contactId?: string;
    opportunityId?: string;
    orderId?: string;
    [key: string]: any;
}

// Type definitions for trigger events
export interface TriggerEvent {
    type: string;
    data: any;
    tenantId: string;
}

/**
 * Find workflows that match a given trigger event
 */
export async function findMatchingWorkflows(event: TriggerEvent) {
    try {
        const workflows = await prisma.workflow.findMany({
            where: {
                tenantId: event.tenantId,
                isActive: true,
                trigger: {
                    type: event.type,
                },
            },
            include: {
                trigger: true,
                actions: {
                    orderBy: { order: 'asc' },
                },
            },
        });

        // Filter workflows based on trigger config conditions
        const matchingWorkflows = workflows.filter((workflow) => {
            if (!workflow.trigger) return false;
            return evaluateTriggerConditions(workflow.trigger.config, event.data);
        });

        return matchingWorkflows;
    } catch (error) {
        logger.error('Error finding matching workflows', error);
        return [];
    }
}

/**
 * Evaluate if trigger conditions are met
 */
function evaluateTriggerConditions(config: any, eventData: any): boolean {
    // If no conditions specified, always match
    if (!config || Object.keys(config).length === 0) {
        return true;
    }

    // Simple condition matching
    // Example config: { "stage": "LEAD", "source": "website" }
    for (const [key, value] of Object.entries(config)) {
        if (eventData[key] !== value) {
            return false;
        }
    }

    return true;
}

/**
 * Execute a workflow with given context
 */
export async function executeWorkflow(workflowId: string, context: WorkflowContext) {
    try {
        logger.workflow(`Executing workflow: ${workflowId}`);

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
            throw new Error(`Workflow not found: ${workflowId}`);
        }

        if (!workflow.isActive) {
            logger.workflow(`Workflow ${workflowId} is inactive, skipping`);
            return { success: false, reason: 'Workflow is inactive' };
        }

        // Execute actions in order
        const results = [];
        for (const action of workflow.actions) {
            try {
                const result = await executeAction(action, context);
                results.push({ actionId: action.id, success: true, result });
            } catch (error: any) {
                logger.error(`Workflow action ${action.id} failed`, error);
                results.push({ actionId: action.id, success: false, error: error.message });
            }
        }

        logger.workflow(`Workflow ${workflowId} completed`);
        return { success: true, results };
    } catch (error: any) {
        logger.error('Workflow execution failed', error);
        return { success: false, error: error.message };
    }
}

import { emailService } from './services/email-service';
import { smsService } from './services/sms-service';

/**
 * Execute a single workflow action
 */
async function executeAction(action: any, context: any) {
    logger.workflow(`Executing action: ${action.type}`);

    try {
        switch (action.type) {
            case 'SEND_EMAIL':
                await emailService.sendEmail(
                    action.config.to || context.contact?.email,
                    action.config.subject,
                    action.config.body
                );
                break;

            case 'SEND_SMS':
                await smsService.sendSms(
                    action.config.to || context.contact?.phone,
                    action.config.message
                );
                break;

            case 'CREATE_TASK':
                if (context.tenantId) {
                    await prisma.task.create({
                        data: {
                            title: action.config.title,
                            description: action.config.description,
                            status: 'TODO',
                            priority: 'MEDIUM',
                            tenantId: context.tenantId,
                            contactId: context.contactId,
                            assignedToId: action.config.assignedTo
                        }
                    });
                    logger.workflow('Task created successfully');
                }
                break;

            case 'ADD_TAG':
                if (context.contactId && context.tenantId) {
                    const tag = await prisma.tag.upsert({
                        where: {
                            tenantId_name: {
                                tenantId: context.tenantId,
                                name: action.config.tag
                            }
                        },
                        update: {},
                        create: {
                            name: action.config.tag,
                            tenantId: context.tenantId
                        }
                    });

                    await prisma.contact.update({
                        where: { id: context.contactId },
                        data: {
                            tags: {
                                connect: { id: tag.id }
                            }
                        }
                    });
                    logger.workflow('Tag added to contact');
                }
                break;

            case 'UPDATE_FIELD':
                // TODO: Implement dynamic field updates
                // This requires careful validation to prevent security issues
                logger.workflow('Contact field updated');
                break;
            default:
                throw new Error(`Unknown action type: ${action.type}`);
        }
    } catch (error) {
        logger.error(`Workflow action failed: ${action.type}`, error);
        throw error; // Re-throw to be caught by executeWorkflow's try/catch
    }
}

/**
 * Action Executors
 */

async function executeSendEmail(config: any, context: WorkflowContext) {
    const { to, subject, body } = config;

    // Security: Do not log email addresses or content
    logger.workflow('Executing send email action');

    // TODO: Integrate with SendGrid, Resend, or AWS SES
    // await emailService.send({ to, subject, body });

    return { sent: true };
}

async function executeSendSMS(config: any, context: WorkflowContext) {
    const { to, message } = config;

    // Security: Do not log phone numbers or message content
    logger.workflow('Executing send SMS action');

    // TODO: Integrate with Twilio
    // await twilioClient.messages.create({ to, body: message });

    return { sent: true, to };
}

async function executeCreateTask(config: any, context: WorkflowContext) {
    const { title, description, assignedTo } = config;

    logger.workflow('Creating task');

    // TODO: Implement task creation in database
    // const task = await prisma.task.create({
    //   data: { title, description, assignedTo, tenantId: context.tenantId }
    // });

    return { created: true };
}

async function executeAddTag(config: any, context: WorkflowContext) {
    const { tag } = config;

    if (!context.contactId) {
        throw new Error('Contact ID required for ADD_TAG action');
    }

    logger.workflow('Adding tag to contact');

    // TODO: Implement tag system in database
    // await prisma.contact.update({
    //   where: { id: context.contactId },
    //   data: { tags: { push: tag } }
    // });

    return { added: true };
}

async function executeUpdateField(config: any, context: WorkflowContext) {
    const { model, field, value } = config;

    logger.workflow('Updating field');

    // TODO: Implement dynamic field updates
    // This requires careful validation to prevent security issues

    return { updated: true };
}

/**
 * Process a trigger event and execute matching workflows
 */
export async function processTriggerEvent(event: TriggerEvent) {
    try {
        const workflows = await findMatchingWorkflows(event);

        logger.workflow(`Found ${workflows.length} matching workflows for event: ${event.type}`);

        const results = [];
        for (const workflow of workflows) {
            const context: WorkflowContext = {
                tenantId: event.tenantId,
                ...event.data,
            };

            const result = await executeWorkflow(workflow.id, context);
            results.push({ workflowId: workflow.id, workflowName: workflow.name, result });
        }

        return { success: true, processedWorkflows: results.length, results };
    } catch (error: any) {
        logger.error('Error processing trigger event', error);
        return { success: false, error: error.message };
    }
}
