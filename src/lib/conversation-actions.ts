'use server';

import { prisma } from './prisma';
import { revalidatePath } from 'next/cache';
import { requireAuth, validateTenantAccess } from './auth-helpers';
import {
    PaginationParams,
    preparePagination,
    createPaginatedResponse
} from './pagination-utils';

export async function getConversations(paginationParams?: PaginationParams) {
    const { tenantId } = await requireAuth();

    const { page, limit, skip, take } = preparePagination(paginationParams);

    const where = { tenantId };

    const [conversations, total] = await Promise.all([
        prisma.conversation.findMany({
            where,
            orderBy: { lastMessageAt: 'desc' },
            include: {
                contact: true,
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
            skip,
            take,
        }),
        prisma.conversation.count({ where }),
    ]);

    return createPaginatedResponse(conversations, total, page, limit);
}

export async function getConversation(conversationId: string) {
    const { tenantId } = await requireAuth();

    const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
            contact: true,
            messages: {
                orderBy: { createdAt: 'asc' },
            },
        },
    });

    if (!conversation) {
        throw new Error('Conversation not found');
    }

    validateTenantAccess(conversation.tenantId, tenantId);

    return conversation;
}

export async function sendMessage(data: {
    conversationId?: string;
    contactId?: string;
    content: string;
    channel: 'EMAIL' | 'SMS' | 'WHATSAPP';
}) {
    const { tenantId } = await requireAuth();

    let conversationId = data.conversationId;

    // Validate conversation belongs to tenant if provided
    if (conversationId) {
        const conv = await prisma.conversation.findUnique({
            where: { id: conversationId },
            select: { tenantId: true },
        });

        if (!conv) {
            throw new Error('Conversation not found');
        }

        validateTenantAccess(conv.tenantId, tenantId);
    }

    // Validate contact belongs to tenant if provided
    if (data.contactId) {
        const contact = await prisma.contact.findUnique({
            where: { id: data.contactId },
            select: { tenantId: true },
        });

        if (!contact) {
            throw new Error('Contact not found');
        }

        validateTenantAccess(contact.tenantId, tenantId);
    }

    // Create conversation if it doesn't exist
    if (!conversationId && data.contactId) {
        const existing = await prisma.conversation.findFirst({
            where: {
                contactId: data.contactId,
                channel: data.channel,
                tenantId,
            },
        });

        if (existing) {
            conversationId = existing.id;
        } else {
            const newConv = await prisma.conversation.create({
                data: {
                    contactId: data.contactId,
                    channel: data.channel,
                    tenantId,
                },
            });
            conversationId = newConv.id;
        }
    }

    if (!conversationId) throw new Error('Conversation ID or Contact ID required');

    const message = await prisma.message.create({
        data: {
            conversationId,
            content: data.content,
            direction: 'OUTBOUND',
            status: 'SENT',
        },
    });

    await prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() },
    });

    revalidatePath('/crm/conversations');
    return message;
}
