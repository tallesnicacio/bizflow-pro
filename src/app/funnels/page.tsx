'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getFunnels, deleteFunnel, toggleFunnelStatus, createFunnel } from '@/lib/funnel-actions';
import { generateSlug } from '@/lib/form-utils';
import { Modal } from '@/components/Modal';

const TENANT_ID = 'demo-tenant-1';

export default function FunnelsPage() {
    const router = useRouter();
    const [funnels, setFunnels] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newFunnelName, setNewFunnelName] = useState('');
    const [newFunnelSlug, setNewFunnelSlug] = useState('');
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        loadFunnels();
    }, []);

    async function loadFunnels() {
        try {
            const data = await getFunnels(TENANT_ID);
            setFunnels(data);
        } catch (error) {
            console.error('Failed to load funnels:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleToggleStatus(funnelId: string, currentStatus: boolean) {
        try {
            await toggleFunnelStatus(funnelId, !currentStatus);
            await loadFunnels();
        } catch (error) {
            console.error('Failed to toggle funnel:', error);
        }
    }

    async function handleDelete(funnelId: string) {
        if (!confirm('Tem certeza que deseja excluir este funnel? Todas as páginas serão removidas.')) return;

        try {
            await deleteFunnel(funnelId);
            await loadFunnels();
        } catch (error) {
            console.error('Failed to delete funnel:', error);
        }
    }

    function handleNameChange(name: string) {
        setNewFunnelName(name);
        setNewFunnelSlug(generateSlug(name));
    }

    async function handleCreateFunnel() {
        if (!newFunnelName.trim()) {
            alert('Nome é obrigatório');
            return;
        }

        setCreating(true);
        try {
            const funnel = await createFunnel({
                name: newFunnelName,
                slug: newFunnelSlug,
                tenantId: TENANT_ID,
            });
            setShowCreateModal(false);
            setNewFunnelName('');
            setNewFunnelSlug('');
            router.push(`/funnels/${funnel.id}`);
        } catch (error) {
            console.error('Failed to create funnel:', error);
            alert('Erro ao criar funnel');
        } finally {
            setCreating(false);
        }
    }

    const filteredFunnels = funnels.filter((f) => {
        if (filter === 'active') return f.isActive;
        if (filter === 'inactive') return !f.isActive;
        return true;
    });

    if (loading) {
        return (
            <div className="p-8">
                <div className="text-center">Carregando funnels...</div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Funnels</h1>
                    <p className="text-muted-foreground mt-2">
                        Crie landing pages e funis de conversão
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium"
                >
                    + Novo Funnel
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
                    Todos ({funnels.length})
                </button>
                <button
                    onClick={() => setFilter('active')}
                    className={`px-4 py-2 rounded-lg font-medium ${filter === 'active'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                >
                    Ativos ({funnels.filter((f) => f.isActive).length})
                </button>
                <button
                    onClick={() => setFilter('inactive')}
                    className={`px-4 py-2 rounded-lg font-medium ${filter === 'inactive'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                >
                    Inativos ({funnels.filter((f) => !f.isActive).length})
                </button>
            </div>

            {/* Funnels List */}
            {filteredFunnels.length === 0 ? (
                <div className="text-center py-12 bg-muted/30 rounded-lg border-2 border-dashed border-border">
                    <p className="text-muted-foreground mb-4">Nenhum funnel encontrado</p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium"
                    >
                        Criar Primeiro Funnel
                    </button>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredFunnels.map((funnel) => (
                        <div
                            key={funnel.id}
                            className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                        >
                            {/* Preview Image Placeholder */}
                            <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                <span className="text-4xl">🚀</span>
                            </div>

                            <div className="p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <h3 className="text-lg font-semibold flex-1">{funnel.name}</h3>
                                    <span
                                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${funnel.isActive
                                            ? 'bg-green-500/20 text-green-600'
                                            : 'bg-gray-500/20 text-gray-600'
                                            }`}
                                    >
                                        {funnel.isActive ? 'Ativo' : 'Inativo'}
                                    </span>
                                </div>

                                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                                    <span>{funnel.pages.length} páginas</span>
                                    <span>/p/{funnel.slug}</span>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => router.push(`/funnels/${funnel.id}`)}
                                        className="flex-1 px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded text-sm font-medium"
                                    >
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => handleToggleStatus(funnel.id, funnel.isActive)}
                                        className="px-3 py-1.5 bg-muted hover:bg-muted/80 rounded text-sm font-medium"
                                    >
                                        {funnel.isActive ? 'Desativar' : 'Ativar'}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(funnel.id)}
                                        className="px-3 py-1.5 bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded text-sm font-medium"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Funnel Modal */}
            <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Novo Funnel">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Nome do Funnel *</label>
                        <input
                            type="text"
                            value={newFunnelName}
                            onChange={(e) => handleNameChange(e.target.value)}
                            className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                            placeholder="Ex: Landing Page Principal"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Slug (URL)</label>
                        <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">/p/</span>
                            <input
                                type="text"
                                value={newFunnelSlug}
                                onChange={(e) => setNewFunnelSlug(e.target.value)}
                                className="flex-1 px-3 py-2 border border-border rounded-lg bg-background"
                                placeholder="landing-page"
                            />
                        </div>
                    </div>
                    <div className="flex gap-3 justify-end pt-4">
                        <button
                            onClick={() => setShowCreateModal(false)}
                            className="px-4 py-2 border border-border rounded-lg hover:bg-muted font-medium"
                            disabled={creating}
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleCreateFunnel}
                            disabled={creating}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium"
                        >
                            {creating ? 'Criando...' : 'Criar Funnel'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
