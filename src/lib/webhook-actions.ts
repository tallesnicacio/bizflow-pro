'use server';

import { prisma } from './prisma';
import { revalidatePath } from 'next/cache';

export async function getWebhooks(tenantId: string) {
    return prisma.webhook.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' }
    });
}

export async function createWebhook(tenantId: string, data: { url: string; events: string; secret?: string }) {
    try {
        const webhook = await prisma.webhook.create({
            data: {
                tenantId,
                url: data.url,
                events: data.events,
                secret: data.secret,
                isActive: true
            }
        });
        revalidatePath('/settings/webhooks');
        return webhook;
    } catch (error: any) {
        console.error('Failed to create webhook', error);
        throw new Error(error.message);
    }
}

export async function deleteWebhook(id: string) {
    try {
        await prisma.webhook.delete({
            where: { id }
        });
        revalidatePath('/settings/webhooks');
        return { success: true };
    } catch (error: any) {
        console.error('Failed to delete webhook', error);
        throw new Error(error.message);
    }
}

export async function triggerWebhooks(tenantId: string, event: string, payload: any) {
    // Fire and forget - don't await execution to avoid blocking the main thread
    (async () => {
        try {
            const webhooks = await prisma.webhook.findMany({
                where: {
                    tenantId,
                    isActive: true
                }
            });

            const matchingWebhooks = webhooks.filter(wh =>
                wh.events.split(',').map(e => e.trim()).includes(event) || wh.events === '*'
            );

            if (matchingWebhooks.length === 0) return;

            console.log(`[Webhook] Triggering ${matchingWebhooks.length} webhooks for event: ${event}`);

            const promises = matchingWebhooks.map(async (webhook) => {
                try {
                    const response = await fetch(webhook.url, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-BizFlow-Event': event,
                            'X-BizFlow-Signature': webhook.secret || ''
                        },
                        body: JSON.stringify({
                            event,
                            timestamp: new Date().toISOString(),
                            payload
                        })
                    });

                    if (!response.ok) {
                        console.warn(`[Webhook] Failed to send to ${webhook.url}: ${response.status} ${response.statusText}`);
                    }
                } catch (err) {
                    console.error(`[Webhook] Error sending to ${webhook.url}`, err);
                }
            });

            await Promise.all(promises);
        } catch (error) {
            console.error('[Webhook] Trigger engine failed', error);
        }
    })();
}
