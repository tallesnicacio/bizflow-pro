'use client';

import { Plus, Search, Filter, Loader2, Users, Phone, Mail, MoreVertical } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Modal } from '@/components/Modal';
import { createContact, getContacts } from '@/lib/crm-actions';
import { cn } from '@/lib/utils';

const TENANT_ID = 'demo-tenant-1';

export default function CRMPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [contacts, setContacts] = useState<any[]>([]);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        stage: 'LEAD'
    });

    useEffect(() => {
        loadContacts();
    }, []);

    async function loadContacts() {
        setIsLoading(true);
        try {
            const data = await getContacts(TENANT_ID);
            setContacts(data);
        } catch (error) {
            console.error('Failed to load contacts', error);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setIsLoading(true);
        try {
            await createContact({
                ...formData,
                tenantId: TENANT_ID,
            });
            setIsModalOpen(false);
            setFormData({ name: '', email: '', phone: '', stage: 'LEAD' });
            await loadContacts();
        } catch (error) {
            console.error('Failed to create contact', error);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-bold text-foreground mb-2">CRM</h1>
                    <p className="text-muted-foreground">Gerencie seus contatos e clientes</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 font-medium"
                >
                    <Plus size={20} />
                    Novo Contato
                </button>
            </header>

            {/* Search & Filters */}
            <div className="flex gap-4 items-center glass-panel p-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar contatos..."
                        className="w-full bg-background border border-input rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                    />
                </div>
                <button className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-lg hover:bg-accent transition-colors">
                    <Filter size={20} />
                    Filtros
                </button>
            </div>

            {/* Contacts Table */}
            <div className="glass-panel overflow-hidden">
                {isLoading && contacts.length === 0 ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="animate-spin text-primary" size={32} />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border bg-muted/50">
                                    <th className="text-left p-4 font-medium text-muted-foreground">Nome</th>
                                    <th className="text-left p-4 font-medium text-muted-foreground">Contato</th>
                                    <th className="text-left p-4 font-medium text-muted-foreground">Estágio</th>
                                    <th className="text-left p-4 font-medium text-muted-foreground">Pedidos</th>
                                    <th className="text-left p-4 font-medium text-muted-foreground"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {contacts.map((contact) => (
                                    <tr key={contact.id} className="border-b border-border hover:bg-accent/50 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold">
                                                    {contact.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-medium">{contact.name}</p>
                                                    <p className="text-xs text-muted-foreground">Adicionado em {new Date(contact.createdAt).toLocaleDateString('pt-BR')}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Mail size={14} className="text-muted-foreground" />
                                                    <span>{contact.email}</span>
                                                </div>
                                                {contact.phone && (
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Phone size={14} className="text-muted-foreground" />
                                                        <span>{contact.phone}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={cn(
                                                "px-3 py-1 rounded-full text-xs font-medium",
                                                contact.stage === 'CUSTOMER' ? "bg-emerald-500/20 text-emerald-400" :
                                                    contact.stage === 'PROSPECT' ? "bg-amber-500/20 text-amber-400" :
                                                        "bg-blue-500/20 text-blue-400"
                                            )}>
                                                {contact.stage === 'CUSTOMER' ? 'Cliente' : contact.stage === 'PROSPECT' ? 'Prospecto' : 'Lead'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold">{contact._count?.orders || 0}</span>
                                                <span className="text-xs text-muted-foreground">pedidos</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button className="p-2 hover:bg-accent rounded-lg transition-colors">
                                                <MoreVertical size={18} className="text-muted-foreground" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {contacts.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-12 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                                                    <Users size={32} className="text-muted-foreground" />
                                                </div>
                                                <p className="text-muted-foreground">Nenhum contato encontrado.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create Contact Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Novo Contato"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Nome Completo</label>
                        <input
                            required
                            className="w-full bg-background border border-input rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Ex: Maria Oliveira"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Email</label>
                        <input
                            required
                            type="email"
                            className="w-full bg-background border border-input rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            placeholder="maria@exemplo.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Telefone</label>
                        <input
                            className="w-full bg-background border border-input rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="(11) 99999-9999"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Estágio</label>
                        <select
                            className="w-full bg-background border border-input rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                            value={formData.stage}
                            onChange={e => setFormData({ ...formData, stage: e.target.value })}
                        >
                            <option value="LEAD">Lead</option>
                            <option value="PROSPECT">Prospecto</option>
                            <option value="CUSTOMER">Cliente</option>
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
                            {isLoading ? 'Salvando...' : 'Salvar Contato'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
