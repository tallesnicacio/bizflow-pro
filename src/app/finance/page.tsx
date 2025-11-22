'use client';

import { Plus, Search, Filter, Loader2, DollarSign, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Modal } from '@/components/Modal';
import { createTransaction, getTransactions, getFinancialSummary } from '@/lib/finance-actions';
import { cn } from '@/lib/utils';

const TENANT_ID = 'demo-tenant-1';

export default function FinancePage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 });

    // Form State
    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        type: 'INCOME' as 'INCOME' | 'EXPENSE',
        category: '',
        date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setIsLoading(true);
        try {
            const [transactionsData, summaryData] = await Promise.all([
                getTransactions(TENANT_ID),
                getFinancialSummary(TENANT_ID)
            ]);
            setTransactions(transactionsData);
            setSummary(summaryData);
        } catch (error) {
            console.error('Failed to load data', error);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setIsLoading(true);
        try {
            await createTransaction({
                description: formData.description,
                amount: Number(formData.amount),
                type: formData.type,
                category: formData.category,
                date: new Date(formData.date),
                tenantId: TENANT_ID,
            });
            setIsModalOpen(false);
            setFormData({
                description: '',
                amount: '',
                type: 'INCOME',
                category: '',
                date: new Date().toISOString().split('T')[0]
            });
            await loadData();
        } catch (error) {
            console.error('Failed to create transaction', error);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-bold text-foreground mb-2">Financeiro</h1>
                    <p className="text-muted-foreground">Controle suas receitas e despesas</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 font-medium"
                >
                    <Plus size={20} />
                    Nova Transação
                </button>
            </header>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-panel p-6 flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                        <div className="p-3 bg-emerald-500/10 rounded-xl">
                            <TrendingUp className="text-emerald-500" size={24} />
                        </div>
                        <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 text-xs font-medium rounded-full flex items-center gap-1">
                            <ArrowUpRight size={12} />
                            Receitas
                        </span>
                    </div>
                    <div>
                        <p className="text-muted-foreground text-sm font-medium">Total Receitas</p>
                        <h3 className="text-3xl font-bold mt-1">R$ {summary.income.toFixed(2)}</h3>
                    </div>
                </div>

                <div className="glass-panel p-6 flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                        <div className="p-3 bg-red-500/10 rounded-xl">
                            <TrendingDown className="text-red-500" size={24} />
                        </div>
                        <span className="px-2 py-1 bg-red-500/10 text-red-500 text-xs font-medium rounded-full flex items-center gap-1">
                            <ArrowDownRight size={12} />
                            Despesas
                        </span>
                    </div>
                    <div>
                        <p className="text-muted-foreground text-sm font-medium">Total Despesas</p>
                        <h3 className="text-3xl font-bold mt-1">R$ {summary.expense.toFixed(2)}</h3>
                    </div>
                </div>

                <div className="glass-panel p-6 flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                        <div className="p-3 bg-blue-500/10 rounded-xl">
                            <DollarSign className="text-blue-500" size={24} />
                        </div>
                        <span className="px-2 py-1 bg-blue-500/10 text-blue-500 text-xs font-medium rounded-full">
                            Saldo Atual
                        </span>
                    </div>
                    <div>
                        <p className="text-muted-foreground text-sm font-medium">Balanço Total</p>
                        <h3 className={cn("text-3xl font-bold mt-1", summary.balance >= 0 ? "text-emerald-500" : "text-red-500")}>
                            R$ {summary.balance.toFixed(2)}
                        </h3>
                    </div>
                </div>
            </div>

            {/* Transactions List */}
            <div className="space-y-4">
                <div className="flex gap-4 items-center justify-between">
                    <h2 className="text-xl font-bold">Transações Recentes</h2>
                    <div className="flex gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                            <input
                                type="text"
                                placeholder="Buscar..."
                                className="bg-background border border-input rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all w-64"
                            />
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors text-sm font-medium">
                            <Filter size={16} />
                            Filtrar
                        </button>
                    </div>
                </div>

                <div className="glass-panel overflow-hidden">
                    {isLoading && transactions.length === 0 ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="animate-spin text-primary" size={32} />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-border bg-muted/50">
                                        <th className="text-left p-4 font-medium text-muted-foreground">Descrição</th>
                                        <th className="text-left p-4 font-medium text-muted-foreground">Categoria</th>
                                        <th className="text-left p-4 font-medium text-muted-foreground">Data</th>
                                        <th className="text-right p-4 font-medium text-muted-foreground">Valor</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.map((transaction) => (
                                        <tr key={transaction.id} className="border-b border-border hover:bg-accent/50 transition-colors">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "w-8 h-8 rounded-lg flex items-center justify-center",
                                                        transaction.type === 'INCOME' ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                                                    )}>
                                                        {transaction.type === 'INCOME' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                                                    </div>
                                                    <span className="font-medium">{transaction.description}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className="px-2 py-1 bg-muted rounded text-xs font-medium">
                                                    {transaction.category}
                                                </span>
                                            </td>
                                            <td className="p-4 text-sm text-muted-foreground">
                                                {new Date(transaction.date).toLocaleDateString('pt-BR')}
                                            </td>
                                            <td className={cn(
                                                "p-4 text-right font-semibold",
                                                transaction.type === 'INCOME' ? "text-emerald-500" : "text-red-500"
                                            )}>
                                                {transaction.type === 'INCOME' ? '+' : '-'} R$ {Number(transaction.amount).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                    {transactions.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="p-12 text-center">
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                                                        <DollarSign size={32} className="text-muted-foreground" />
                                                    </div>
                                                    <p className="text-muted-foreground">Nenhuma transação encontrada.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Transaction Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Nova Transação"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Descrição</label>
                        <input
                            required
                            className="w-full bg-background border border-input rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Ex: Venda de Mármore"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Valor (R$)</label>
                            <input
                                required
                                type="number"
                                step="0.01"
                                className="w-full bg-background border border-input rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                                value={formData.amount}
                                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                placeholder="0.00"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Tipo</label>
                            <select
                                className="w-full bg-background border border-input rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value as 'INCOME' | 'EXPENSE' })}
                            >
                                <option value="INCOME">Receita</option>
                                <option value="EXPENSE">Despesa</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Categoria</label>
                            <input
                                required
                                className="w-full bg-background border border-input rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                placeholder="Ex: Vendas"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Data</label>
                            <input
                                required
                                type="date"
                                className="w-full bg-background border border-input rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                                value={formData.date}
                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                            />
                        </div>
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
                            {isLoading ? 'Salvando...' : 'Salvar Transação'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
