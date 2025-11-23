'use client';

import { useState, useEffect } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Plus, Save, ArrowLeft, List } from 'lucide-react';
import Link from 'next/link';
import { updateStageOrder, createStage, deleteStage, updateStage } from '@/lib/pipeline-actions';
import { AutomationBuilder } from '@/components/crm/AutomationBuilder';
import { togglePublicForm, updateFieldFormSettings } from '@/lib/form-actions';
import { Copy, ExternalLink } from 'lucide-react';
import { createField, deleteField, getStageFields } from '@/lib/field-actions';
import { Modal } from '@/components/Modal';

// Sortable Item Component
function SortableStage({ stage, onDelete, onUpdate, onManageFields }: { stage: any, onDelete: (id: string) => void, onUpdate: (id: string, data: any) => void, onManageFields: (stage: any) => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: stage.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-center gap-4 p-4 bg-card border border-border rounded-lg mb-3 shadow-sm group"
        >
            <div {...attributes} {...listeners} className="cursor-grab text-muted-foreground hover:text-foreground">
                <GripVertical size={20} />
            </div>

            <div className="w-8 h-8 rounded-full border border-border shrink-0" style={{ backgroundColor: stage.color }} />

            <div className="flex-1">
                <input
                    className="bg-transparent font-medium focus:outline-none w-full"
                    value={stage.name}
                    onChange={(e) => onUpdate(stage.id, { name: e.target.value })}
                />
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={() => onManageFields(stage)}
                    className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                    title="Manage Fields"
                >
                    <List size={18} />
                </button>
                <input
                    type="color"
                    value={stage.color}
                    onChange={(e) => onUpdate(stage.id, { color: e.target.value })}
                    className="w-8 h-8 rounded cursor-pointer border-0 p-0 bg-transparent"
                />
                <button
                    onClick={() => onDelete(stage.id)}
                    className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                >
                    <Trash2 size={18} />
                </button>
            </div>
        </div>
    );
}

interface PipelineSettingsProps {
    pipeline: any;
}

