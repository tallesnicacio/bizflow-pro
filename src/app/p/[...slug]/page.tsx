'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getFunnelBySlug, getFunnel } from '@/lib/funnel-actions';
import { getForm, submitForm } from '@/lib/form-actions';

const TENANT_ID = 'demo-tenant-1';

interface Block {
    id: string;
    type: string;
    content: any;
}

export default function PublicFunnelPage() {
    const params = useParams();
    const slugParts = params?.slug as string[];

    const [funnel, setFunnel] = useState<any>(null);
    const [page, setPage] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (slugParts?.length > 0) {
            loadPage();
        }
    }, [slugParts]);

    async function loadPage() {
        try {
            const funnelSlug = slugParts[0];
            const pageSlug = slugParts[1] || 'index';

            const funnelData = await getFunnelBySlug(TENANT_ID, funnelSlug);

            if (!funnelData || !funnelData.isActive) {
                setError('Página não encontrada');
                setLoading(false);
                return;
            }

            const pageData = funnelData.pages.find((p: any) => p.slug === pageSlug);

            if (!pageData) {
                setError('Página não encontrada');
                setLoading(false);
                return;
            }

            setFunnel(funnelData);
            setPage(pageData);
        } catch (error) {
            console.error('Failed to load page:', error);
            setError('Erro ao carregar página');
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">Carregando...</div>
            </div>
        );
    }

    if (error || !page) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-2">404</h1>
                    <p className="text-muted-foreground">{error || 'Página não encontrada'}</p>
                </div>
            </div>
        );
    }

    const blocks: Block[] = (page.content as any)?.blocks || [];

    return (
        <div className="min-h-screen bg-background">
            {/* Meta tags would be set via metadata in production */}
            {blocks.map((block) => (
                <PublicBlockRenderer key={block.id} block={block} />
            ))}

            {blocks.length === 0 && (
                <div className="min-h-screen flex items-center justify-center text-muted-foreground">
                    Esta página está vazia
                </div>
            )}

            <footer className="py-4 text-center text-xs text-muted-foreground border-t">
                Powered by BizFlow Pro
            </footer>
        </div>
    );
}

