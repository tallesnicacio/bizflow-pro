'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getForms, deleteForm, toggleFormStatus } from '@/lib/form-actions';
import { generateSlug } from '@/lib/form-utils';
import { Modal } from '@/components/Modal';

const TENANT_ID = 'demo-tenant-1';

export default function FormsPage() {
    const router = useRouter();
    const [forms, setForms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newFormName, setNewFormName] = useState('');
    const [newFormSlug, setNewFormSlug] = useState('');

    useEffect(() => {
        loadForms();
    }, []);

    async function loadForms() {
        try {
            const data = await getForms(TENANT_ID);
            setForms(data);
        } catch (error) {
            console.error('Failed to load forms:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleToggleStatus(formId: string, currentStatus: boolean) {
        try {
            await toggleFormStatus(formId, !currentStatus);
            await loadForms();
        } catch (error) {
            console.error('Failed to toggle form:', error);
        }
    }

    async function handleDelete(formId: string) {
        if (!confirm('Tem certeza que deseja excluir este formulário?')) return;

        try {
            await deleteForm(formId);
            await loadForms();
        } catch (error) {
            console.error('Failed to delete form:', error);
        }
    }

    function handleNameChange(name: string) {
        setNewFormName(name);
        setNewFormSlug(generateSlug(name));
    }

    function handleCreateForm() {
        if (!newFormName.trim()) {
            alert('Nome é obrigatório');
            return;
        }
        router.push(`/forms/new?name=${encodeURIComponent(newFormName)}&slug=${encodeURIComponent(newFormSlug)}`);
    }

    const filteredForms = forms.filter((f) => {
        if (filter === 'active') return f.isActive;
        if (filter === 'inactive') return !f.isActive;
        return true;
    });

    const copyEmbedCode = (form: any) => {
        const embedCode = `<iframe src="${window.location.origin}/f/${form.slug}" width="100%" height="500" frameborder="0"></iframe>`;
        navigator.clipboard.writeText(embedCode);
        alert('Código de incorporação copiado!');
    };

    if (loading) {
        return (
            <div className="p-8">
                <div className="text-center">Carregando formulários...</div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Formulários</h1>
                    <p className="text-muted-foreground mt-2">
                        Crie formulários para capturar leads e informações
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium"
                >
                    + Novo Formulário
                </button>
            </div>

            {/* Filters */}
            <div className="mb-6 flex gap-2">
                <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-lg font-medium ${filter === 'all'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                >
                    Todos ({forms.length})
                </button>
                <button
                    onClick={() => setFilter('active')}
                    className={`px-4 py-2 rounded-lg font-medium ${filter === 'active'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                >
                    Ativos ({forms.filter((f) => f.isActive).length})
                </button>
                <button
                    onClick={() => setFilter('inactive')}
                    className={`px-4 py-2 rounded-lg font-medium ${filter === 'inactive'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                >
                    Inativos ({forms.filter((f) => !f.isActive).length})
                </button>
            </div>

            {/* Forms List */}
            {filteredForms.length === 0 ? (
                <div className="text-center py-12 bg-muted/30 rounded-lg border-2 border-dashed border-border">
                    <p className="text-muted-foreground mb-4">Nenhum formulário encontrado</p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium"
                    >
                        Criar Primeiro Formulário
                    </button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredForms.map((form) => (
                        <div
                            key={form.id}
                            className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-xl font-semibold">{form.name}</h3>
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-medium ${form.isActive
                                                ? 'bg-green-500/20 text-green-600'
                                                : 'bg-gray-500/20 text-gray-600'
                                                }`}
                                        >
                                            {form.isActive ? 'Ativo' : 'Inativo'}
                                        </span>
                                    </div>
                                    {form.description && (
                                        <p className="text-muted-foreground mb-4">{form.description}</p>
                                    )}

                                    <div className="flex items-center gap-6 text-sm">
                                        <div>
                                            <span className="text-muted-foreground">Campos:</span>{' '}
                                            <span className="font-medium">{form.fields.length}</span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Submissões:</span>{' '}
                                            <span className="font-medium">{form._count.submissions}</span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">URL:</span>{' '}
                                            <code className="text-xs bg-muted px-2 py-1 rounded">/f/{form.slug}</code>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => copyEmbedCode(form)}
                                        className="px-3 py-1 bg-muted hover:bg-muted/80 rounded text-sm font-medium"
                                        title="Copiar código de incorporação"
                                    >
                                        Embed
                                    </button>
                                    <button
                                        onClick={() => handleToggleStatus(form.id, form.isActive)}
                                        className="px-3 py-1 bg-muted hover:bg-muted/80 rounded text-sm font-medium"
                                    >
                                        {form.isActive ? 'Desativar' : 'Ativar'}
                                    </button>
                                    <button
                                        onClick={() => router.push(`/forms/${form.id}`)}
                                        className="px-3 py-1 bg-primary text-primary-foreground hover:bg-primary/90 rounded text-sm font-medium"
                                    >
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => router.push(`/forms/${form.id}/submissions`)}
                                        className="px-3 py-1 bg-blue-500 text-white hover:bg-blue-600 rounded text-sm font-medium"
                                    >
                                        Respostas
                                    </button>
                                    <button
                                        onClick={() => handleDelete(form.id)}
                                        className="px-3 py-1 bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded text-sm font-medium"
                                    >
                                        Excluir
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Form Modal */}
            <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Novo Formulário">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Nome do Formulário *</label>
                        <input
                            type="text"
                            value={newFormName}
                            onChange={(e) => handleNameChange(e.target.value)}
                            className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                            placeholder="Ex: Formulário de Contato"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Slug (URL)</label>
                        <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">/f/</span>
                            <input
                                type="text"
                                value={newFormSlug}
                                onChange={(e) => setNewFormSlug(e.target.value)}
                                className="flex-1 px-3 py-2 border border-border rounded-lg bg-background"
                                placeholder="formulario-contato"
                            />
                        </div>
                    </div>
                    <div className="flex gap-3 justify-end pt-4">
                        <button
                            onClick={() => setShowCreateModal(false)}
                            className="px-4 py-2 border border-border rounded-lg hover:bg-muted font-medium"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleCreateForm}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium"
                        >
                            Continuar
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
