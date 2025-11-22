'use server';

import { prisma } from './prisma';
import { revalidatePath } from 'next/cache';

export async function getConversations(tenantId: string) {
    try {
        const conversations = await prisma.conversation.findMany({
            where: { tenantId },
            orderBy: { lastMessageAt: 'desc' },
            include: {
                contact: true,
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
        });
        return conversations;
    } catch (error) {
        console.error('Failed to get conversations:', error);
        throw new Error('Failed to get conversations');
    }
}

export async function getConversation(conversationId: string) {
    try {
        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
            include: {
                contact: true,
                messages: {
                    orderBy: { createdAt: 'asc' },
                },
            },
        });
        return conversation;
    } catch (error) {
        console.error('Failed to get conversation:', error);
        throw new Error('Failed to get conversation');
    }
}

export async function sendMessage(data: {
    conversationId?: string;
    contactId?: string;
    content: string;
    channel: 'EMAIL' | 'SMS' | 'WHATSAPP';
    tenantId: string;
}) {
    try {
        let conversationId = data.conversationId;

        // Create conversation if it doesn't exist
        if (!conversationId && data.contactId) {
            const existing = await prisma.conversation.findFirst({
                where: {
                    contactId: data.contactId,
                    channel: data.channel,
                    tenantId: data.tenantId,
                },
            });

            if (existing) {
                conversationId = existing.id;
            } else {
                const newConv = await prisma.conversation.create({
                    data: {
                        contactId: data.contactId,
                        channel: data.channel,
                        tenantId: data.tenantId,
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
    } catch (error) {
        console.error('Failed to send message:', error);
        throw new Error('Failed to send message');
    }
}
