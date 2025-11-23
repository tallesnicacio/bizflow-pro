'use server';

import { prisma } from './prisma';
import { revalidatePath } from 'next/cache';
import { createOpportunity } from './pipeline-actions';
import { saveFieldValue } from './field-actions';

// --- Pipeline Public Form Actions ---

export async function togglePublicForm(pipelineId: string, enabled: boolean) {
    try {
        let slug = undefined;
        if (enabled) {
            // Generate simple slug from ID if not exists
            const pipeline = await prisma.pipeline.findUnique({ where: { id: pipelineId } });
            if (!pipeline?.publicFormSlug) {
                slug = `${pipeline?.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${pipelineId.slice(-4)}`;
            }
        }

        await prisma.pipeline.update({
            where: { id: pipelineId },
            data: {
                publicFormEnabled: enabled,
                ...(slug && { publicFormSlug: slug })
            }
        });

        revalidatePath('/crm/pipelines/settings');
        return { success: true, slug };
    } catch (error: any) {
        console.error('Error toggling public form:', error);
        return { success: false, error: error.message };
    }
}

export async function updateFieldFormSettings(fieldId: string, data: { showInForm: boolean; formLabel?: string }) {
    try {
        await prisma.stageField.update({
            where: { id: fieldId },
            data
        });
        revalidatePath('/crm/pipelines/settings');
        return { success: true };
    } catch (error: any) {
        console.error('Error updating field form settings:', error);
        return { success: false, error: error.message };
    }
}

export async function getPublicForm(slug: string) {
    try {
        const pipeline = await prisma.pipeline.findUnique({
            where: { publicFormSlug: slug, publicFormEnabled: true },
            include: {
                stages: {
                    orderBy: { order: 'asc' },
                    take: 1, // Only get the first stage
                    include: {
                        fields: {
                            where: { showInForm: true },
                            orderBy: { order: 'asc' }
                        }
                    }
                }
            }
        });

        if (!pipeline || pipeline.stages.length === 0) return null;

        return {
            pipelineName: pipeline.name,
            pipelineId: pipeline.id,
            tenantId: pipeline.tenantId,
            stage: pipeline.stages[0]
        };
    } catch (error) {
        console.error('Error fetching public form:', error);
        return null;
    }
}

export async function submitPublicForm(slug: string, formData: any) {
    try {
        const form = await getPublicForm(slug);
        if (!form) throw new Error('Form not found');

        // 1. Create Opportunity
        const oppResult = await createOpportunity({
            title: formData.title || 'New Lead from Form',
            value: 0, // Default
            contactId: 'public-lead', // Placeholder, ideally create/find contact
            stageId: form.stage.id,
            tenantId: form.tenantId
        });

        if (!oppResult.success || !oppResult.opportunity) {
            throw new Error(oppResult.error || 'Failed to create opportunity');
        }

        // 2. Save Custom Fields
        const fieldPromises = Object.entries(formData).map(([key, value]) => {
            if (key === 'title') return Promise.resolve(); // Handled above
            return saveFieldValue(oppResult.opportunity!.id, key, String(value));
        });

        await Promise.all(fieldPromises);

        return { success: true };
    } catch (error: any) {
        console.error('Error submitting form:', error);
        return { success: false, error: error.message };
    }
}

// --- Legacy / Standalone Form Actions (for Funnels & Forms) ---

export async function getForm(formId: string) {
    try {
        const form = await prisma.form.findUnique({
            where: { id: formId },
            include: {
                fields: {
                    orderBy: { order: 'asc' }
                }
            }
        });
        return form;
    } catch (error) {
        console.error('Error fetching form:', error);
        return null;
    }
}

export async function getFormBySlug(tenantId: string, slug: string) {
    try {
        const form = await prisma.form.findUnique({
            where: {
                tenantId_slug: {
                    tenantId,
                    slug
                }
            },
            include: {
                fields: {
                    orderBy: { order: 'asc' }
                }
            }
        });
        return form;
    } catch (error) {
        console.error('Error fetching form by slug:', error);
        return null;
    }
}

