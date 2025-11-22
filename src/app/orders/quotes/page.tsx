'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, FileText, Loader2, Printer } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { createQuote, getQuotes } from '@/lib/quote-actions';
import { getContacts } from '@/lib/crm-actions';
import { getProducts } from '@/lib/inventory-actions';
import { cn } from '@/lib/utils';

const TENANT_ID = 'demo-tenant-1';

export default function QuotesPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [quotes, setQuotes] = useState<any[]>([]);
    const [contacts, setContacts] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [selectedContact, setSelectedContact] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [validUntil, setValidUntil] = useState('');
    const [quoteItems, setQuoteItems] = useState<{ productId: string; description: string; quantity: number; unitPrice: number }[]>([]);

    // Item Form
    const [currentItem, setCurrentItem] = useState({ productId: '', description: '', quantity: 1, unitPrice: 0 });

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setIsLoading(true);
        try {
            const [quotesData, contactsData, productsData] = await Promise.all([
                getQuotes(TENANT_ID),
                getContacts(TENANT_ID),
                getProducts(TENANT_ID)
            ]);
            setQuotes(quotesData);
            setContacts(contactsData);
            setProducts(productsData);
        } catch (error) {
            console.error('Failed to load data', error);
        } finally {
            setIsLoading(false);
        }
    }

    function addItem() {
        if (!currentItem.description || currentItem.quantity <= 0) return;
        setQuoteItems([...quoteItems, currentItem]);
        setCurrentItem({ productId: '', description: '', quantity: 1, unitPrice: 0 });
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setIsLoading(true);
        try {
            await createQuote({
                customerName: selectedContact ? undefined : customerName,
                contactId: selectedContact || undefined,
                validUntil: validUntil ? new Date(validUntil) : undefined,
                items: quoteItems,
                tenantId: TENANT_ID,
            });
            setIsModalOpen(false);
            setCustomerName('');
            setSelectedContact('');
            setValidUntil('');
            setQuoteItems([]);
            await loadData();
        } catch (error) {
            console.error('Failed to create quote', error);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="space-y-8">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-bold text-foreground mb-2">Orçamentos</h1>
                    <p className="text-muted-foreground">Gerencie propostas comerciais</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 font-medium"
                >
                    <Plus size={20} />
                    Novo Orçamento
                </button>
            </header>

            <div className="glass-panel overflow-hidden">
                {isLoading && quotes.length === 0 ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="animate-spin text-primary" size={32} />
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border bg-muted/50">
                                <th className="text-left p-4 font-medium text-muted-foreground">Número</th>
                                <th className="text-left p-4 font-medium text-muted-foreground">Cliente</th>
                                <th className="text-left p-4 font-medium text-muted-foreground">Data</th>
                                <th className="text-left p-4 font-medium text-muted-foreground">Validade</th>
                                <th className="text-left p-4 font-medium text-muted-foreground">Total</th>
                                <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                                <th className="text-left p-4 font-medium text-muted-foreground"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {quotes.map((quote) => (
                                <tr key={quote.id} className="border-b border-border hover:bg-accent/50 transition-colors">
                                    <td className="p-4 font-mono font-medium">{quote.number}</td>
                                    <td className="p-4">{quote.customerName || quote.contact?.name}</td>
                                    <td className="p-4 text-sm text-muted-foreground">
                                        {new Date(quote.createdAt).toLocaleDateString('pt-BR')}
                                    </td>
                                    <td className="p-4 text-sm text-muted-foreground">
                                        {quote.validUntil ? new Date(quote.validUntil).toLocaleDateString('pt-BR') : '-'}
                                    </td>
                                    <td className="p-4 font-semibold">R$ {Number(quote.total).toFixed(2)}</td>
                                    <td className="p-4">
                                        <span className="px-2 py-1 bg-muted rounded text-xs font-medium">
                                            {quote.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button className="p-2 hover:bg-accent rounded-lg transition-colors" title="Imprimir PDF">
                                            <Printer size={18} className="text-muted-foreground" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {quotes.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="p-12 text-center text-muted-foreground">
                                        Nenhum orçamento encontrado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Novo Orçamento"
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Cliente (CRM)</label>
                            <select
                                className="w-full bg-background border border-input rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                                value={selectedContact}
                                onChange={e => {
                                    setSelectedContact(e.target.value);
                                    if (e.target.value) setCustomerName('');
                                }}
                            >
                                <option value="">Selecione um contato...</option>
                                {contacts.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Nome (Avulso)</label>
                            <input
                                required={!selectedContact}
                                disabled={!!selectedContact}
                                className="w-full bg-background border border-input rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring transition-all disabled:opacity-50"
                                value={customerName}
                                onChange={e => setCustomerName(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Validade</label>
                        <input
                            type="date"
                            className="w-full bg-background border border-input rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                            value={validUntil}
                            onChange={e => setValidUntil(e.target.value)}
                        />
                    </div>

                    <div className="p-4 bg-muted/30 rounded-lg space-y-4 border border-border">
                        <h3 className="font-semibold text-sm">Itens do Orçamento</h3>
                        <div className="grid grid-cols-12 gap-2">
                            <div className="col-span-4">
                                <select
                                    className="w-full bg-background border border-input rounded-lg px-2 py-1 text-sm"
                                    value={currentItem.productId}
                                    onChange={e => {
                                        const product = products.find(p => p.id === e.target.value);
                                        setCurrentItem({
                                            ...currentItem,
                                            productId: e.target.value,
                                            description: product ? product.name : '',
                                            unitPrice: product ? Number(product.price) : 0
                                        });
                                    }}
                                >
                                    <option value="">Produto...</option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-span-4">
                                <input
                                    className="w-full bg-background border border-input rounded-lg px-2 py-1 text-sm"
                                    placeholder="Descrição"
                                    value={currentItem.description}
                                    onChange={e => setCurrentItem({ ...currentItem, description: e.target.value })}
                                />
                            </div>
                            <div className="col-span-2">
                                <input
                                    type="number"
                                    className="w-full bg-background border border-input rounded-lg px-2 py-1 text-sm"
                                    placeholder="Qtd"
                                    value={currentItem.quantity}
                                    onChange={e => setCurrentItem({ ...currentItem, quantity: Number(e.target.value) })}
                                />
                            </div>
                            <div className="col-span-2">
                                <button
                                    type="button"
                                    onClick={addItem}
                                    className="w-full bg-primary text-primary-foreground rounded-lg py-1 text-sm hover:bg-primary/90"
                                >
                                    Add
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            {quoteItems.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center text-sm p-2 bg-background rounded border border-border">
                                    <span>{item.description} (x{item.quantity})</span>
                                    <span className="font-medium">R$ {(item.quantity * item.unitPrice).toFixed(2)}</span>
                                </div>
                            ))}
                            {quoteItems.length > 0 && (
                                <div className="flex justify-between items-center pt-2 border-t border-border font-bold">
                                    <span>Total</span>
                                    <span>R$ {quoteItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0).toFixed(2)}</span>
                                </div>
                            )}
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
                            disabled={isLoading || quoteItems.length === 0}
                            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50"
                        >
                            {isLoading ? 'Salvando...' : 'Salvar Orçamento'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
