'use server';

import { prisma } from './prisma';
import { revalidatePath } from 'next/cache';

// ============= FUNNEL CRUD =============

export async function getFunnels(tenantId: string) {
    try {
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
    } catch (error) {
        console.error('Failed to get funnels:', error);
        throw new Error('Failed to get funnels');
    }
}

export async function getFunnel(funnelId: string) {
    try {
        const funnel = await prisma.funnel.findUnique({
            where: { id: funnelId },
            include: {
                pages: {
                    orderBy: { order: 'asc' },
                },
            },
        });
        return funnel;
    } catch (error) {
        console.error('Failed to get funnel:', error);
        throw new Error('Failed to get funnel');
    }
}

export async function getFunnelBySlug(tenantId: string, slug: string) {
    try {
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
    } catch (error) {
        console.error('Failed to get funnel by slug:', error);
        throw new Error('Failed to get funnel by slug');
    }
}

export async function createFunnel(data: {
    name: string;
    description?: string;
    slug: string;
    tenantId: string;
}) {
    try {
        const funnel = await prisma.funnel.create({
            data: {
                name: data.name,
                description: data.description,
                slug: data.slug,
                tenantId: data.tenantId,
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
    } catch (error) {
        console.error('Failed to create funnel:', error);
        throw new Error('Failed to create funnel');
    }
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
    try {
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
    } catch (error) {
        console.error('Failed to update funnel:', error);
        throw new Error('Failed to update funnel');
    }
}

export async function deleteFunnel(funnelId: string) {
    try {
        await prisma.funnel.delete({
            where: { id: funnelId },
        });

        revalidatePath('/funnels');
        return { success: true };
    } catch (error) {
        console.error('Failed to delete funnel:', error);
        throw new Error('Failed to delete funnel');
    }
}

export async function toggleFunnelStatus(funnelId: string, isActive: boolean) {
    try {
        const funnel = await prisma.funnel.update({
            where: { id: funnelId },
            data: { isActive },
        });

        revalidatePath('/funnels');
        return funnel;
    } catch (error) {
        console.error('Failed to toggle funnel status:', error);
        throw new Error('Failed to toggle funnel status');
    }
}

// ============= FUNNEL PAGES =============

export async function getFunnelPage(pageId: string) {
    try {
        const page = await prisma.funnelPage.findUnique({
            where: { id: pageId },
            include: {
                funnel: true,
            },
        });
        return page;
    } catch (error) {
        console.error('Failed to get funnel page:', error);
        throw new Error('Failed to get funnel page');
    }
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
    try {
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
    } catch (error) {
        console.error('Failed to create funnel page:', error);
        throw new Error('Failed to create funnel page');
    }
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
    try {
        const page = await prisma.funnelPage.update({
            where: { id: pageId },
            data,
        });

        revalidatePath('/funnels');
        return page;
    } catch (error) {
        console.error('Failed to update funnel page:', error);
        throw new Error('Failed to update funnel page');
    }
}

export async function deleteFunnelPage(pageId: string) {
    try {
        await prisma.funnelPage.delete({
            where: { id: pageId },
        });

        revalidatePath('/funnels');
        return { success: true };
    } catch (error) {
        console.error('Failed to delete funnel page:', error);
        throw new Error('Failed to delete funnel page');
    }
}

export async function reorderFunnelPages(funnelId: string, pageIds: string[]) {
    try {
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
    } catch (error) {
        console.error('Failed to reorder funnel pages:', error);
        throw new Error('Failed to reorder funnel pages');
    }
}

// Block types and helper functions are in form-utils.ts