export default function PipelineSettings({ pipeline }: PipelineSettingsProps) {
    const [stages, setStages] = useState(pipeline.stages);
    const [activeTab, setActiveTab] = useState('stages'); // 'stages' | 'automations' | 'form'
    const [isSaving, setIsSaving] = useState(false);

    // Form Settings State
    const [isFormEnabled, setIsFormEnabled] = useState(pipeline.publicFormEnabled);
    const [formSlug, setFormSlug] = useState(pipeline.publicFormSlug);
    const [firstStageFields, setFirstStageFields] = useState<any[]>([]);

    // Field Management State
    const [selectedStage, setSelectedStage] = useState<any>(null);
    const [stageFields, setStageFields] = useState<any[]>([]);
    const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
    const [newFieldName, setNewFieldName] = useState('');
    const [newFieldType, setNewFieldType] = useState('TEXT');

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Load first stage fields when tab changes
    useEffect(() => {
        if (activeTab === 'form' && stages.length > 0) {
            loadFirstStageFields();
        }
    }, [activeTab, stages]);

    async function loadFirstStageFields() {
        if (stages.length === 0) return;
        const fields = await getStageFields(stages[0].id);
        setFirstStageFields(fields);
    }

    async function handleToggleForm(enabled: boolean) {
        setIsFormEnabled(enabled);
        const result = await togglePublicForm(pipeline.id, enabled);
        if (result.success && result.slug) {
            setFormSlug(result.slug);
        }
    }

    async function handleToggleFieldVisibility(fieldId: string, show: boolean) {
        // Optimistic update
        setFirstStageFields(fields => fields.map(f => f.id === fieldId ? { ...f, showInForm: show } : f));
        await updateFieldFormSettings(fieldId, { showInForm: show });
    }

    async function handleManageFields(stage: any) {
        setSelectedStage(stage);
        const fields = await getStageFields(stage.id);
        setStageFields(fields);
        setIsFieldModalOpen(true);
    }

    async function handleAddField(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedStage) return;

        try {
            const result = await createField(selectedStage.id, {
                name: newFieldName,
                type: newFieldType,
                required: false,
                order: stageFields.length
            });

            if (result.success) {
                setStageFields([...stageFields, result.field]);
                setNewFieldName('');
                setNewFieldType('TEXT');
            } else {
                alert(result.error);
            }
        } catch (error) {
            console.error('Failed to add field', error);
        }
    }

    async function handleDeleteField(fieldId: string) {
        if (!confirm('Delete this field? Data will be lost.')) return;
        try {
            await deleteField(fieldId);
            setStageFields(stageFields.filter(f => f.id !== fieldId));
        } catch (error) {
            console.error('Failed to delete field', error);
        }
    }

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;

        if (active.id !== over?.id) {
            setStages((items: any[]) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over?.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    }

    async function handleSaveOrder() {
        setIsSaving(true);
        try {
            const updates = stages.map((stage: any, index: number) => ({
                id: stage.id,
                order: index
            }));
            await updateStageOrder(updates);
            alert('Order saved successfully!');
        } catch (error) {
            console.error('Failed to save order', error);
            alert('Failed to save order');
        } finally {
            setIsSaving(false);
        }
    }

    async function handleAddStage() {
        const name = prompt('Enter stage name:');
        if (!name) return;

        try {
            const result = await createStage({
                name,
                color: '#94a3b8',
                pipelineId: pipeline.id,
                order: stages.length
            });

            if (result.success) {
                setStages([...stages, result.stage]);
            } else {
                alert(result.error);
            }
        } catch (error) {
            console.error('Failed to add stage', error);
        }
    }

    async function handleDeleteStage(id: string) {
        if (!confirm('Are you sure? This stage must be empty.')) return;

        try {
            const result = await deleteStage(id);
            if (result.success) {
                setStages(stages.filter((s: any) => s.id !== id));
            } else {
                alert(result.error);
            }
        } catch (error) {
            console.error('Failed to delete stage', error);
        }
    }

    async function handleUpdateStage(id: string, data: any) {
        // Optimistic update
        setStages(stages.map((s: any) => s.id === id ? { ...s, ...data } : s));

        try {
            await updateStage(id, data);
        } catch (error) {
            console.error('Failed to update stage', error);
        }
    }

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/crm/pipelines" className="p-2 hover:bg-accent rounded-lg transition-colors">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">Pipeline Settings: {pipeline.name}</h1>
                    <p className="text-muted-foreground">Customize your sales process.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-muted/30 p-1 rounded-lg mb-8 w-fit">
                <button
                    onClick={() => setActiveTab('stages')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'stages' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    Stages & Fields
                </button>
                <button
                    onClick={() => setActiveTab('automations')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'automations' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    Automations
                </button>
                <button
                    onClick={() => setActiveTab('form')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'form' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    Public Form
                </button>
            </div>

            {activeTab === 'stages' && (
                // ... (Stages content)
                <>
                    <div className="flex justify-end gap-3 mb-4">
                        <button
                            onClick={handleAddStage}
                            className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors"
                        >
                            <Plus size={18} />
                            Add Stage
                        </button>
                        <button
                            onClick={handleSaveOrder}
                            disabled={isSaving}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                            <Save size={18} />
                            {isSaving ? 'Saving...' : 'Save Order'}
                        </button>
                    </div>

                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={stages.map((s: any) => s.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="space-y-2">
                                {stages.map((stage: any) => (
                                    <SortableStage
                                        key={stage.id}
                                        stage={stage}
                                        onDelete={handleDeleteStage}
                                        onUpdate={handleUpdateStage}
                                        onManageFields={handleManageFields}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                </>
            )}

            {activeTab === 'automations' && (
                <AutomationBuilder pipelineId={pipeline.id} stages={stages} />
            )}

            {activeTab === 'form' && (
                <div className="space-y-6">
                    <div className="bg-card border border-border rounded-lg p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-medium">Public Lead Capture Form</h3>
                                <p className="text-sm text-muted-foreground">Share this link to let anyone create cards in your pipeline.</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={isFormEnabled}
                                        onChange={(e) => handleToggleForm(e.target.checked)}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                    <span className="ml-3 text-sm font-medium text-gray-900">Enabled</span>
                                </label>
                            </div>
                        </div>

                        {isFormEnabled && (
                            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border border-border mb-6">
                                <code className="flex-1 text-sm text-muted-foreground">
                                    {typeof window !== 'undefined' ? window.location.origin : ''}/f/{formSlug}
                                </code>
                                <button
                                    onClick={() => navigator.clipboard.writeText(`${window.location.origin}/f/${formSlug}`)}
                                    className="p-2 hover:bg-background rounded-md transition-colors"
                                    title="Copy Link"
                                >
                                    <Copy size={16} />
                                </button>
                                <a
                                    href={`/f/${formSlug}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 hover:bg-background rounded-md transition-colors"
                                    title="Open Form"
                                >
                                    <ExternalLink size={16} />
                                </a>
                            </div>
                        )}

                        <div className="space-y-4">
                            <h4 className="font-medium text-sm">Form Fields (from First Stage)</h4>
                            <p className="text-xs text-muted-foreground mb-4">Select which fields should be visible on the public form.</p>

                            <div className="space-y-2">
                                <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg border border-border opacity-75">
                                    <input type="checkbox" checked disabled className="rounded border-gray-300 text-primary focus:ring-primary" />
                                    <span className="text-sm font-medium">Title / Name (Required)</span>
                                </div>
                                {firstStageFields.map(field => (
                                    <div key={field.id} className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg">
                                        <input
                                            type="checkbox"
                                            checked={field.showInForm || false}
                                            onChange={(e) => handleToggleFieldVisibility(field.id, e.target.checked)}
                                            className="rounded border-gray-300 text-primary focus:ring-primary"
                                        />
                                        <div>
                                            <p className="text-sm font-medium">{field.name}</p>
                                            <p className="text-xs text-muted-foreground">{field.type}</p>
                                        </div>
                                    </div>
                                ))}
                                {firstStageFields.length === 0 && (
                                    <p className="text-sm text-muted-foreground italic">No custom fields in the first stage.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Field Management Modal */}
            <Modal
                isOpen={isFieldModalOpen}
                onClose={() => setIsFieldModalOpen(false)}
                title={`Fields for ${selectedStage?.name}`}
            >
                <div className="space-y-6">
                    {/* Add Field Form */}
                    <form onSubmit={handleAddField} className="flex gap-3 items-end bg-muted/30 p-4 rounded-lg">
                        <div className="flex-1">
                            <label className="block text-xs font-medium mb-1">Field Name</label>
                            <input
                                required
                                className="w-full bg-background border border-input rounded px-3 py-1.5 text-sm"
                                value={newFieldName}
                                onChange={e => setNewFieldName(e.target.value)}
                                placeholder="e.g. Budget"
                            />
                        </div>
                        <div className="w-32">
                            <label className="block text-xs font-medium mb-1">Type</label>
                            <select
                                className="w-full bg-background border border-input rounded px-3 py-1.5 text-sm"
                                value={newFieldType}
                                onChange={e => setNewFieldType(e.target.value)}
                            >
                                <option value="SHORT_TEXT">Short Text</option>
                                <option value="LONG_TEXT">Long Text</option>
                                <option value="NUMBER">Number</option>
                                <option value="CURRENCY">Currency</option>
                                <option value="DATE">Date</option>
                                <option value="DATETIME">Date & Time</option>
                                <option value="TIME">Time</option>
                                <option value="SELECT">Select (Dropdown)</option>
                                <option value="RADIO">Radio (Single Option)</option>
                                <option value="CHECKBOX">Checkbox</option>
                                <option value="EMAIL">Email</option>
                                <option value="PHONE">Phone</option>
                                <option value="CPF_CNH">Document (CPF/CNH)</option>
                                <option value="ASSIGNEE">Assignee (Users)</option>
                                <option value="LABELS">Labels (Tags)</option>
                            </select>
                        </div>
                        <button
                            type="submit"
                            className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90"
                        >
                            Add
                        </button>
                    </form>

                    {/* Fields List */}
                    <div className="space-y-2">
                        {stageFields.length === 0 ? (
                            <p className="text-center text-muted-foreground text-sm py-4">No custom fields yet.</p>
                        ) : (
                            stageFields.map((field) => (
                                <div key={field.id} className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
                                    <div>
                                        <p className="font-medium text-sm">{field.name}</p>
                                        <p className="text-xs text-muted-foreground">{field.type}</p>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteField(field.id)}
                                        className="text-muted-foreground hover:text-red-500"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </Modal>
        </div>
    );
}
