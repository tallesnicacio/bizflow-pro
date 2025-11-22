'use client';

import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, MoreHorizontal, Loader2 } from 'lucide-react';
import { getPipelines, createPipeline, createOpportunity, updateOpportunityStage } from '@/lib/crm-pipeline-actions';
import { getContacts } from '@/lib/crm-actions';
import { Modal } from '@/components/Modal';
import { cn } from '@/lib/utils';

const TENANT_ID = 'demo-tenant-1';

export default function PipelinesPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [pipelines, setPipelines] = useState<any[]>([]);
    const [selectedPipeline, setSelectedPipeline] = useState<any>(null);
    const [contacts, setContacts] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        value: '',
        contactId: '',
        stageId: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setIsLoading(true);
        try {
            const [pipelinesData, contactsData] = await Promise.all([
                getPipelines(TENANT_ID),
                getContacts(TENANT_ID)
            ]);
            setPipelines(pipelinesData);
            setContacts(contactsData);

            if (pipelinesData.length > 0) {
                setSelectedPipeline(pipelinesData[0]);
            }
        } catch (error) {
            console.error('Failed to load data', error);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleCreateDefaultPipeline() {
        setIsLoading(true);
        try {
            const newPipeline = await createPipeline({ name: 'Sales Pipeline', tenantId: TENANT_ID });
            setPipelines([newPipeline]);
            setSelectedPipeline(newPipeline);
        } catch (error) {
            console.error('Failed to create pipeline', error);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleCreateOpportunity(e: React.FormEvent) {
        e.preventDefault();
        setIsLoading(true);
        try {
            await createOpportunity({
                title: formData.title,
                value: Number(formData.value),
                contactId: formData.contactId,
                stageId: formData.stageId || selectedPipeline.stages[0].id,
                tenantId: TENANT_ID
            });
            setIsModalOpen(false);
            setFormData({ title: '', value: '', contactId: '', stageId: '' });
            await loadData();
        } catch (error) {
            console.error('Failed to create opportunity', error);
        } finally {
            setIsLoading(false);
        }
    }

    async function onDragEnd(result: any) {
        if (!result.destination) return;

        const { source, destination, draggableId } = result;

        if (source.droppableId === destination.droppableId) {
            // Reordering within same column (not implemented yet)
            return;
        }

        // Moving to different column
        const sourceStage = selectedPipeline.stages.find((s: any) => s.id === source.droppableId);
        const destStage = selectedPipeline.stages.find((s: any) => s.id === destination.droppableId);
        const opportunity = sourceStage.opportunities.find((o: any) => o.id === draggableId);

        // Optimistic update
        const newPipelines = [...pipelines];
        const pipelineIdx = newPipelines.findIndex(p => p.id === selectedPipeline.id);
        const sourceStageIdx = newPipelines[pipelineIdx].stages.findIndex((s: any) => s.id === source.droppableId);
        const destStageIdx = newPipelines[pipelineIdx].stages.findIndex((s: any) => s.id === destination.droppableId);

        // Remove from source
        newPipelines[pipelineIdx].stages[sourceStageIdx].opportunities = newPipelines[pipelineIdx].stages[sourceStageIdx].opportunities.filter((o: any) => o.id !== draggableId);
        // Add to destination
        newPipelines[pipelineIdx].stages[destStageIdx].opportunities.push({ ...opportunity, stageId: destStage.id });

        setPipelines(newPipelines);
        setSelectedPipeline(newPipelines[pipelineIdx]);

        try {
            await updateOpportunityStage(draggableId, destination.droppableId);
        } catch (error) {
            console.error('Failed to update stage', error);
            await loadData(); // Revert on error
        }
    }

    if (isLoading && pipelines.length === 0) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    if (pipelines.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <h2 className="text-2xl font-bold">Nenhum Pipeline Encontrado</h2>
                <p className="text-muted-foreground">Crie seu primeiro pipeline de vendas para começar.</p>
                <button
                    onClick={handleCreateDefaultPipeline}
                    className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all"
                >
                    Criar Pipeline Padrão
                </button>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-2rem)] flex flex-col">
            <header className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Pipelines</h1>
                    <p className="text-muted-foreground">Gerencie suas oportunidades de venda</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all"
                >
                    <Plus size={20} />
                    Nova Oportunidade
                </button>
            </header>

            <DragDropContext onDragEnd={onDragEnd}>
                <div className="flex gap-4 overflow-x-auto pb-4 h-full">
                    {selectedPipeline?.stages.map((stage: any) => (
                        <Droppable key={stage.id} droppableId={stage.id}>
                            {(provided) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className="min-w-[300px] w-[300px] bg-muted/30 rounded-xl border border-border flex flex-col max-h-full"
                                >
                                    <div className="p-4 border-b border-border flex justify-between items-center bg-muted/50 rounded-t-xl">
                                        <h3 className="font-semibold text-sm uppercase tracking-wider">{stage.name}</h3>
                                        <span className="text-xs text-muted-foreground bg-background px-2 py-1 rounded-full border border-border">
                                            {stage.opportunities.length}
                                        </span>
                                    </div>
                                    <div className="p-3 flex-1 overflow-y-auto space-y-3">
                                        {stage.opportunities.map((opportunity: any, index: number) => (
                                            <Draggable key={opportunity.id} draggableId={opportunity.id} index={index}>
                                                {(provided) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        className="bg-background p-4 rounded-lg border border-border shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing group"
                                                    >
                                                        <div className="flex justify-between items-start mb-2">
                                                            <h4 className="font-medium text-sm">{opportunity.title}</h4>
                                                            <button className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground">
                                                                <MoreHorizontal size={16} />
                                                            </button>
                                                        </div>
                                                        <div className="flex justify-between items-end">
                                                            <div className="text-xs text-muted-foreground">
                                                                {opportunity.contact?.name}
                                                            </div>
                                                            <div className="font-semibold text-sm text-primary">
                                                                R$ {Number(opportunity.value).toFixed(2)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                </div>
                            )}
                        </Droppable>
                    ))}
                </div>
            </DragDropContext>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Nova Oportunidade"
            >
                <form onSubmit={handleCreateOpportunity} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Título</label>
                        <input
                            required
                            className="w-full bg-background border border-input rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Ex: Venda de Cozinha"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Valor Estimado (R$)</label>
                        <input
                            required
                            type="number"
                            className="w-full bg-background border border-input rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                            value={formData.value}
                            onChange={e => setFormData({ ...formData, value: e.target.value })}
                            placeholder="0.00"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Contato</label>
                        <select
                            required
                            className="w-full bg-background border border-input rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                            value={formData.contactId}
                            onChange={e => setFormData({ ...formData, contactId: e.target.value })}
                        >
                            <option value="">Selecione um contato...</option>
                            {contacts.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Estágio Inicial</label>
                        <select
                            className="w-full bg-background border border-input rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                            value={formData.stageId}
                            onChange={e => setFormData({ ...formData, stageId: e.target.value })}
                        >
                            {selectedPipeline?.stages.map((s: any) => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-6 py-2 border border-border rounded-lg hover:bg-accent transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50"
                        >
                            {isLoading ? 'Criando...' : 'Criar Oportunidade'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
