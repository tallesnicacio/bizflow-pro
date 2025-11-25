'use server';

import { prisma } from './prisma';
import { revalidatePath } from 'next/cache';
import { triggerFormSubmitted } from './workflow-triggers';
import { requireAuth, validateTenantAccess } from './auth-helpers';
import { rateLimiter, RATE_LIMITS } from './rate-limiter';
import { headers } from 'next/headers';
import {
    PaginationParams,
    preparePagination,
    createPaginatedResponse
} from './pagination-utils';

// ============= FORM CRUD =============

export async function getForms(paginationParams?: PaginationParams) {
    const { tenantId } = await requireAuth();

    const { page, limit, skip, take } = preparePagination(paginationParams);

    const where = { tenantId };

    const [forms, total] = await Promise.all([
        prisma.form.findMany({
            where,
            include: {
                fields: {
                    orderBy: { order: 'asc' },
                },
                _count: {
                    select: { submissions: true },
                },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take,
        }),
        prisma.form.count({ where }),
    ]);

    return createPaginatedResponse(forms, total, page, limit);
}

export async function getForm(formId: string) {
    const { tenantId } = await requireAuth();

    const form = await prisma.form.findUnique({
        where: { id: formId },
        include: {
            fields: {
                orderBy: { order: 'asc' },
            },
        },
    });

    if (!form) {
        throw new Error('Form not found');
    }

    validateTenantAccess(form.tenantId, tenantId);

    return form;
}

// PUBLIC: This function is used for public form pages (/f/[slug])
export async function getFormBySlug(tenantId: string, slug: string) {
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
}

export async function createForm(data: {
    name: string;
    description?: string;
    slug: string;
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
    const { tenantId } = await requireAuth();

    const form = await prisma.form.create({
        data: {
            name: data.name,
            description: data.description,
            slug: data.slug,
            tenantId,
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
    const { tenantId } = await requireAuth();

    // Validate form belongs to tenant
    const existingForm = await prisma.form.findUnique({
        where: { id: formId },
        select: { tenantId: true },
    });

    if (!existingForm) {
        throw new Error('Form not found');
    }

    validateTenantAccess(existingForm.tenantId, tenantId);

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
}

export async function deleteForm(formId: string) {
    const { tenantId } = await requireAuth();

    // Validate form belongs to tenant
    const existingForm = await prisma.form.findUnique({
        where: { id: formId },
        select: { tenantId: true },
    });

    if (!existingForm) {
        throw new Error('Form not found');
    }

    validateTenantAccess(existingForm.tenantId, tenantId);

    await prisma.form.delete({
        where: { id: formId },
    });

    revalidatePath('/forms');
    return { success: true };
}

export async function toggleFormStatus(formId: string, isActive: boolean) {
    const { tenantId } = await requireAuth();

    // Validate form belongs to tenant
    const existingForm = await prisma.form.findUnique({
        where: { id: formId },
        select: { tenantId: true },
    });

    if (!existingForm) {
        throw new Error('Form not found');
    }

    validateTenantAccess(existingForm.tenantId, tenantId);

    const form = await prisma.form.update({
        where: { id: formId },
        data: { isActive },
    });

    revalidatePath('/forms');
    return form;
}

// ============= FORM SUBMISSIONS =============

// PUBLIC: This function is called from public form pages (/f/[slug])
// NO AUTH - but validates form exists and creates data in correct tenant
export async function submitForm(formId: string, formData: Record<string, any>) {
    // Rate limiting by IP to prevent spam
    const headersList = headers();
    const forwardedFor = headersList.get('x-forwarded-for');
    const realIp = headersList.get('x-real-ip');
    const clientIP = forwardedFor?.split(',')[0].trim() || realIp || 'unknown';

    const ipIdentifier = `form:ip:${clientIP}`;
    const ipRateLimit = rateLimiter.check(
        ipIdentifier,
        RATE_LIMITS.FORM_SUBMISSION.limit,
        RATE_LIMITS.FORM_SUBMISSION.windowMs
    );

    if (!ipRateLimit.allowed) {
        throw new Error(
            `Muitas submissões. Tente novamente em ${ipRateLimit.retryAfter} segundos.`
        );
    }

    // Get form with fields - validates form exists
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

    // Additional rate limit per form to prevent targeting specific forms
    const formIdentifier = `form:${formId}:ip:${clientIP}`;
    const formRateLimit = rateLimiter.check(
        formIdentifier,
        Math.ceil(RATE_LIMITS.FORM_SUBMISSION.limit / 2), // Half the global limit per form
        RATE_LIMITS.FORM_SUBMISSION.windowMs
    );

    if (!formRateLimit.allowed) {
        throw new Error(
            `Muitas submissões para este formulário. Tente novamente em ${formRateLimit.retryAfter} segundos.`
        );
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
    // IMPORTANT: Uses form.tenantId to ensure data goes to correct tenant
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
}

export async function getFormSubmissions(
    formId: string,
    paginationParams?: PaginationParams
) {
    const { tenantId } = await requireAuth();

    const { page, limit, skip, take } = preparePagination(paginationParams);

    // Validate form belongs to tenant
    const form = await prisma.form.findUnique({
        where: { id: formId },
        select: { tenantId: true },
    });

    if (!form) {
        throw new Error('Form not found');
    }

    validateTenantAccess(form.tenantId, tenantId);

    const where = { formId };

    const [submissions, total] = await Promise.all([
        prisma.formSubmission.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take,
        }),
        prisma.formSubmission.count({ where }),
    ]);

    return createPaginatedResponse(submissions, total, page, limit);
}

export async function deleteFormSubmission(submissionId: string) {
    const { tenantId } = await requireAuth();

    // Validate submission belongs to tenant
    const submission = await prisma.formSubmission.findUnique({
        where: { id: submissionId },
        include: { form: { select: { tenantId: true } } },
    });

    if (!submission) {
        throw new Error('Submission not found');
    }

    validateTenantAccess(submission.form.tenantId, tenantId);

    await prisma.formSubmission.delete({
        where: { id: submissionId },
    });

    revalidatePath('/forms');
    return { success: true };
}

// Helper functions and constants are in form-utils.ts
