'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/Modal';
import { getStageFields, getOpportunityFieldValues, saveFieldValue } from '@/lib/field-actions';
import { getUsers } from '@/lib/settings-actions';
import { getTags } from '@/lib/tag-actions';
import { updateOpportunityAI } from '@/lib/pipeline-actions';
import { Loader2, Sparkles, BrainCircuit } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OpportunityDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    opportunity: any;
    stageName: string;
}

export function OpportunityDetailsModal({ isOpen, onClose, opportunity, stageName }: OpportunityDetailsModalProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [fields, setFields] = useState<any[]>([]);
    const [values, setValues] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);

    // System Data
    const [users, setUsers] = useState<any[]>([]);
    const [tags, setTags] = useState<any[]>([]);

    // AI State
    const [activeTab, setActiveTab] = useState<'details' | 'ai'>('details');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiData, setAiData] = useState<{ score?: number; summary?: string }>({});

    useEffect(() => {
        if (isOpen && opportunity) {
            loadFieldsAndValues();
        }
    }, [isOpen, opportunity]);

    async function loadFieldsAndValues() {
        setIsLoading(true);
        try {
            const [stageFields, fieldValues, usersData, tagsData] = await Promise.all([
                getStageFields(opportunity.stageId),
                getOpportunityFieldValues(opportunity.id),
                getUsers(opportunity.tenantId),
                getTags(opportunity.tenantId)
            ]);

            setFields(stageFields);
            setUsers(usersData);
            setTags(tagsData);

            const valuesMap: Record<string, string> = {};
            fieldValues.forEach((fv: any) => {
                valuesMap[fv.fieldId] = fv.value;
            });
            setValues(valuesMap);

            // Set initial AI data
            if (opportunity.aiScore !== null || opportunity.aiSummary) {
                setAiData({
                    score: opportunity.aiScore,
                    summary: opportunity.aiSummary
                });
            }
        } catch (error) {
            console.error('Failed to load fields', error);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        setIsSaving(true);
        try {
            // Save all values
            await Promise.all(
                Object.entries(values).map(([fieldId, value]) =>
                    saveFieldValue(opportunity.id, fieldId, value)
                )
            );
            onClose();
        } catch (error) {
            console.error('Failed to save values', error);
        } finally {
            setIsSaving(false);
        }
    }

    const handleChange = (fieldId: string, value: string) => {
        setValues(prev => ({ ...prev, [fieldId]: value }));
    };

    async function handleAnalyzeAI() {
        setIsAnalyzing(true);
        try {
            const updatedOpp: any = await updateOpportunityAI(opportunity.id);
            setAiData({
                score: updatedOpp.aiScore || 0,
                summary: updatedOpp.aiSummary || ''
            });
        } catch (error) {
            console.error('Failed to analyze with AI', error);
        } finally {
            setIsAnalyzing(false);
        }
    }

    if (!opportunity) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={opportunity.title}>
            <div className="space-y-6">
                {/* Header Info */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                    <div>
                        <p className="text-xs text-muted-foreground">Stage</p>
                        <p className="font-medium">{stageName}</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Value</p>
                        <p className="font-medium">R$ {Number(opportunity.value).toFixed(2)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Contact</p>
                        <p className="font-medium">{opportunity.contact?.name}</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="font-medium text-sm truncate">{opportunity.contact?.email}</p>
                    </div>
                </div>

            </div>

            {/* Tabs */}
            <div className="flex border-b border-border">
                <button
                    onClick={() => setActiveTab('details')}
                    className={cn(
                        "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                        activeTab === 'details'
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                >
                    Details
                </button>
                <button
                    onClick={() => setActiveTab('ai')}
                    className={cn(
                        "px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
                        activeTab === 'ai'
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                >
                    <Sparkles size={14} />
                    AI Insights
                </button>
            </div>

            {activeTab === 'details' ? (
                <div className="pt-2">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                        Stage Fields
                        {isLoading && <Loader2 className="animate-spin" size={14} />}
                    </h3>

                    {isLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-10 bg-muted/50 rounded animate-pulse" />
                            ))}
                        </div>
                    ) : fields.length === 0 ? (
                        <p className="text-muted-foreground text-sm italic">No custom fields for this stage.</p>
                    ) : (
                        <form onSubmit={handleSave} className="space-y-4">
                            {fields.map((field) => (
                                <div key={field.id}>
                                    <label className="block text-sm font-medium mb-1.5">
                                        {field.name}
                                        {field.required && <span className="text-red-500 ml-1">*</span>}
                                    </label>

                                    {/* SHORT_TEXT & TEXT (Legacy) */}
                                    {(field.type === 'SHORT_TEXT' || field.type === 'TEXT') && (
                                        <input
                                            type="text"
                                            required={field.required}
                                            className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                            value={values[field.id] || ''}
                                            onChange={e => handleChange(field.id, e.target.value)}
                                        />
                                    )}

                                    {/* LONG_TEXT */}
                                    {field.type === 'LONG_TEXT' && (
                                        <textarea
                                            required={field.required}
                                            rows={3}
                                            className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                                            value={values[field.id] || ''}
                                            onChange={e => handleChange(field.id, e.target.value)}
                                        />
                                    )}

                                    {/* NUMBER */}
                                    {field.type === 'NUMBER' && (
                                        <input
                                            type="number"
                                            required={field.required}
                                            className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                            value={values[field.id] || ''}
                                            onChange={e => handleChange(field.id, e.target.value)}
                                        />
                                    )}

                                    {/* CURRENCY */}
                                    {field.type === 'CURRENCY' && (
                                        <div className="relative">
                                            <span className="absolute left-3 top-2 text-muted-foreground text-sm">R$</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                required={field.required}
                                                className="w-full bg-background border border-input rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                                value={values[field.id] || ''}
                                                onChange={e => handleChange(field.id, e.target.value)}
                                            />
                                        </div>
                                    )}

                                    {/* DATE & DUE_DATE */}
                                    {(field.type === 'DATE' || field.type === 'DUE_DATE') && (
                                        <input
                                            type="date"
                                            required={field.required}
                                            className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                            value={values[field.id] || ''}
                                            onChange={e => handleChange(field.id, e.target.value)}
                                        />
                                    )}

                                    {/* DATETIME */}
                                    {field.type === 'DATETIME' && (
                                        <input
                                            type="datetime-local"
                                            required={field.required}
                                            className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                            value={values[field.id] || ''}
                                            onChange={e => handleChange(field.id, e.target.value)}
                                        />
                                    )}

                                    {/* TIME */}
                                    {field.type === 'TIME' && (
                                        <input
                                            type="time"
                                            required={field.required}
                                            className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                            value={values[field.id] || ''}
                                            onChange={e => handleChange(field.id, e.target.value)}
                                        />
                                    )}

                                    {/* SELECT */}
                                    {field.type === 'SELECT' && (
                                        <select
                                            required={field.required}
                                            className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                            value={values[field.id] || ''}
                                            onChange={e => handleChange(field.id, e.target.value)}
                                        >
                                            <option value="">Select...</option>
                                            {field.options?.split(',').map((opt: string) => (
                                                <option key={opt.trim()} value={opt.trim()}>{opt.trim()}</option>
                                            ))}
                                        </select>
                                    )}

                                    {/* RADIO */}
                                    {field.type === 'RADIO' && (
                                        <div className="space-y-2">
                                            {field.options?.split(',').map((opt: string) => (
                                                <label key={opt.trim()} className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name={`field-${field.id}`}
                                                        required={field.required}
                                                        className="w-4 h-4 border-input text-primary focus:ring-primary"
                                                        checked={values[field.id] === opt.trim()}
                                                        onChange={() => handleChange(field.id, opt.trim())}
                                                    />
                                                    <span className="text-sm">{opt.trim()}</span>
                                                </label>
                                            ))}
                                        </div>
                                    )}

                                    {/* CHECKBOX */}
                                    {field.type === 'CHECKBOX' && (
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 rounded border-input text-primary focus:ring-primary"
                                                checked={values[field.id] === 'true'}
                                                onChange={e => handleChange(field.id, e.target.checked ? 'true' : 'false')}
                                            />
                                            <span className="text-sm text-muted-foreground">Yes</span>
                                        </label>
                                    )}

                                    {/* EMAIL */}
                                    {field.type === 'EMAIL' && (
                                        <input
                                            type="email"
                                            required={field.required}
                                            className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                            value={values[field.id] || ''}
                                            onChange={e => handleChange(field.id, e.target.value)}
                                        />
                                    )}

                                    {/* PHONE */}
                                    {field.type === 'PHONE' && (
                                        <input
                                            type="tel"
                                            required={field.required}
                                            className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                            value={values[field.id] || ''}
                                            onChange={e => handleChange(field.id, e.target.value)}
                                            placeholder="+55 (11) 99999-9999"
                                        />
                                    )}

                                    {/* CPF_CNH */}
                                    {field.type === 'CPF_CNH' && (
                                        <input
                                            type="text"
                                            required={field.required}
                                            className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                            value={values[field.id] || ''}
                                            onChange={e => handleChange(field.id, e.target.value)}
                                            placeholder="Document Number"
                                        />
                                    )}

                                    {/* ASSIGNEE */}
                                    {field.type === 'ASSIGNEE' && (
                                        <select
                                            required={field.required}
                                            className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                            value={values[field.id] || ''}
                                            onChange={e => handleChange(field.id, e.target.value)}
                                        >
                                            <option value="">Select User...</option>
                                            {users.map((u: any) => (
                                                <option key={u.id} value={u.id}>{u.name || u.email}</option>
                                            ))}
                                        </select>
                                    )}

                                    {/* LABELS */}
                                    {field.type === 'LABELS' && (
                                        <select
                                            required={field.required}
                                            className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                            value={values[field.id] || ''}
                                            onChange={e => handleChange(field.id, e.target.value)}
                                        >
                                            <option value="">Select Tag...</option>
                                            {tags.map((t: any) => (
                                                <option key={t.id} value={t.id}>{t.name}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            ))}

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all text-sm disabled:opacity-50"
                                >
                                    {isSaving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            ) : (
                <div className="pt-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold flex items-center gap-2">
                            <BrainCircuit className="text-primary" size={20} />
                            AI Analysis
                        </h3>
                        <button
                            onClick={handleAnalyzeAI}
                            disabled={isAnalyzing}
                            className="px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {isAnalyzing ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
                            {aiData.score ? 'Re-Analyze' : 'Analyze Opportunity'}
                        </button>
                    </div>

                    {/* Score Card */}
                    <div className="bg-card border border-border rounded-xl p-6 flex items-center gap-6">
                        <div className="relative w-24 h-24 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle
                                    cx="48"
                                    cy="48"
                                    r="40"
                                    className="stroke-muted"
                                    strokeWidth="8"
                                    fill="none"
                                />
                                <circle
                                    cx="48"
                                    cy="48"
                                    r="40"
                                    className={cn(
                                        "stroke-primary transition-all duration-1000 ease-out",
                                        !aiData.score && "stroke-none"
                                    )}
                                    strokeWidth="8"
                                    fill="none"
                                    strokeDasharray={251.2}
                                    strokeDashoffset={251.2 - (251.2 * (aiData.score || 0)) / 100}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-2xl font-bold">{aiData.score || 0}</span>
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Score</span>
                            </div>
                        </div>
                        <div className="flex-1">
                            <h4 className="font-medium mb-1">Lead Quality Score</h4>
                            <p className="text-sm text-muted-foreground">
                                AI-calculated probability of closing based on deal value, stage velocity, and engagement metrics.
                            </p>
                        </div>
                    </div>

                    {/* Summary Card */}
                    <div className="bg-muted/30 rounded-xl p-6 border border-border">
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                            <Sparkles size={16} className="text-yellow-500" />
                            Executive Summary
                        </h4>
                        {aiData.summary ? (
                            <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap">
                                {aiData.summary}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground italic">
                                Click "Analyze Opportunity" to generate an AI summary and insights.
                            </p>
                        )}
                    </div>
                </div>
            )}
        </Modal>
    );
}