export async function submitForm(formId: string, data: any) {
    try {
        const form = await prisma.form.findUnique({ where: { id: formId } });
        if (!form) throw new Error('Form not found');

        await prisma.formSubmission.create({
            data: {
                formId,
                data: data,
                // contactId: ... (logic to find/create contact would go here)
            }
        });

        return { success: true, redirectUrl: form.redirectUrl };
    } catch (error: any) {
        console.error('Error submitting form:', error);
        throw new Error(error.message);
    }
}

export async function createForm(data: any) {
    try {
        const form = await prisma.form.create({
            data: {
                name: data.name,
                slug: data.slug,
                description: data.description,
                tenantId: data.tenantId,
                submitButtonText: data.submitButtonText,
                successMessage: data.successMessage,
                redirectUrl: data.redirectUrl,
                fields: {
                    create: data.fields.map((f: any) => ({
                        label: f.label,
                        type: f.type,
                        placeholder: f.placeholder,
                        required: f.required,
                        options: f.options,
                        order: f.order,
                        mapToContact: f.mapToContact
                    }))
                }
            }
        });
        revalidatePath('/forms');
        return form;
    } catch (error: any) {
        console.error('Error creating form:', error);
        throw new Error(error.message);
    }
}

export async function updateForm(formId: string, data: any) {
    try {
        // Update form details
        const form = await prisma.form.update({
            where: { id: formId },
            data: {
                name: data.name,
                slug: data.slug,
                description: data.description,
                submitButtonText: data.submitButtonText,
                successMessage: data.successMessage,
                redirectUrl: data.redirectUrl,
            }
        });

        // Delete existing fields and recreate them (simplest approach for now)
        await prisma.formField.deleteMany({ where: { formId } });

        await prisma.formField.createMany({
            data: data.fields.map((f: any) => ({
                formId,
                label: f.label,
                type: f.type,
                placeholder: f.placeholder,
                required: f.required,
                options: f.options,
                order: f.order,
                mapToContact: f.mapToContact
            }))
        });

        revalidatePath('/forms');
        revalidatePath(`/forms/${formId}`);
        return form;
    } catch (error: any) {
        console.error('Error updating form:', error);
        throw new Error(error.message);
    }
}

export async function getForms(tenantId: string) {
    try {
        const forms = await prisma.form.findMany({
            where: { tenantId },
            include: {
                _count: {
                    select: { submissions: true }
                },
                fields: true
            },
            orderBy: { createdAt: 'desc' }
        });
        return forms;
    } catch (error: any) {
        console.error('Error fetching forms:', error);
        return [];
    }
}

export async function deleteForm(formId: string) {
    try {
        await prisma.form.delete({ where: { id: formId } });
        revalidatePath('/forms');
        return { success: true };
    } catch (error: any) {
        console.error('Error deleting form:', error);
        throw new Error(error.message);
    }
}

export async function toggleFormStatus(formId: string, isActive: boolean) {
    try {
        await prisma.form.update({
            where: { id: formId },
            data: { isActive }
        });
        revalidatePath('/forms');
        return { success: true };
    } catch (error: any) {
        console.error('Error toggling form status:', error);
        throw new Error(error.message);
    }
}

export async function getFormSubmissions(formId: string) {
    try {
        const submissions = await prisma.formSubmission.findMany({
            where: { formId },
            orderBy: { createdAt: 'desc' }
        });
        return submissions;
    } catch (error: any) {
        console.error('Error fetching submissions:', error);
        return [];
    }
}

export async function deleteFormSubmission(submissionId: string) {
    try {
        await prisma.formSubmission.delete({ where: { id: submissionId } });
        return { success: true };
    } catch (error: any) {
        console.error('Error deleting submission:', error);
        throw new Error(error.message);
    }
}
