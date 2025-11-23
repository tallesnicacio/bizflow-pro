'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Zap, ArrowRight, Mail, CheckSquare } from 'lucide-react';
import { createAutomationRule, deleteAutomationRule, getPipelineAutomations } from '@/lib/automation-actions';
import { Modal } from '@/components/Modal';

interface AutomationBuilderProps {
    pipelineId: string;
    stages: any[];
}

export function AutomationBuilder({ pipelineId, stages }: AutomationBuilderProps) {
    const [rules, setRules] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // New Rule State
    const [name, setName] = useState('');
    const [triggerType, setTriggerType] = useState('STAGE_ENTER');
    const [triggerStageId, setTriggerStageId] = useState('');
    const [actionType, setActionType] = useState('CREATE_TASK');
    const [actionTitle, setActionTitle] = useState('');

    useEffect(() => {
        loadRules();
    }, [pipelineId]);

    async function loadRules() {
        setIsLoading(true);
        try {
            const data = await getPipelineAutomations(pipelineId);
            setRules(data);
        } catch (error) {
            console.error('Failed to load rules', error);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleCreateRule(e: React.FormEvent) {
        e.preventDefault();
        try {
            const result = await createAutomationRule(pipelineId, {
                name,
                triggerType,
                triggerConfig: { stageId: triggerStageId },
                actionType,
                actionConfig: { title: actionTitle }
            });

            if (result.success) {
                setRules([result.rule, ...rules]);
                setIsModalOpen(false);
                resetForm();
            }
        } catch (error) {
            console.error('Failed to create rule', error);
        }
    }

    async function handleDeleteRule(id: string) {
        if (!confirm('Delete this automation?')) return;
        try {
            await deleteAutomationRule(id);
            setRules(rules.filter(r => r.id !== id));
        } catch (error) {
            console.error('Failed to delete rule', error);
        }
    }

    function resetForm() {
        setName('');
        setTriggerType('STAGE_ENTER');
        setTriggerStageId(stages[0]?.id || '');
        setActionType('CREATE_TASK');
        setActionTitle('');
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Zap className="text-yellow-500" size={20} />
                        Automations
                    </h2>
                    <p className="text-sm text-muted-foreground">Automate tasks and emails based on pipeline events.</p>
                </div>
                <button
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm"
                >
                    <Plus size={16} />
                    New Automation
                </button>
            </div>

            <div className="grid gap-4">
                {rules.length === 0 && !isLoading ? (
                    <div className="text-center py-8 bg-muted/30 rounded-lg border border-dashed border-border">
                        <p className="text-muted-foreground">No automations yet. Create one to save time!</p>
                    </div>
                ) : (
                    rules.map((rule) => {
                        const triggerConfig = JSON.parse(rule.triggerConfig);
                        const actionConfig = JSON.parse(rule.actionConfig);
                        const stageName = stages.find(s => s.id === triggerConfig.stageId)?.name || 'Unknown Stage';

                        return (
                            <div key={rule.id} className="flex items-center justify-between p-4 bg-card border border-border rounded-lg shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-yellow-500/10 text-yellow-600 rounded-lg">
                                        <Zap size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-medium">{rule.name}</h3>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                            <span className="flex items-center gap-1">
                                                When card enters <strong>{stageName}</strong>
                                            </span>
                                            <ArrowRight size={14} />
                                            <span className="flex items-center gap-1">
                                                {rule.actionType === 'CREATE_TASK' ? <CheckSquare size={14} /> : <Mail size={14} />}
                                                {rule.actionType === 'CREATE_TASK' ? 'Create Task' : 'Send Email'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDeleteRule(rule.id)}
                                    className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        );
                    })
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Create Automation"
            >
                <form onSubmit={handleCreateRule} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium mb-1.5">Rule Name</label>
                        <input
                            required
                            className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g. Follow up on new leads"
                        />
                    </div>

                    <div className="p-4 bg-muted/30 rounded-lg space-y-4 border border-border">
                        <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">When...</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium mb-1">Event</label>
                                <select
                                    className="w-full bg-background border border-input rounded px-3 py-2 text-sm"
                                    value={triggerType}
                                    onChange={e => setTriggerType(e.target.value)}
                                >
                                    <option value="STAGE_ENTER">Card Enters Stage</option>
                                    <option value="CARD_CREATED">Card Created</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1">Stage</label>
                                <select
                                    className="w-full bg-background border border-input rounded px-3 py-2 text-sm"
                                    value={triggerStageId}
                                    onChange={e => setTriggerStageId(e.target.value)}
                                >
                                    <option value="">Select Stage...</option>
                                    {stages.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-center">
                        <ArrowRight className="text-muted-foreground" />
                    </div>

                    <div className="p-4 bg-muted/30 rounded-lg space-y-4 border border-border">
                        <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Then...</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium mb-1">Action</label>
                                <select
                                    className="w-full bg-background border border-input rounded px-3 py-2 text-sm"
                                    value={actionType}
                                    onChange={e => setActionType(e.target.value)}
                                >
                                    <option value="CREATE_TASK">Create Task</option>
                                    <option value="SEND_EMAIL">Send Email (Mock)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1">
                                    {actionType === 'CREATE_TASK' ? 'Task Title' : 'Email Subject'}
                                </label>
                                <input
                                    required
                                    className="w-full bg-background border border-input rounded px-3 py-2 text-sm"
                                    value={actionTitle}
                                    onChange={e => setActionTitle(e.target.value)}
                                    placeholder={actionType === 'CREATE_TASK' ? "Call client" : "Welcome email"}
                                />
                            </div>
                        </div>
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
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all text-sm"
                        >
                            Create Rule
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
