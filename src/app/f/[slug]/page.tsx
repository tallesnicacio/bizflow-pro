'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getFormBySlug, submitForm } from '@/lib/form-actions';

const TENANT_ID = 'demo-tenant-1';

export default function PublicFormPage() {
    const params = useParams();
    const slug = params?.slug as string;

    const [form, setForm] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState<Record<string, any>>({});

    useEffect(() => {
        if (slug) {
            loadForm();
        }
    }, [slug]);

    async function loadForm() {
        try {
            const data = await getFormBySlug(TENANT_ID, slug);
            if (data) {
                setForm(data);
                // Initialize form data
                const initialData: Record<string, any> = {};
                data.fields.forEach((field: any) => {
                    initialData[field.id] = field.type === 'CHECKBOX' ? [] : '';
                });
                setFormData(initialData);
            }
        } catch (error) {
            console.error('Failed to load form:', error);
            setError('Formulário não encontrado');
        } finally {
            setLoading(false);
        }
    }

    function handleFieldChange(fieldId: string, value: any, type: string) {
        if (type === 'CHECKBOX') {
            // Handle checkbox arrays
            const currentValues = formData[fieldId] || [];
            if (currentValues.includes(value)) {
                setFormData({
                    ...formData,
                    [fieldId]: currentValues.filter((v: string) => v !== value),
                });
            } else {
                setFormData({
                    ...formData,
                    [fieldId]: [...currentValues, value],
                });
            }
        } else {
            setFormData({
                ...formData,
                [fieldId]: value,
            });
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        // Validate required fields
        for (const field of form.fields) {
            if (field.required) {
                const value = formData[field.id];
                if (!value || (Array.isArray(value) && value.length === 0)) {
                    setError(`O campo "${field.label}" é obrigatório`);
                    return;
                }
            }
        }

        setSubmitting(true);
        try {
            const result = await submitForm(form.id, formData);

            if (result.redirectUrl) {
                window.location.href = result.redirectUrl;
            } else {
                setSubmitted(true);
            }
        } catch (error: any) {
            console.error('Failed to submit form:', error);
            setError(error.message || 'Erro ao enviar formulário');
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">Carregando...</div>
            </div>
        );
    }

    if (!form || !form.isActive) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-2">Formulário não encontrado</h1>
                    <p className="text-muted-foreground">Este formulário não existe ou está inativo.</p>
                </div>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="max-w-md mx-auto text-center p-8">
                    <div className="text-6xl mb-4">✓</div>
                    <h1 className="text-2xl font-bold mb-4">Enviado com sucesso!</h1>
                    <p className="text-muted-foreground">{form.successMessage}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background py-12 px-4">
            <div className="max-w-xl mx-auto">
                <div className="bg-card border border-border rounded-lg p-8 shadow-lg">
                    <h1 className="text-2xl font-bold mb-6">{form.name}</h1>

                    {error && (
                        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {form.fields.map((field: any) => (
                            <div key={field.id}>
                                <label className="block text-sm font-medium mb-2">
                                    {field.label}
                                    {field.required && <span className="text-destructive ml-1">*</span>}
                                </label>

                                {field.type === 'TEXT' && (
                                    <input
                                        type="text"
                                        placeholder={field.placeholder}
                                        value={formData[field.id] || ''}
                                        onChange={(e) => handleFieldChange(field.id, e.target.value, field.type)}
                                        className="w-full px-4 py-3 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-primary"
                                    />
                                )}

                                {field.type === 'EMAIL' && (
                                    <input
                                        type="email"
                                        placeholder={field.placeholder}
                                        value={formData[field.id] || ''}
                                        onChange={(e) => handleFieldChange(field.id, e.target.value, field.type)}
                                        className="w-full px-4 py-3 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-primary"
                                    />
                                )}

                                {field.type === 'PHONE' && (
                                    <input
                                        type="tel"
                                        placeholder={field.placeholder}
                                        value={formData[field.id] || ''}
                                        onChange={(e) => handleFieldChange(field.id, e.target.value, field.type)}
                                        className="w-full px-4 py-3 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-primary"
                                    />
                                )}

                                {field.type === 'TEXTAREA' && (
                                    <textarea
                                        placeholder={field.placeholder}
                                        value={formData[field.id] || ''}
                                        onChange={(e) => handleFieldChange(field.id, e.target.value, field.type)}
                                        rows={4}
                                        className="w-full px-4 py-3 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-primary"
                                    />
                                )}

                                {field.type === 'NUMBER' && (
                                    <input
                                        type="number"
                                        placeholder={field.placeholder}
                                        value={formData[field.id] || ''}
                                        onChange={(e) => handleFieldChange(field.id, e.target.value, field.type)}
                                        className="w-full px-4 py-3 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-primary"
                                    />
                                )}

                                {field.type === 'DATE' && (
                                    <input
                                        type="date"
                                        value={formData[field.id] || ''}
                                        onChange={(e) => handleFieldChange(field.id, e.target.value, field.type)}
                                        className="w-full px-4 py-3 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-primary"
                                    />
                                )}

                                {field.type === 'SELECT' && (
                                    <select
                                        value={formData[field.id] || ''}
                                        onChange={(e) => handleFieldChange(field.id, e.target.value, field.type)}
                                        className="w-full px-4 py-3 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-primary"
                                    >
                                        <option value="">Selecione...</option>
                                        {(field.options || []).map((opt: string, i: number) => (
                                            <option key={i} value={opt}>
                                                {opt}
                                            </option>
                                        ))}
                                    </select>
                                )}

                                {field.type === 'RADIO' && (
                                    <div className="space-y-2">
                                        {(field.options || []).map((opt: string, i: number) => (
                                            <label key={i} className="flex items-center gap-3 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name={field.id}
                                                    value={opt}
                                                    checked={formData[field.id] === opt}
                                                    onChange={(e) => handleFieldChange(field.id, e.target.value, field.type)}
                                                    className="w-4 h-4"
                                                />
                                                {opt}
                                            </label>
                                        ))}
                                    </div>
                                )}

                                {field.type === 'CHECKBOX' && (
                                    <div className="space-y-2">
                                        {(field.options || []).map((opt: string, i: number) => (
                                            <label key={i} className="flex items-center gap-3 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    value={opt}
                                                    checked={(formData[field.id] || []).includes(opt)}
                                                    onChange={() => handleFieldChange(field.id, opt, field.type)}
                                                    className="w-4 h-4 rounded"
                                                />
                                                {opt}
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {submitting ? 'Enviando...' : form.submitButtonText}
                        </button>
                    </form>
                </div>

                <p className="text-center text-xs text-muted-foreground mt-4">
                    Powered by BizFlow Pro
                </p>
            </div>
        </div>
    );
}
