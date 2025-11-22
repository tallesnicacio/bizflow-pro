'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { getForm, createForm, updateForm } from '@/lib/form-actions';
import { FIELD_TYPES, CONTACT_MAPPINGS, generateSlug } from '@/lib/form-utils';

const TENANT_ID = 'demo-tenant-1';

interface FormField {
    id?: string;
    label: string;
    type: string;
    placeholder?: string;
    required: boolean;
    options?: string[];
    order: number;
    mapToContact?: string;
}

export default function FormBuilderPage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const formId = params?.formId as string;
    const isNew = formId === 'new';

    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);

    // Form settings
    const [name, setName] = useState(searchParams?.get('name') || '');
    const [slug, setSlug] = useState(searchParams?.get('slug') || '');
    const [description, setDescription] = useState('');
    const [submitButtonText, setSubmitButtonText] = useState('Enviar');
    const [successMessage, setSuccessMessage] = useState('Obrigado pelo envio!');
    const [redirectUrl, setRedirectUrl] = useState('');

    // Form fields
    const [fields, setFields] = useState<FormField[]>([]);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<'fields' | 'settings' | 'preview'>('fields');

    useEffect(() => {
        if (!isNew && formId) {
            loadForm();
        }
    }, [formId, isNew]);

    async function loadForm() {
        try {
            const form = await getForm(formId);
            if (form) {
                setName(form.name);
                setSlug(form.slug);
                setDescription(form.description || '');
                setSubmitButtonText(form.submitButtonText);
                setSuccessMessage(form.successMessage);
                setRedirectUrl(form.redirectUrl || '');
                setFields(
                    form.fields.map((f: any) => ({
                        id: f.id,
                        label: f.label,
                        type: f.type,
                        placeholder: f.placeholder || '',
                        required: f.required,
                        options: f.options || [],
                        order: f.order,
                        mapToContact: f.mapToContact || '',
                    }))
                );
            }
        } catch (error) {
            console.error('Failed to load form:', error);
        } finally {
            setLoading(false);
        }
    }

    function addField(type: string = 'TEXT') {
        const typeInfo = FIELD_TYPES.find((t) => t.value === type);
        setFields([
            ...fields,
            {
                label: `Novo Campo ${typeInfo?.label || ''}`,
                type,
                placeholder: '',
                required: false,
                options: type === 'SELECT' || type === 'RADIO' ? ['Opção 1', 'Opção 2'] : undefined,
                order: fields.length,
                mapToContact: '',
            },
        ]);
    }

    function removeField(index: number) {
        setFields(fields.filter((_, i) => i !== index));
    }

    function updateField(index: number, updates: Partial<FormField>) {
        const updated = [...fields];
        updated[index] = { ...updated[index], ...updates };
        setFields(updated);
    }

    // Drag and drop handlers
    function handleDragStart(index: number) {
        setDraggedIndex(index);
    }

    function handleDragOver(e: React.DragEvent, index: number) {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;

        const newFields = [...fields];
        const draggedField = newFields[draggedIndex];
        newFields.splice(draggedIndex, 1);
        newFields.splice(index, 0, draggedField);
        setFields(newFields);
        setDraggedIndex(index);
    }

    function handleDragEnd() {
        setDraggedIndex(null);
    }

    async function handleSave() {
        if (!name.trim()) {
            alert('Nome do formulário é obrigatório');
            return;
        }
        if (!slug.trim()) {
            alert('Slug é obrigatório');
            return;
        }
        if (fields.length === 0) {
            alert('Adicione pelo menos um campo ao formulário');
            return;
        }

        setSaving(true);
        try {
            const data = {
                name,
                description,
                slug,
                tenantId: TENANT_ID,
                submitButtonText,
                successMessage,
                redirectUrl: redirectUrl || undefined,
                fields: fields.map((field, index) => ({
                    label: field.label,
                    type: field.type,
                    placeholder: field.placeholder,
                    required: field.required,
                    options: field.options,
                    order: index,
                    mapToContact: field.mapToContact || undefined,
                })),
            };

            if (isNew) {
                await createForm(data);
            } else {
                await updateForm(formId, data);
            }

            router.push('/forms');
        } catch (error) {
            console.error('Failed to save form:', error);
            alert('Erro ao salvar formulário');
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="p-8">
                <div className="text-center">Carregando formulário...</div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">{isNew ? 'Novo Formulário' : 'Editar Formulário'}</h1>
                    <p className="text-muted-foreground mt-2">
                        Arraste os campos para reordenar
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => router.push('/forms')}
                        className="px-4 py-2 border border-border rounded-lg hover:bg-muted font-medium"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium"
                    >
                        {saving ? 'Salvando...' : 'Salvar Formulário'}
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="mb-6 flex gap-2 border-b border-border">
                <button
                    onClick={() => setActiveTab('fields')}
                    className={`px-4 py-2 font-medium border-b-2 -mb-px ${activeTab === 'fields'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                >
                    Campos
                </button>
                <button
                    onClick={() => setActiveTab('settings')}
                    className={`px-4 py-2 font-medium border-b-2 -mb-px ${activeTab === 'settings'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                >
                    Configurações
                </button>
                <button
                    onClick={() => setActiveTab('preview')}
                    className={`px-4 py-2 font-medium border-b-2 -mb-px ${activeTab === 'preview'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                >
                    Preview
                </button>
            </div>

            <div className="grid grid-cols-12 gap-6">
                {/* Fields Tab */}
                {activeTab === 'fields' && (
                    <>
                        {/* Field Types Sidebar */}
                        <div className="col-span-3">
                            <div className="bg-card border border-border rounded-lg p-4 sticky top-4">
                                <h3 className="font-semibold mb-4">Adicionar Campo</h3>
                                <div className="space-y-2">
                                    {FIELD_TYPES.map((type) => (
                                        <button
                                            key={type.value}
                                            onClick={() => addField(type.value)}
                                            className="w-full px-3 py-2 text-left text-sm bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                                        >
                                            {type.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Form Builder */}
                        <div className="col-span-9">
                            <div className="bg-card border border-border rounded-lg p-6">
                                <div className="space-y-4 mb-6">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Nome do Formulário *</label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Slug (URL) *</label>
                                        <div className="flex items-center gap-2">
                                            <span className="text-muted-foreground">/f/</span>
                                            <input
                                                type="text"
                                                value={slug}
                                                onChange={(e) => setSlug(e.target.value)}
                                                className="flex-1 px-3 py-2 border border-border rounded-lg bg-background"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <h3 className="font-semibold mb-4">Campos do Formulário</h3>

                                {fields.length === 0 ? (
                                    <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
                                        <p className="text-muted-foreground mb-2">Nenhum campo adicionado</p>
                                        <p className="text-sm text-muted-foreground">
                                            Clique nos tipos de campo à esquerda para adicionar
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {fields.map((field, index) => (
                                            <div
                                                key={index}
                                                draggable
                                                onDragStart={() => handleDragStart(index)}
                                                onDragOver={(e) => handleDragOver(e, index)}
                                                onDragEnd={handleDragEnd}
                                                className={`border border-border rounded-lg p-4 bg-background cursor-move transition-all ${draggedIndex === index ? 'opacity-50 scale-[0.98]' : ''
                                                    }`}
                                            >
                                                <div className="flex items-start gap-4">
                                                    <div className="flex-shrink-0 text-muted-foreground cursor-grab">
                                                        ⋮⋮
                                                    </div>
                                                    <div className="flex-1 grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-xs font-medium mb-1">Label</label>
                                                            <input
                                                                type="text"
                                                                value={field.label}
                                                                onChange={(e) => updateField(index, { label: e.target.value })}
                                                                className="w-full px-2 py-1 text-sm border border-border rounded bg-background"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium mb-1">Tipo</label>
                                                            <select
                                                                value={field.type}
                                                                onChange={(e) => updateField(index, { type: e.target.value })}
                                                                className="w-full px-2 py-1 text-sm border border-border rounded bg-background"
                                                            >
                                                                {FIELD_TYPES.map((t) => (
                                                                    <option key={t.value} value={t.value}>
                                                                        {t.label}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium mb-1">Placeholder</label>
                                                            <input
                                                                type="text"
                                                                value={field.placeholder || ''}
                                                                onChange={(e) => updateField(index, { placeholder: e.target.value })}
                                                                className="w-full px-2 py-1 text-sm border border-border rounded bg-background"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium mb-1">Mapear para Contato</label>
                                                            <select
                                                                value={field.mapToContact || ''}
                                                                onChange={(e) => updateField(index, { mapToContact: e.target.value })}
                                                                className="w-full px-2 py-1 text-sm border border-border rounded bg-background"
                                                            >
                                                                {CONTACT_MAPPINGS.map((m) => (
                                                                    <option key={m.value} value={m.value}>
                                                                        {m.label}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        {(field.type === 'SELECT' || field.type === 'RADIO' || field.type === 'CHECKBOX') && (
                                                            <div className="col-span-2">
                                                                <label className="block text-xs font-medium mb-1">Opções (uma por linha)</label>
                                                                <textarea
                                                                    value={(field.options || []).join('\n')}
                                                                    onChange={(e) =>
                                                                        updateField(index, {
                                                                            options: e.target.value.split('\n').filter((o) => o.trim()),
                                                                        })
                                                                    }
                                                                    className="w-full px-2 py-1 text-sm border border-border rounded bg-background"
                                                                    rows={3}
                                                                />
                                                            </div>
                                                        )}
                                                        <div className="col-span-2 flex items-center gap-4">
                                                            <label className="flex items-center gap-2 text-sm">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={field.required}
                                                                    onChange={(e) => updateField(index, { required: e.target.checked })}
                                                                    className="rounded"
                                                                />
                                                                Obrigatório
                                                            </label>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => removeField(index)}
                                                        className="flex-shrink-0 text-destructive hover:text-destructive/80"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* Settings Tab */}
                {activeTab === 'settings' && (
                    <div className="col-span-12 max-w-2xl">
                        <div className="bg-card border border-border rounded-lg p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-medium mb-2">Descrição</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                                    rows={3}
                                    placeholder="Descrição interna do formulário"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Texto do Botão</label>
                                <input
                                    type="text"
                                    value={submitButtonText}
                                    onChange={(e) => setSubmitButtonText(e.target.value)}
                                    className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Mensagem de Sucesso</label>
                                <textarea
                                    value={successMessage}
                                    onChange={(e) => setSuccessMessage(e.target.value)}
                                    className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                                    rows={2}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">URL de Redirecionamento (opcional)</label>
                                <input
                                    type="url"
                                    value={redirectUrl}
                                    onChange={(e) => setRedirectUrl(e.target.value)}
                                    className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                                    placeholder="https://exemplo.com/obrigado"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Se preenchido, o usuário será redirecionado após o envio
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Preview Tab */}
                {activeTab === 'preview' && (
                    <div className="col-span-12 max-w-xl mx-auto">
                        <div className="bg-card border border-border rounded-lg p-8">
                            <h2 className="text-2xl font-bold mb-6">{name || 'Formulário'}</h2>
                            <div className="space-y-4">
                                {fields.map((field, index) => (
                                    <div key={index}>
                                        <label className="block text-sm font-medium mb-2">
                                            {field.label}
                                            {field.required && <span className="text-destructive ml-1">*</span>}
                                        </label>
                                        {field.type === 'TEXT' && (
                                            <input
                                                type="text"
                                                placeholder={field.placeholder}
                                                className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                                                disabled
                                            />
                                        )}
                                        {field.type === 'EMAIL' && (
                                            <input
                                                type="email"
                                                placeholder={field.placeholder}
                                                className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                                                disabled
                                            />
                                        )}
                                        {field.type === 'PHONE' && (
                                            <input
                                                type="tel"
                                                placeholder={field.placeholder}
                                                className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                                                disabled
                                            />
                                        )}
                                        {field.type === 'TEXTAREA' && (
                                            <textarea
                                                placeholder={field.placeholder}
                                                className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                                                rows={3}
                                                disabled
                                            />
                                        )}
                                        {field.type === 'NUMBER' && (
                                            <input
                                                type="number"
                                                placeholder={field.placeholder}
                                                className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                                                disabled
                                            />
                                        )}
                                        {field.type === 'DATE' && (
                                            <input
                                                type="date"
                                                className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                                                disabled
                                            />
                                        )}
                                        {field.type === 'SELECT' && (
                                            <select
                                                className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                                                disabled
                                            >
                                                <option value="">Selecione...</option>
                                                {(field.options || []).map((opt, i) => (
                                                    <option key={i} value={opt}>
                                                        {opt}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                        {field.type === 'RADIO' && (
                                            <div className="space-y-2">
                                                {(field.options || []).map((opt, i) => (
                                                    <label key={i} className="flex items-center gap-2">
                                                        <input type="radio" name={`preview-${index}`} disabled />
                                                        {opt}
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                        {field.type === 'CHECKBOX' && (
                                            <div className="space-y-2">
                                                {(field.options || []).map((opt, i) => (
                                                    <label key={i} className="flex items-center gap-2">
                                                        <input type="checkbox" disabled />
                                                        {opt}
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                                <button
                                    className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium mt-6"
                                    disabled
                                >
                                    {submitButtonText}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
