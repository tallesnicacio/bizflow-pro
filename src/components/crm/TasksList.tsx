'use client';

import { useState } from 'react';
import { CheckCircle, Circle, Calendar, User, Plus } from 'lucide-react';
import { completeTask, createTask } from '@/lib/task-actions';
import { Modal } from '@/components/Modal';
import { cn } from '@/lib/utils';

interface TasksListProps {
    tasks: any[];
    userId: string;
    tenantId: string;
}

export function TasksList({ tasks: initialTasks, userId, tenantId }: TasksListProps) {
    const [tasks, setTasks] = useState(initialTasks);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState('');

    async function handleCreateTask(e: React.FormEvent) {
        e.preventDefault();
        setIsLoading(true);
        try {
            const result = await createTask({
                title,
                description,
                dueDate: new Date(dueDate),
                assignedToId: userId,
                tenantId
            });

            if (result.success) {
                setTasks([...tasks, result.task].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()));
                setIsModalOpen(false);
                setTitle('');
                setDescription('');
                setDueDate('');
            } else {
                alert(result.error);
            }
        } catch (error) {
            console.error('Failed to create task', error);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleCompleteTask(taskId: string) {
        try {
            const result = await completeTask(taskId, tenantId);
            if (result.success) {
                setTasks(tasks.map(t => t.id === taskId ? { ...t, status: 'COMPLETED' } : t));
            }
        } catch (error) {
            console.error('Failed to complete task', error);
        }
    }

    const pendingTasks = tasks.filter(t => t.status === 'TODO' || t.status === 'PENDING');
    const completedTasks = tasks.filter(t => t.status === 'COMPLETED' || t.status === 'DONE');

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">My Tasks</h1>
                    <p className="text-muted-foreground">Manage your daily activities and follow-ups.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                    <Plus size={18} />
                    New Task
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Pending Tasks */}
                <div className="space-y-4">
                    <h2 className="font-semibold text-lg flex items-center gap-2">
                        To Do <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">{pendingTasks.length}</span>
                    </h2>
                    {pendingTasks.length === 0 ? (
                        <div className="text-center py-12 border border-dashed border-border rounded-xl text-muted-foreground">
                            <CheckCircle className="mx-auto h-8 w-8 opacity-20 mb-2" />
                            <p>All caught up!</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {pendingTasks.map((task) => (
                                <div key={task.id} className="bg-card border border-border rounded-xl p-4 hover:shadow-sm transition-shadow group">
                                    <div className="flex items-start gap-3">
                                        <button
                                            onClick={() => handleCompleteTask(task.id)}
                                            className="mt-1 text-muted-foreground hover:text-emerald-500 transition-colors"
                                        >
                                            <Circle size={20} />
                                        </button>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-medium text-foreground truncate">{task.title}</h3>
                                            {task.description && <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{task.description}</p>}

                                            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                                                <div className={cn(
                                                    "flex items-center gap-1",
                                                    new Date(task.dueDate) < new Date() ? "text-red-500 font-medium" : ""
                                                )}>
                                                    <Calendar size={14} />
                                                    {new Date(task.dueDate).toLocaleDateString()}
                                                </div>
                                                {task.contact && (
                                                    <div className="flex items-center gap-1">
                                                        <User size={14} />
                                                        {task.contact.name}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Completed Tasks */}
                <div className="space-y-4">
                    <h2 className="font-semibold text-lg text-muted-foreground flex items-center gap-2">
                        Completed <span className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full">{completedTasks.length}</span>
                    </h2>
                    <div className="space-y-3 opacity-60">
                        {completedTasks.map((task) => (
                            <div key={task.id} className="bg-muted/30 border border-border rounded-xl p-4">
                                <div className="flex items-start gap-3">
                                    <div className="mt-1 text-emerald-500">
                                        <CheckCircle size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-foreground line-through decoration-muted-foreground/50">{task.title}</h3>
                                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <Calendar size={14} />
                                                {new Date(task.dueDate).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Create New Task"
            >
                <form onSubmit={handleCreateTask} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Title</label>
                        <input
                            required
                            className="w-full bg-background border border-input rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="e.g. Follow up with client"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <textarea
                            className="w-full bg-background border border-input rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring min-h-[100px]"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Add details..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Due Date</label>
                        <input
                            type="date"
                            required
                            className="w-full bg-background border border-input rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                            value={dueDate}
                            onChange={e => setDueDate(e.target.value)}
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 border border-border rounded-lg hover:bg-accent"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
                        >
                            {isLoading ? 'Creating...' : 'Create Task'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
