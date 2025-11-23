'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/Modal';
import { getStageFields, getOpportunityFieldValues, saveFieldValue } from '@/lib/field-actions';
import { getUsers } from '@/lib/settings-actions';
import { getTags } from '@/lib/tag-actions';
import { Loader2 } from 'lucide-react';

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

                <div className="border-t border-border pt-4">
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
            </div>
        </Modal>
    );
}
