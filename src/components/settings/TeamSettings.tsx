'use client';

import { useState } from 'react';
import { Plus, Trash2, User, Shield, Mail } from 'lucide-react';
import { createUser, deleteUser } from '@/lib/settings-actions';
import { Modal } from '@/components/Modal';

interface TeamSettingsProps {
    users: any[];
    tenantId: string;
}

export function TeamSettings({ users: initialUsers, tenantId }: TeamSettingsProps) {
    const [users, setUsers] = useState(initialUsers);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('USER');

    async function handleAddUser(e: React.FormEvent) {
        e.preventDefault();
        setIsLoading(true);
        try {
            const result = await createUser({ name, email, role, tenantId });
            if (result.success) {
                setUsers([result.user, ...users]);
                setIsModalOpen(false);
                setName('');
                setEmail('');
                setRole('USER');
            } else {
                alert(result.error);
            }
        } catch (error) {
            console.error('Failed to add user', error);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleDeleteUser(userId: string) {
        if (!confirm('Tem certeza que deseja remover este usuário?')) return;

        try {
            const result = await deleteUser(userId, tenantId);
            if (result.success) {
                setUsers(users.filter(u => u.id !== userId));
            } else {
                alert(result.error);
            }
        } catch (error) {
            console.error('Failed to delete user', error);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-medium">Membros da Equipe</h3>
                    <p className="text-sm text-muted-foreground">Gerencie quem tem acesso ao sistema.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                    <Plus size={18} />
                    Adicionar Membro
                </button>
            </div>

            <div className="glass-panel overflow-hidden">
                <table className="w-full">
                    <thead className="bg-muted/50">
                        <tr>
                            <th className="text-left p-4 font-medium text-muted-foreground">Usuário</th>
                            <th className="text-left p-4 font-medium text-muted-foreground">Função</th>
                            <th className="text-left p-4 font-medium text-muted-foreground">Data de Entrada</th>
                            <th className="text-right p-4 font-medium text-muted-foreground">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id} className="border-b border-border last:border-0 hover:bg-accent/50 transition-colors">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                                            {user.name?.[0] || user.email[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-medium">{user.name || 'Sem nome'}</p>
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <Mail size={12} />
                                                {user.email}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'ADMIN'
                                            ? 'bg-purple-500/10 text-purple-600'
                                            : 'bg-blue-500/10 text-blue-600'
                                        }`}>
                                        <Shield size={12} />
                                        {user.role}
                                    </span>
                                </td>
                                <td className="p-4 text-sm text-muted-foreground">
                                    {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                                </td>
                                <td className="p-4 text-right">
                                    <button
                                        onClick={() => handleDeleteUser(user.id)}
                                        className="p-2 hover:bg-red-50 text-muted-foreground hover:text-red-600 rounded-lg transition-colors"
                                        title="Remover usuário"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Adicionar Novo Membro"
            >
                <form onSubmit={handleAddUser} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Nome Completo</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                            <input
                                required
                                className="w-full bg-background border border-input rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="Ex: Maria Silva"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                            <input
                                type="email"
                                required
                                className="w-full bg-background border border-input rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="Ex: maria@empresa.com"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Função</label>
                        <select
                            className="w-full bg-background border border-input rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                            value={role}
                            onChange={e => setRole(e.target.value)}
                        >
                            <option value="USER">Usuário (Acesso Padrão)</option>
                            <option value="ADMIN">Administrador (Acesso Total)</option>
                            <option value="MANAGER">Gerente (Acesso Estendido)</option>
                        </select>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 border border-border rounded-lg hover:bg-accent"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
                        >
                            {isLoading ? 'Adicionando...' : 'Adicionar Membro'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