// Public Block Renderer
function PublicBlockRenderer({ block }: { block: Block }) {
    const { type, content } = block;

    switch (type) {
        case 'hero':
            return (
                <section
                    className="py-24 px-8 text-center"
                    style={{
                        backgroundImage: content.backgroundImage ? `url(${content.backgroundImage})` : undefined,
                        backgroundColor: content.backgroundImage ? undefined : 'hsl(var(--primary) / 0.05)',
                    }}
                >
                    <div className="max-w-4xl mx-auto">
                        <h1 className="text-4xl md:text-5xl font-bold mb-6">{content.title}</h1>
                        <p className="text-xl text-muted-foreground mb-8">{content.subtitle}</p>
                        {content.buttonText && (
                            <a
                                href={content.buttonUrl || '#'}
                                className="inline-block px-8 py-4 bg-primary text-primary-foreground rounded-lg font-medium text-lg hover:bg-primary/90 transition-colors"
                            >
                                {content.buttonText}
                            </a>
                        )}
                    </div>
                </section>
            );

        case 'text':
            return (
                <section className="py-12 px-8">
                    <div className={`max-w-3xl mx-auto text-${content.alignment || 'left'}`}>
                        <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: content.content?.replace(/\n/g, '<br />') || '' }} />
                    </div>
                </section>
            );

        case 'image':
            return (
                <section className="py-8 px-8">
                    <div className="max-w-4xl mx-auto">
                        <img
                            src={content.src || '/placeholder.jpg'}
                            alt={content.alt || ''}
                            className="w-full rounded-lg"
                            style={{ maxWidth: content.width || '100%' }}
                        />
                    </div>
                </section>
            );

        case 'video':
            return (
                <section className="py-12 px-8">
                    <div className="max-w-4xl mx-auto aspect-video">
                        {content.url?.includes('youtube') ? (
                            <iframe
                                src={content.url.replace('watch?v=', 'embed/')}
                                className="w-full h-full rounded-lg"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        ) : (
                            <video
                                src={content.url}
                                controls
                                autoPlay={content.autoplay}
                                className="w-full h-full rounded-lg"
                            />
                        )}
                    </div>
                </section>
            );

        case 'features':
            return (
                <section className="py-16 px-8 bg-muted/30">
                    <div className="max-w-5xl mx-auto">
                        <h2 className="text-3xl font-bold text-center mb-12">{content.title}</h2>
                        <div className="grid md:grid-cols-3 gap-8">
                            {(content.items || []).map((item: any, i: number) => (
                                <div key={i} className="text-center p-6 bg-card rounded-lg">
                                    <div className="text-4xl mb-4">{item.icon}</div>
                                    <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                                    <p className="text-muted-foreground">{item.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            );

        case 'testimonials':
            return (
                <section className="py-16 px-8">
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-3xl font-bold text-center mb-12">{content.title}</h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            {(content.items || []).map((item: any, i: number) => (
                                <div key={i} className="p-6 bg-card border border-border rounded-lg">
                                    <p className="text-lg mb-4">"{item.text}"</p>
                                    <p className="font-semibold">- {item.name}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            );

        case 'cta':
            return (
                <section className="py-16 px-8 bg-primary/10">
                    <div className="max-w-3xl mx-auto text-center">
                        <h2 className="text-3xl font-bold mb-4">{content.title}</h2>
                        <p className="text-lg text-muted-foreground mb-8">{content.subtitle}</p>
                        {content.buttonText && (
                            <a
                                href={content.buttonUrl || '#'}
                                className="inline-block px-8 py-4 bg-primary text-primary-foreground rounded-lg font-medium text-lg hover:bg-primary/90 transition-colors"
                            >
                                {content.buttonText}
                            </a>
                        )}
                    </div>
                </section>
            );

        case 'form':
            return <EmbeddedForm formId={content.formId} />;

        case 'divider':
            if (content.style === 'line') {
                return <hr className="border-border my-8" />;
            }
            return <div style={{ height: content.height || 40 }} />;

        case 'countdown':
            return <CountdownBlock content={content} />;

        default:
            return null;
    }
}

// Embedded Form Component
function EmbeddedForm({ formId }: { formId: string }) {
    const [form, setForm] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [formData, setFormData] = useState<Record<string, any>>({});

    useEffect(() => {
        if (formId) {
            loadForm();
        }
    }, [formId]);

    async function loadForm() {
        try {
            const data = await getForm(formId);
            if (data && data.isActive) {
                setForm(data);
                const initialData: Record<string, any> = {};
                data.fields.forEach((field: any) => {
                    initialData[field.id] = field.type === 'CHECKBOX' ? [] : '';
                });
                setFormData(initialData);
            }
        } catch (error) {
            console.error('Failed to load form:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        try {
            await submitForm(form.id, formData);
            setSubmitted(true);
        } catch (error) {
            console.error('Failed to submit:', error);
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) return <div className="py-8 text-center">Carregando formulário...</div>;
    if (!form) return <div className="py-8 text-center text-muted-foreground">Formulário não disponível</div>;
    if (submitted) {
        return (
            <div className="py-12 text-center">
                <div className="text-4xl mb-4">✓</div>
                <p className="text-lg">{form.successMessage}</p>
            </div>
        );
    }

    return (
        <section className="py-12 px-8">
            <div className="max-w-xl mx-auto">
                <form onSubmit={handleSubmit} className="space-y-4">
                    {form.fields.map((field: any) => (
                        <div key={field.id}>
                            <label className="block text-sm font-medium mb-1">
                                {field.label}
                                {field.required && <span className="text-destructive">*</span>}
                            </label>
                            {field.type === 'TEXT' && (
                                <input
                                    type="text"
                                    placeholder={field.placeholder}
                                    value={formData[field.id] || ''}
                                    onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                                    className="w-full px-4 py-2 border border-border rounded-lg"
                                    required={field.required}
                                />
                            )}
                            {field.type === 'EMAIL' && (
                                <input
                                    type="email"
                                    placeholder={field.placeholder}
                                    value={formData[field.id] || ''}
                                    onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                                    className="w-full px-4 py-2 border border-border rounded-lg"
                                    required={field.required}
                                />
                            )}
                            {field.type === 'TEXTAREA' && (
                                <textarea
                                    placeholder={field.placeholder}
                                    value={formData[field.id] || ''}
                                    onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                                    className="w-full px-4 py-2 border border-border rounded-lg"
                                    rows={3}
                                    required={field.required}
                                />
                            )}
                        </div>
                    ))}
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium"
                    >
                        {submitting ? 'Enviando...' : form.submitButtonText}
                    </button>
                </form>
            </div>
        </section>
    );
}

// Countdown Component
function CountdownBlock({ content }: { content: any }) {
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    useEffect(() => {
        const timer = setInterval(() => {
            const target = new Date(content.targetDate).getTime();
            const now = Date.now();
            const diff = Math.max(0, target - now);

            setTimeLeft({
                days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((diff % (1000 * 60)) / 1000),
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [content.targetDate]);

    return (
        <section className="py-12 px-8 bg-destructive/10">
            <div className="max-w-3xl mx-auto text-center">
                <h3 className="text-xl font-semibold mb-6">{content.title}</h3>
                <div className="flex justify-center gap-4">
                    {[
                        { value: timeLeft.days, label: 'Dias' },
                        { value: timeLeft.hours, label: 'Horas' },
                        { value: timeLeft.minutes, label: 'Min' },
                        { value: timeLeft.seconds, label: 'Seg' },
                    ].map((item, i) => (
                        <div key={i} className="bg-card p-4 rounded-lg min-w-[80px]">
                            <div className="text-3xl font-bold">{item.value}</div>
                            <div className="text-sm text-muted-foreground">{item.label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
