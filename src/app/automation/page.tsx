'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getWorkflows, deleteWorkflow, toggleWorkflowStatus } from '@/lib/workflow-actions';

const TENANT_ID = 'demo-tenant-1';

export default function AutomationPage() {
    const router = useRouter();
    const [workflows, setWorkflows] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

    useEffect(() => {
        loadWorkflows();
    }, []);

    async function loadWorkflows() {
        try {
            const data = await getWorkflows(TENANT_ID);
            setWorkflows(data);
        } catch (error) {
            console.error('Failed to load workflows:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleToggleStatus(workflowId: string, currentStatus: boolean) {
        try {
            await toggleWorkflowStatus(workflowId, !currentStatus);
            await loadWorkflows();
        } catch (error) {
            console.error('Failed to toggle workflow:', error);
        }
    }

    async function handleDelete(workflowId: string) {
        if (!confirm('Tem certeza que deseja excluir este workflow?')) return;

        try {
            await deleteWorkflow(workflowId);
            await loadWorkflows();
        } catch (error) {
            console.error('Failed to delete workflow:', error);
        }
    }

    const filteredWorkflows = workflows.filter((w) => {
        if (filter === 'active') return w.isActive;
        if (filter === 'inactive') return !w.isActive;
        return true;
    });

    const getTriggerLabel = (type: string) => {
        const labels: Record<string, string> = {
            CONTACT_CREATED: 'Contato Criado',
            TAG_ADDED: 'Tag Adicionada',
            PIPELINE_STAGE_CHANGED: 'Estágio Alterado',
            FORM_SUBMITTED: 'Formulário Enviado',
        };
        return labels[type] || type;
    };

    if (loading) {
        return (
            <div className="p-8">
                <div className="text-center">Carregando workflows...</div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Automação</h1>
                    <p className="text-muted-foreground mt-2">
                        Crie workflows automatizados para otimizar seu processo
                    </p>
                </div>
                <button
                    onClick={() => router.push('/automation/new')}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium"
                >
                    + Novo Workflow
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
                    Todos ({workflows.length})
                </button>
                <button
                    onClick={() => setFilter('active')}
                    className={`px-4 py-2 rounded-lg font-medium ${filter === 'active'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                >
                    Ativos ({workflows.filter((w) => w.isActive).length})
                </button>
                <button
                    onClick={() => setFilter('inactive')}
                    className={`px-4 py-2 rounded-lg font-medium ${filter === 'inactive'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                >
                    Inativos ({workflows.filter((w) => !w.isActive).length})
                </button>
            </div>

            {/* Workflows List */}
            {filteredWorkflows.length === 0 ? (
                <div className="text-center py-12 bg-muted/30 rounded-lg border-2 border-dashed border-border">
                    <p className="text-muted-foreground mb-4">Nenhum workflow encontrado</p>
                    <button
                        onClick={() => router.push('/automation/new')}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium"
                    >
                        Criar Primeiro Workflow
                    </button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredWorkflows.map((workflow) => (
                        <div
                            key={workflow.id}
                            className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-xl font-semibold">{workflow.name}</h3>
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-medium ${workflow.isActive
                                                    ? 'bg-green-500/20 text-green-600'
                                                    : 'bg-gray-500/20 text-gray-600'
                                                }`}
                                        >
                                            {workflow.isActive ? 'Ativo' : 'Inativo'}
                                        </span>
                                    </div>
                                    {workflow.description && (
                                        <p className="text-muted-foreground mb-4">{workflow.description}</p>
                                    )}

                                    <div className="flex items-center gap-6 text-sm">
                                        <div>
                                            <span className="text-muted-foreground">Gatilho:</span>{' '}
                                            <span className="font-medium">
                                                {workflow.trigger ? getTriggerLabel(workflow.trigger.type) : 'N/A'}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Ações:</span>{' '}
                                            <span className="font-medium">{workflow.actions.length}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleToggleStatus(workflow.id, workflow.isActive)}
                                        className="px-3 py-1 bg-muted hover:bg-muted/80 rounded text-sm font-medium"
                                    >
                                        {workflow.isActive ? 'Desativar' : 'Ativar'}
                                    </button>
                                    <button
                                        onClick={() => router.push(`/automation/${workflow.id}`)}
                                        className="px-3 py-1 bg-primary text-primary-foreground hover:bg-primary/90 rounded text-sm font-medium"
                                    >
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => handleDelete(workflow.id)}
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
        </div>
    );
}
