'use server';

import { prisma } from './prisma';
import { revalidatePath } from 'next/cache';
import { triggerFormSubmitted } from './workflow-triggers';

// ============= FORM CRUD =============

export async function getForms(tenantId: string) {
    try {
        const forms = await prisma.form.findMany({
            where: { tenantId },
            include: {
                fields: {
                    orderBy: { order: 'asc' },
                },
                _count: {
                    select: { submissions: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        return forms;
    } catch (error) {
        console.error('Failed to get forms:', error);
        throw new Error('Failed to get forms');
    }
}

export async function getForm(formId: string) {
    try {
        const form = await prisma.form.findUnique({
            where: { id: formId },
            include: {
                fields: {
                    orderBy: { order: 'asc' },
                },
            },
        });
        return form;
    } catch (error) {
        console.error('Failed to get form:', error);
        throw new Error('Failed to get form');
    }
}

export async function getFormBySlug(tenantId: string, slug: string) {
    try {
        const form = await prisma.form.findUnique({
            where: {
                tenantId_slug: { tenantId, slug },
            },
            include: {
                fields: {
                    orderBy: { order: 'asc' },
                },
            },
        });
        return form;
    } catch (error) {
        console.error('Failed to get form by slug:', error);
        throw new Error('Failed to get form by slug');
    }
}

export async function createForm(data: {
    name: string;
    description?: string;
    slug: string;
    tenantId: string;
    submitButtonText?: string;
    successMessage?: string;
    redirectUrl?: string;
    fields?: Array<{
        label: string;
        type: string;
        placeholder?: string;
        required?: boolean;
        options?: any;
        order: number;
        mapToContact?: string;
    }>;
}) {
    try {
        const form = await prisma.form.create({
            data: {
                name: data.name,
                description: data.description,
                slug: data.slug,
                tenantId: data.tenantId,
                submitButtonText: data.submitButtonText || 'Enviar',
                successMessage: data.successMessage || 'Obrigado pelo envio!',
                redirectUrl: data.redirectUrl,
                fields: data.fields
                    ? {
                          create: data.fields.map((field) => ({
                              label: field.label,
                              type: field.type,
                              placeholder: field.placeholder,
                              required: field.required || false,
                              options: field.options,
                              order: field.order,
                              mapToContact: field.mapToContact,
                          })),
                      }
                    : undefined,
            },
            include: {
                fields: {
                    orderBy: { order: 'asc' },
                },
            },
        });

        revalidatePath('/forms');
        return form;
    } catch (error) {
        console.error('Failed to create form:', error);
        throw new Error('Failed to create form');
    }
}

export async function updateForm(
    formId: string,
    data: {
        name?: string;
        description?: string;
        slug?: string;
        isActive?: boolean;
        submitButtonText?: string;
        successMessage?: string;
        redirectUrl?: string;
        fields?: Array<{
            id?: string;
            label: string;
            type: string;
            placeholder?: string;
            required?: boolean;
            options?: any;
            order: number;
            mapToContact?: string;
        }>;
    }
) {
    try {
        // Update basic form info
        const updateData: any = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.slug !== undefined) updateData.slug = data.slug;
        if (data.isActive !== undefined) updateData.isActive = data.isActive;
        if (data.submitButtonText !== undefined) updateData.submitButtonText = data.submitButtonText;
        if (data.successMessage !== undefined) updateData.successMessage = data.successMessage;
        if (data.redirectUrl !== undefined) updateData.redirectUrl = data.redirectUrl;

        // If fields are being updated, delete old and create new
        if (data.fields) {
            await prisma.formField.deleteMany({
                where: { formId },
            });
            updateData.fields = {
                create: data.fields.map((field) => ({
                    label: field.label,
                    type: field.type,
                    placeholder: field.placeholder,
                    required: field.required || false,
                    options: field.options,
                    order: field.order,
                    mapToContact: field.mapToContact,
                })),
            };
        }

        const form = await prisma.form.update({
            where: { id: formId },
            data: updateData,
            include: {
                fields: {
                    orderBy: { order: 'asc' },
                },
            },
        });

        revalidatePath('/forms');
        return form;
    } catch (error) {
        console.error('Failed to update form:', error);
        throw new Error('Failed to update form');
    }
}

export async function deleteForm(formId: string) {
    try {
        await prisma.form.delete({
            where: { id: formId },
        });

        revalidatePath('/forms');
        return { success: true };
    } catch (error) {
        console.error('Failed to delete form:', error);
        throw new Error('Failed to delete form');
    }
}

export async function toggleFormStatus(formId: string, isActive: boolean) {
    try {
        const form = await prisma.form.update({
            where: { id: formId },
            data: { isActive },
        });

        revalidatePath('/forms');
        return form;
    } catch (error) {
        console.error('Failed to toggle form status:', error);
        throw new Error('Failed to toggle form status');
    }
}

// ============= FORM SUBMISSIONS =============

export async function submitForm(formId: string, formData: Record<string, any>) {
    try {
        // Get form with fields
        const form = await prisma.form.findUnique({
            where: { id: formId },
            include: {
                fields: true,
            },
        });

        if (!form) {
            throw new Error('Form not found');
        }

        if (!form.isActive) {
            throw new Error('Form is not active');
        }

        // Extract contact mapping fields
        const contactData: any = {};
        for (const field of form.fields) {
            if (field.mapToContact && formData[field.id]) {
                contactData[field.mapToContact] = formData[field.id];
            }
        }

        let contactId: string | undefined;

        // Create or update contact if we have email
        if (contactData.email) {
            const existingContact = await prisma.contact.findFirst({
                where: {
                    tenantId: form.tenantId,
                    email: contactData.email,
                },
            });

            if (existingContact) {
                // Update existing contact
                const updated = await prisma.contact.update({
                    where: { id: existingContact.id },
                    data: {
                        name: contactData.name || existingContact.name,
                        phone: contactData.phone || existingContact.phone,
                    },
                });
                contactId = updated.id;
            } else {
                // Create new contact
                const created = await prisma.contact.create({
                    data: {
                        tenantId: form.tenantId,
                        name: contactData.name || 'Unknown',
                        email: contactData.email,
                        phone: contactData.phone,
                        stage: 'LEAD',
                    },
                });
                contactId = created.id;
            }
        }

        // Save submission
        const submission = await prisma.formSubmission.create({
            data: {
                formId,
                data: formData,
                contactId,
            },
        });

        // Trigger workflow
        await triggerFormSubmitted({
            formId: form.id,
            formData: formData,
            tenantId: form.tenantId,
        });

        return {
            success: true,
            submissionId: submission.id,
            contactId,
            successMessage: form.successMessage,
            redirectUrl: form.redirectUrl,
        };
    } catch (error) {
        console.error('Failed to submit form:', error);
        throw new Error('Failed to submit form');
    }
}

export async function getFormSubmissions(formId: string) {
    try {
        const submissions = await prisma.formSubmission.findMany({
            where: { formId },
            orderBy: { createdAt: 'desc' },
        });
        return submissions;
    } catch (error) {
        console.error('Failed to get form submissions:', error);
        throw new Error('Failed to get form submissions');
    }
}

export async function deleteFormSubmission(submissionId: string) {
    try {
        await prisma.formSubmission.delete({
            where: { id: submissionId },
        });

        revalidatePath('/forms');
        return { success: true };
    } catch (error) {
        console.error('Failed to delete submission:', error);
        throw new Error('Failed to delete submission');
    }
}

// Helper functions and constants are in form-utils.ts
