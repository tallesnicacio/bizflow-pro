'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getForm, getFormSubmissions, deleteFormSubmission } from '@/lib/form-actions';

export default function FormSubmissionsPage() {
    const router = useRouter();
    const params = useParams();
    const formId = params?.formId as string;

    const [form, setForm] = useState<any>(null);
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSubmission, setSelectedSubmission] = useState<any>(null);

    useEffect(() => {
        if (formId) {
            loadData();
        }
    }, [formId]);

    async function loadData() {
        try {
            const [formData, submissionsData] = await Promise.all([
                getForm(formId),
                getFormSubmissions(formId),
            ]);
            setForm(formData);
            setSubmissions(submissionsData);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(submissionId: string) {
        if (!confirm('Tem certeza que deseja excluir esta submissão?')) return;

        try {
            await deleteFormSubmission(submissionId);
            await loadData();
            if (selectedSubmission?.id === submissionId) {
                setSelectedSubmission(null);
            }
        } catch (error) {
            console.error('Failed to delete submission:', error);
        }
    }

    function formatDate(date: string) {
        return new Date(date).toLocaleString('pt-BR');
    }

    function getFieldLabel(fieldId: string) {
        const field = form?.fields?.find((f: any) => f.id === fieldId);
        return field?.label || fieldId;
    }

    if (loading) {
        return (
            <div className="p-8">
                <div className="text-center">Carregando submissões...</div>
            </div>
        );
    }

    if (!form) {
        return (
            <div className="p-8">
                <div className="text-center">Formulário não encontrado</div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <button
                        onClick={() => router.push('/forms')}
                        className="text-muted-foreground hover:text-foreground mb-2 text-sm"
                    >
                        ← Voltar para Formulários
                    </button>
                    <h1 className="text-3xl font-bold">{form.name}</h1>
                    <p className="text-muted-foreground mt-2">
                        {submissions.length} submissões
                    </p>
                </div>
                <button
                    onClick={() => router.push(`/forms/${formId}`)}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium"
                >
                    Editar Formulário
                </button>
            </div>

            {submissions.length === 0 ? (
                <div className="text-center py-12 bg-muted/30 rounded-lg border-2 border-dashed border-border">
                    <p className="text-muted-foreground">Nenhuma submissão ainda</p>
                </div>
            ) : (
                <div className="grid grid-cols-12 gap-6">
                    {/* Submissions List */}
                    <div className="col-span-5">
                        <div className="bg-card border border-border rounded-lg overflow-hidden">
                            <div className="p-4 border-b border-border bg-muted/30">
                                <h3 className="font-semibold">Submissões</h3>
                            </div>
                            <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
                                {submissions.map((submission) => {
                                    const data = submission.data as Record<string, any>;
                                    const firstValue = Object.values(data)[0];
                                    return (
                                        <div
                                            key={submission.id}
                                            onClick={() => setSelectedSubmission(submission)}
                                            className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${selectedSubmission?.id === submission.id ? 'bg-muted' : ''
                                                }`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium truncate">
                                                        {String(firstValue || 'Sem dados')}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {formatDate(submission.createdAt)}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(submission.id);
                                                    }}
                                                    className="text-destructive hover:text-destructive/80 ml-2"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Submission Details */}
                    <div className="col-span-7">
                        {selectedSubmission ? (
                            <div className="bg-card border border-border rounded-lg p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="font-semibold">Detalhes da Submissão</h3>
                                    <span className="text-sm text-muted-foreground">
                                        {formatDate(selectedSubmission.createdAt)}
                                    </span>
                                </div>
                                <div className="space-y-4">
                                    {Object.entries(selectedSubmission.data as Record<string, any>).map(
                                        ([key, value]) => (
                                            <div key={key} className="border-b border-border pb-4">
                                                <label className="block text-sm font-medium text-muted-foreground mb-1">
                                                    {getFieldLabel(key)}
                                                </label>
                                                <p className="text-foreground">
                                                    {Array.isArray(value) ? value.join(', ') : String(value || '-')}
                                                </p>
                                            </div>
                                        )
                                    )}
                                </div>
                                {selectedSubmission.contactId && (
                                    <div className="mt-6 pt-4 border-t border-border">
                                        <p className="text-sm text-muted-foreground">
                                            Contato criado/atualizado:{' '}
                                            <button
                                                onClick={() => router.push(`/crm?contact=${selectedSubmission.contactId}`)}
                                                className="text-primary hover:underline"
                                            >
                                                Ver no CRM
                                            </button>
                                        </p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-card border border-border rounded-lg p-6 text-center text-muted-foreground">
                                Selecione uma submissão para ver os detalhes
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
