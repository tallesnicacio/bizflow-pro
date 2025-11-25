'use server';

import { prisma } from './prisma';
import { revalidatePath } from 'next/cache';
import { requireAuth, validateTenantAccess } from './auth-helpers';

// ============= FUNNEL CRUD =============

export async function getFunnels() {
    const { tenantId } = await requireAuth();

    const funnels = await prisma.funnel.findMany({
        where: { tenantId },
        include: {
            pages: {
                orderBy: { order: 'asc' },
            },
        },
        orderBy: { createdAt: 'desc' },
    });
    return funnels;
}

export async function getFunnel(funnelId: string) {
    const { tenantId } = await requireAuth();

    const funnel = await prisma.funnel.findUnique({
        where: { id: funnelId },
        include: {
            pages: {
                orderBy: { order: 'asc' },
            },
        },
    });

    if (!funnel) {
        throw new Error('Funnel not found');
    }

    validateTenantAccess(funnel.tenantId, tenantId);

    return funnel;
}

// PUBLIC: This function is used for public funnel pages
export async function getFunnelBySlug(tenantId: string, slug: string) {
    const funnel = await prisma.funnel.findUnique({
        where: {
            tenantId_slug: { tenantId, slug },
        },
        include: {
            pages: {
                orderBy: { order: 'asc' },
            },
        },
    });
    return funnel;
}

export async function createFunnel(data: {
    name: string;
    description?: string;
    slug: string;
}) {
    const { tenantId } = await requireAuth();

    const funnel = await prisma.funnel.create({
        data: {
            name: data.name,
            description: data.description,
            slug: data.slug,
            tenantId,
            // Create default landing page
            pages: {
                create: {
                    name: 'Página Principal',
                    slug: 'index',
                    order: 0,
                    content: {
                        blocks: [
                            {
                                id: '1',
                                type: 'hero',
                                content: {
                                    title: 'Bem-vindo ao nosso Funnel',
                                    subtitle: 'Edite esta página para personalizar seu conteúdo',
                                    buttonText: 'Saiba Mais',
                                    buttonUrl: '#',
                                },
                            },
                        ],
                    },
                },
            },
        },
        include: {
            pages: {
                orderBy: { order: 'asc' },
            },
        },
    });

    revalidatePath('/funnels');
    return funnel;
}

export async function updateFunnel(
    funnelId: string,
    data: {
        name?: string;
        description?: string;
        slug?: string;
        isActive?: boolean;
    }
) {
    const { tenantId } = await requireAuth();

    // Validate funnel belongs to tenant
    const existingFunnel = await prisma.funnel.findUnique({
        where: { id: funnelId },
        select: { tenantId: true },
    });

    if (!existingFunnel) {
        throw new Error('Funnel not found');
    }

    validateTenantAccess(existingFunnel.tenantId, tenantId);

    const funnel = await prisma.funnel.update({
        where: { id: funnelId },
        data,
        include: {
            pages: {
                orderBy: { order: 'asc' },
            },
        },
    });

    revalidatePath('/funnels');
    return funnel;
}

export async function deleteFunnel(funnelId: string) {
    const { tenantId } = await requireAuth();

    // Validate funnel belongs to tenant
    const existingFunnel = await prisma.funnel.findUnique({
        where: { id: funnelId },
        select: { tenantId: true },
    });

    if (!existingFunnel) {
        throw new Error('Funnel not found');
    }

    validateTenantAccess(existingFunnel.tenantId, tenantId);

    await prisma.funnel.delete({
        where: { id: funnelId },
    });

    revalidatePath('/funnels');
    return { success: true };
}

