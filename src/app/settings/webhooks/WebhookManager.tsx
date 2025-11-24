'use client';

import { useState, useEffect } from 'react';
import { getWebhooks, createWebhook, deleteWebhook } from '@/lib/webhook-actions';
import { Modal } from '@/components/Modal';
import { Plus, Trash2, Globe, Activity, Loader2 } from 'lucide-react';

interface WebhookManagerProps {
    tenantId: string;
}

export function WebhookManager({ tenantId }: WebhookManagerProps) {
    const [webhooks, setWebhooks] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [url, setUrl] = useState('');
    const [events, setEvents] = useState('');
    const [secret, setSecret] = useState('');

    useEffect(() => {
        if (tenantId) {
            loadWebhooks();
        }
    }, [tenantId]);

    async function loadWebhooks() {
        setIsLoading(true);
        try {
            const data = await getWebhooks(tenantId);
            setWebhooks(data);
        } catch (error) {
            console.error('Failed to load webhooks', error);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await createWebhook(tenantId, { url, events, secret });
            await loadWebhooks();
            setIsModalOpen(false);
            setUrl('');
            setEvents('');
            setSecret('');
        } catch (error) {
            console.error('Failed to create webhook', error);
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Are you sure you want to delete this webhook?')) return;
        try {
            await deleteWebhook(id);
            await loadWebhooks();
        } catch (error) {
            console.error('Failed to delete webhook', error);
        }
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Webhooks</h1>
                    <p className="text-muted-foreground">Manage external integrations and event notifications.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                >
                    <Plus size={18} />
                    Add Webhook
                </button>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="animate-spin text-muted-foreground" size={32} />
                </div>
            ) : webhooks.length === 0 ? (
                <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed border-border">
                    <Globe className="mx-auto text-muted-foreground mb-3" size={48} />
                    <h3 className="text-lg font-medium">No Webhooks Configured</h3>
                    <p className="text-muted-foreground mb-4">Create a webhook to receive real-time updates.</p>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="text-primary hover:underline font-medium"
                    >
                        Create your first webhook
                    </button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {webhooks.map((webhook) => (
                        <div key={webhook.id} className="bg-card border border-border rounded-lg p-4 flex items-center justify-between shadow-sm">
                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-primary/10 rounded-lg text-primary mt-1">
                                    <Activity size={20} />
                                </div>
                                <div>
                                    <h3 className="font-medium break-all">{webhook.url}</h3>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {webhook.events.split(',').map((event: string) => (
                                            <span key={event} className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-full border border-border">
                                                {event.trim()}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDelete(webhook.id)}
                                className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete Webhook"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Webhook">
                <form onSubmit={handleCreate} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1.5">Payload URL</label>
                        <input
                            type="url"
                            required
                            placeholder="https://api.example.com/webhook"
                            className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            value={url}
                            onChange={e => setUrl(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1.5">Events</label>
                        <input
                            type="text"
                            required
                            placeholder="opportunity.created, opportunity.stage_changed"
                            className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            value={events}
                            onChange={e => setEvents(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground mt-1">Comma-separated list of events to subscribe to.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1.5">Secret (Optional)</label>
                        <input
                            type="text"
                            placeholder="Signing Secret"
                            className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            value={secret}
                            onChange={e => setSecret(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground mt-1">Used to verify the authenticity of the payload.</p>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all text-sm disabled:opacity-50 flex items-center gap-2"
                        >
                            {isSubmitting && <Loader2 className="animate-spin" size={14} />}
                            Create Webhook
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
