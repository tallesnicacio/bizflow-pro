'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getWorkflow, createWorkflow, updateWorkflow } from '@/lib/workflow-actions';
import { WorkflowCanvas } from '@/components/workflow/WorkflowCanvas';

const TENANT_ID = 'demo-tenant-1';

export default function WorkflowBuilderPage() {
    const router = useRouter();
    const params = useParams();
    const workflowId = params?.workflowId as string;
    const isNew = workflowId === 'new';

    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);
    const [workflowData, setWorkflowData] = useState<any>(null);

    // Metadata
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    useEffect(() => {
        if (!isNew && workflowId) {
            loadWorkflow();
        }
    }, [workflowId, isNew]);

    async function loadWorkflow() {
        try {
            const workflow = await getWorkflow(workflowId);
            if (workflow) {
                setName(workflow.name);
                setDescription(workflow.description || '');
                setWorkflowData(workflow);
            }
        } catch (error) {
            console.error('Failed to load workflow:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleSave(flowData: any) {
        if (!name.trim()) {
            alert('Nome do workflow é obrigatório');
            return;
        }

        setSaving(true);
        try {
            const data = {
                name,
                description,
                tenantId: TENANT_ID,
                trigger: flowData.trigger,
                actions: flowData.actions.map((action: any, index: number) => ({
                    ...action,
                    order: index,
                })),
            };

            if (isNew) {
                await createWorkflow(data);
            } else {
                await updateWorkflow(workflowId, data);
            }

            router.push('/automation');
        } catch (error) {
            console.error('Failed to save workflow:', error);
            alert('Erro ao salvar workflow');
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="p-8">
                <div className="text-center">Carregando workflow...</div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col">
            {/* Header */}
            <div className="h-16 border-b border-border flex items-center justify-between px-6 bg-background">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/automation')}
                        className="text-muted-foreground hover:text-foreground"
                    >
                        ← Voltar
                    </button>
                    <div className="h-6 w-px bg-border" />
                    <div>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="font-bold text-lg bg-transparent border-none focus:ring-0 p-0"
                            placeholder="Nome do Workflow"
                        />
                    </div>
                </div>
            </div>

            {/* Canvas Area */}
            <div className="flex-1 bg-muted/10 p-4">
                <WorkflowCanvas
                    initialData={workflowData}
                    onSave={handleSave}
                    saving={saving}
                />
            </div>
        </div>
    );
}