export async function toggleFunnelStatus(funnelId: string, isActive: boolean) {
    const { tenantId } = await requireAuth();

    // Validate funnel belongs to tenant
    const existingFunnel = await prisma.funnel.findUnique({
        where: { id: funnelId },
        select: { tenantId: true },
    });

    if (!existingFunnel) {
        throw new Error('Funnel not found');
    }

    validateTenantAccess(existingFunnel.tenantId, tenantId);

    const funnel = await prisma.funnel.update({
        where: { id: funnelId },
        data: { isActive },
    });

    revalidatePath('/funnels');
    return funnel;
}

// ============= FUNNEL PAGES =============

export async function getFunnelPage(pageId: string) {
    const { tenantId } = await requireAuth();

    const page = await prisma.funnelPage.findUnique({
        where: { id: pageId },
        include: {
            funnel: true,
        },
    });

    if (!page) {
        throw new Error('Funnel page not found');
    }

    validateTenantAccess(page.funnel.tenantId, tenantId);

    return page;
}

export async function createFunnelPage(data: {
    funnelId: string;
    name: string;
    slug: string;
    content?: any;
    formId?: string;
    metaTitle?: string;
    metaDescription?: string;
}) {
    const { tenantId } = await requireAuth();

    // Validate funnel belongs to tenant
    const funnel = await prisma.funnel.findUnique({
        where: { id: data.funnelId },
        select: { tenantId: true },
    });

    if (!funnel) {
        throw new Error('Funnel not found');
    }

    validateTenantAccess(funnel.tenantId, tenantId);

    // Get current max order
    const lastPage = await prisma.funnelPage.findFirst({
        where: { funnelId: data.funnelId },
        orderBy: { order: 'desc' },
    });

    const page = await prisma.funnelPage.create({
        data: {
            funnelId: data.funnelId,
            name: data.name,
            slug: data.slug,
            order: (lastPage?.order ?? -1) + 1,
            content: data.content || { blocks: [] },
            formId: data.formId,
            metaTitle: data.metaTitle,
            metaDescription: data.metaDescription,
        },
    });

    revalidatePath('/funnels');
    return page;
}

export async function updateFunnelPage(
    pageId: string,
    data: {
        name?: string;
        slug?: string;
        content?: any;
        formId?: string;
        metaTitle?: string;
        metaDescription?: string;
    }
) {
    const { tenantId } = await requireAuth();

    // Validate page belongs to tenant
    const existingPage = await prisma.funnelPage.findUnique({
        where: { id: pageId },
        include: { funnel: { select: { tenantId: true } } },
    });

    if (!existingPage) {
        throw new Error('Funnel page not found');
    }

    validateTenantAccess(existingPage.funnel.tenantId, tenantId);

    const page = await prisma.funnelPage.update({
        where: { id: pageId },
        data,
    });

    revalidatePath('/funnels');
    return page;
}

export async function deleteFunnelPage(pageId: string) {
    const { tenantId } = await requireAuth();

    // Validate page belongs to tenant
    const existingPage = await prisma.funnelPage.findUnique({
        where: { id: pageId },
        include: { funnel: { select: { tenantId: true } } },
    });

    if (!existingPage) {
        throw new Error('Funnel page not found');
    }

    validateTenantAccess(existingPage.funnel.tenantId, tenantId);

    await prisma.funnelPage.delete({
        where: { id: pageId },
    });

    revalidatePath('/funnels');
    return { success: true };
}

export async function reorderFunnelPages(funnelId: string, pageIds: string[]) {
    const { tenantId } = await requireAuth();

    // Validate funnel belongs to tenant
    const funnel = await prisma.funnel.findUnique({
        where: { id: funnelId },
        select: { tenantId: true },
    });

    if (!funnel) {
        throw new Error('Funnel not found');
    }

    validateTenantAccess(funnel.tenantId, tenantId);

    // Update order for each page
    await Promise.all(
        pageIds.map((pageId, index) =>
            prisma.funnelPage.update({
                where: { id: pageId },
                data: { order: index },
            })
        )
    );

    revalidatePath('/funnels');
    return { success: true };
}

// Block types and helper functions are in form-utils.ts
