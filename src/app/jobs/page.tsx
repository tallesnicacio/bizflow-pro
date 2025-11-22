'use client';

import { useState, useEffect } from 'react';
import { Plus, Hammer, CheckCircle2, Circle, Loader2, Clock } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { getJobs, createJob, updateJobStage } from '@/lib/job-actions';
import { cn } from '@/lib/utils';

const TENANT_ID = 'demo-tenant-1';

export default function JobsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [jobs, setJobs] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [jobName, setJobName] = useState('');

    useEffect(() => {
        loadJobs();
    }, []);

    async function loadJobs() {
        setIsLoading(true);
        try {
            const data = await getJobs(TENANT_ID);
            setJobs(data);
        } catch (error) {
            console.error('Failed to load jobs', error);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleCreateJob(e: React.FormEvent) {
        e.preventDefault();
        setIsLoading(true);
        try {
            await createJob({
                name: jobName,
                tenantId: TENANT_ID,
            });
            setIsModalOpen(false);
            setJobName('');
            await loadJobs();
        } catch (error) {
            console.error('Failed to create job', error);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleStageUpdate(stageId: string, currentStatus: string) {
        const newStatus = currentStatus === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
        try {
            // Optimistic update
            const updatedJobs = jobs.map(job => ({
                ...job,
                stages: job.stages.map((s: any) =>
                    s.id === stageId ? { ...s, status: newStatus } : s
                )
            }));
            setJobs(updatedJobs);

            await updateJobStage(stageId, newStatus);
            await loadJobs(); // Sync with server logic (job status updates)
        } catch (error) {
            console.error('Failed to update stage', error);
            await loadJobs(); // Revert
        }
    }

    return (
        <div className="space-y-8">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-bold text-foreground mb-2">Produção</h1>
                    <p className="text-muted-foreground">Gerencie ordens de serviço e fabricação</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 font-medium"
                >
                    <Plus size={20} />
                    Nova Ordem de Serviço
                </button>
            </header>

            <div className="grid grid-cols-1 gap-6">
                {isLoading && jobs.length === 0 ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="animate-spin text-primary" size={32} />
                    </div>
                ) : jobs.length === 0 ? (
                    <div className="glass-panel p-12 flex flex-col items-center justify-center text-center">
                        <Hammer size={48} className="text-muted-foreground mb-4 opacity-20" />
                        <h3 className="text-xl font-semibold mb-2">Nenhuma produção em andamento</h3>
                        <p className="text-muted-foreground">Crie uma nova ordem de serviço para começar a rastrear a fabricação.</p>
                    </div>
                ) : (
                    jobs.map((job) => (
                        <div key={job.id} className="glass-panel p-6 transition-all hover:shadow-md border border-border/50">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="text-xl font-bold">{job.name}</h3>
                                        <span className={cn(
                                            "px-2 py-0.5 rounded-full text-xs font-medium border",
                                            job.status === 'COMPLETED' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                                                job.status === 'IN_PROGRESS' ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                                                    "bg-muted text-muted-foreground border-border"
                                        )}>
                                            {job.status === 'COMPLETED' ? 'Concluído' : job.status === 'IN_PROGRESS' ? 'Em Andamento' : 'Pendente'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Iniciado em: {new Date(job.createdAt).toLocaleDateString('pt-BR')}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-medium text-muted-foreground">Progresso</p>
                                    <p className="text-2xl font-bold text-primary">
                                        {Math.round((job.stages.filter((s: any) => s.status === 'COMPLETED').length / job.stages.length) * 100)}%
                                    </p>
                                </div>
                            </div>

                            <div className="relative">
                                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-muted -translate-y-1/2 z-0" />
                                <div className="relative z-10 flex justify-between">
                                    {job.stages.map((stage: any, idx: number) => (
                                        <div key={stage.id} className="flex flex-col items-center gap-2 group">
                                            <button
                                                onClick={() => handleStageUpdate(stage.id, stage.status)}
                                                className={cn(
                                                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all bg-background",
                                                    stage.status === 'COMPLETED'
                                                        ? "border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                                                        : "border-muted-foreground/30 text-muted-foreground hover:border-primary/50"
                                                )}
                                            >
                                                {stage.status === 'COMPLETED' ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                                            </button>
                                            <span className={cn(
                                                "text-xs font-medium transition-colors",
                                                stage.status === 'COMPLETED' ? "text-primary" : "text-muted-foreground"
                                            )}>
                                                {stage.name.split('(')[0]}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Nova Ordem de Serviço"
            >
                <form onSubmit={handleCreateJob} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Nome do Projeto / Cliente</label>
                        <input
                            required
                            className="w-full bg-background border border-input rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                            value={jobName}
                            onChange={e => setJobName(e.target.value)}
                            placeholder="Ex: Cozinha Sr. João"
                        />
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
                            {isLoading ? 'Criando...' : 'Criar OS'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
