'use server';

import { processTriggerEvent, TriggerEvent } from './workflow-engine';

/**
 * Trigger workflow when a contact is created
 */
export async function triggerContactCreated(data: {
    contact: any;
    tenantId: string;
}) {
    const event: TriggerEvent = {
        type: 'CONTACT_CREATED',
        data: {
            contactId: data.contact.id,
            contactName: data.contact.name,
            contactEmail: data.contact.email,
            contactStage: data.contact.stage,
        },
        tenantId: data.tenantId,
    };

    return await processTriggerEvent(event);
}

/**
 * Trigger workflow when a tag is added to a contact
 */
export async function triggerTagAdded(data: {
    contactId: string;
    tag: string;
    tenantId: string;
}) {
    const event: TriggerEvent = {
        type: 'TAG_ADDED',
        data: {
            contactId: data.contactId,
            tag: data.tag,
        },
        tenantId: data.tenantId,
    };

    return await processTriggerEvent(event);
}

/**
 * Trigger workflow when pipeline stage changes
 */
export async function triggerPipelineStageChanged(data: {
    opportunityId: string;
    oldStageId: string;
    newStageId: string;
    tenantId: string;
}) {
    const event: TriggerEvent = {
        type: 'PIPELINE_STAGE_CHANGED',
        data: {
            opportunityId: data.opportunityId,
            oldStageId: data.oldStageId,
            newStageId: data.newStageId,
        },
        tenantId: data.tenantId,
    };

    return await processTriggerEvent(event);
}

/**
 * Trigger workflow when a form is submitted
 */
export async function triggerFormSubmitted(data: {
    formId: string;
    formData: any;
    tenantId: string;
}) {
    const event: TriggerEvent = {
        type: 'FORM_SUBMITTED',
        data: {
            formId: data.formId,
            formData: data.formData,
        },
        tenantId: data.tenantId,
    };

    return await processTriggerEvent(event);
}
