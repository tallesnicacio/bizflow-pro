'use client';

import { Plus, Search, Filter, Loader2, ShoppingCart, FileText, CreditCard } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Modal } from '@/components/Modal';
import { createOrder, getOrders } from '@/lib/order-actions';
import { createCheckoutSession } from '@/lib/payment-actions';
import { getProducts } from '@/lib/inventory-actions';
import { getContacts } from '@/lib/crm-actions';
import { generateOrderPDF } from '@/lib/pdf-service';
import { cn } from '@/lib/utils';

const TENANT_ID = 'demo-tenant-1';

export default function OrdersPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [orders, setOrders] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [contacts, setContacts] = useState<any[]>([]);

    // Form State
    const [customerName, setCustomerName] = useState('');
    const [selectedContact, setSelectedContact] = useState('');
    const [selectedProduct, setSelectedProduct] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [orderItems, setOrderItems] = useState<{ productId: string; quantity: number; productName: string; price: number }[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setIsLoading(true);
        try {
            const [ordersData, productsData, contactsData] = await Promise.all([
                getOrders(TENANT_ID),
                getProducts(TENANT_ID),
                getContacts(TENANT_ID)
            ]);
            setOrders(ordersData);
            setProducts(productsData);
            setContacts(contactsData);
        } catch (error) {
            console.error('Failed to load data', error);
        } finally {
            setIsLoading(false);
        }
    }

    function addItemToOrder() {
        if (!selectedProduct || quantity <= 0) return;

        const product = products.find(p => p.id === selectedProduct);
        if (!product) return;

        setOrderItems([...orderItems, {
            productId: product.id,
            quantity: Number(quantity),
            productName: product.name,
            price: Number(product.price)
        }]);

        setSelectedProduct('');
        setQuantity(1);
    }

    function removeItemFromOrder(index: number) {
        const newItems = [...orderItems];
        newItems.splice(index, 1);
        setOrderItems(newItems);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (orderItems.length === 0) return;

        setIsLoading(true);
        try {
            await createOrder({
                customerName: selectedContact ? undefined : customerName,
                contactId: selectedContact || undefined,
                items: orderItems.map(item => ({ productId: item.productId, quantity: item.quantity })),
                tenantId: TENANT_ID,
            });
            setIsModalOpen(false);
            setCustomerName('');
            setSelectedContact('');
            setOrderItems([]);
            await loadData();
        } catch (error) {
            console.error('Failed to create order', error);
            alert('Failed to create order. Please check stock levels.');
        } finally {
            setIsLoading(false);
        }
    }

    const calculateTotal = () => {
        return orderItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-bold text-foreground mb-2">Vendas</h1>
                    <p className="text-muted-foreground">Gerencie pedidos e vendas</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 font-medium"
                >
                    <Plus size={20} />
                    Novo Pedido
                </button>
            </header>

            {/* Search & Filters */}
            <div className="flex gap-4 items-center glass-panel p-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar pedidos..."
                        className="w-full bg-background border border-input rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                    />
                </div>
                <button className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-lg hover:bg-accent transition-colors">
                    <Filter size={20} />
                    Filtros
                </button>
            </div>

            {/* Orders Table */}
            <div className="glass-panel overflow-hidden">
                {isLoading && orders.length === 0 ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="animate-spin text-primary" size={32} />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border bg-muted/50">
                                    <th className="text-left p-4 font-medium text-muted-foreground">ID do Pedido</th>
                                    <th className="text-left p-4 font-medium text-muted-foreground">Cliente</th>
                                    <th className="text-left p-4 font-medium text-muted-foreground">Data</th>
                                    <th className="text-left p-4 font-medium text-muted-foreground">Total</th>
                                    <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                                    <th className="text-left p-4 font-medium text-muted-foreground">Itens</th>
                                    <th className="text-left p-4 font-medium text-muted-foreground"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order) => (
                                    <tr key={order.id} className="border-b border-border hover:bg-accent/50 transition-colors">
                                        <td className="p-4">
                                            <code className="px-2 py-1 bg-muted rounded text-sm font-mono text-primary">#{order.id.slice(-6).toUpperCase()}</code>
                                        </td>
                                        <td className="p-4 font-medium">{order.customerName || 'Cliente Balcão'}</td>
                                        <td className="p-4 text-muted-foreground">
                                            {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                                        </td>
                                        <td className="p-4 font-semibold">R$ {Number(order.total).toFixed(2)}</td>
                                        <td className="p-4">
                                            <span className={cn(
                                                "px-3 py-1 rounded-full text-xs font-medium",
                                                order.status === 'COMPLETED' ? "bg-emerald-500/20 text-emerald-400" :
                                                    order.status === 'PENDING' ? "bg-amber-500/20 text-amber-400" :
                                                        "bg-red-500/20 text-red-400"
                                            )}>
                                                {order.status === 'PENDING' ? 'Pendente' : order.status === 'COMPLETED' ? 'Concluído' : 'Cancelado'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-muted-foreground">
                                            {order.items.length} itens
                                        </td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => generateOrderPDF(order)}
                                                className="p-2 hover:bg-accent rounded-lg transition-colors text-muted-foreground hover:text-primary"
                                                title="Baixar PDF"
                                            >
                                                <FileText size={18} />
                                            </button>
                                            {order.status === 'PENDING' && (
                                                <button
                                                    onClick={() => createCheckoutSession(order.id)}
                                                    className="p-2 hover:bg-accent rounded-lg transition-colors text-muted-foreground hover:text-green-600"
                                                    title="Pagar Agora"
                                                >
                                                    <CreditCard size={18} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {orders.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-12 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                                                    <ShoppingCart size={32} className="text-muted-foreground" />
                                                </div>
                                                <p className="text-muted-foreground">Nenhum pedido encontrado.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create Order Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Novo Pedido"
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
                            <label className="block text-sm font-medium mb-2">Nome do Cliente (Avulso)</label>
                            <input
                                required={!selectedContact}
                                disabled={!!selectedContact}
                                className="w-full bg-background border border-input rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring transition-all disabled:opacity-50"
                                value={customerName}
                                onChange={e => setCustomerName(e.target.value)}
                                placeholder="Ex: João da Silva"
                            />
                        </div>
                    </div>

                    <div className="p-4 bg-muted/30 rounded-lg space-y-4 border border-border">
                        <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Adicionar Itens</h3>
                        <div className="flex gap-3">
                            <div className="flex-1">
                                <select
                                    className="w-full bg-background border border-input rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                                    value={selectedProduct}
                                    onChange={e => setSelectedProduct(e.target.value)}
                                >
                                    <option value="">Selecione um produto...</option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                                            {p.name} (R$ {Number(p.price).toFixed(2)}) - {p.stock} em estoque
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="w-24">
                                <input
                                    type="number"
                                    min="1"
                                    className="w-full bg-background border border-input rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                                    value={quantity}
                                    onChange={e => setQuantity(Number(e.target.value))}
                                />
                            </div>
                            <button
                                type="button"
                                onClick={addItemToOrder}
                                disabled={!selectedProduct}
                                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors disabled:opacity-50"
                            >
                                <Plus size={20} />
                            </button>
                        </div>

                        {/* Order Items List */}
                        {orderItems.length > 0 && (
                            <div className="space-y-2 mt-4">
                                {orderItems.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-3 bg-background rounded border border-border">
                                        <div>
                                            <p className="font-medium">{item.productName}</p>
                                            <p className="text-sm text-muted-foreground">{item.quantity} x R$ {item.price.toFixed(2)}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="font-semibold">R$ {(item.quantity * item.price).toFixed(2)}</span>
                                            <button
                                                type="button"
                                                onClick={() => removeItemFromOrder(idx)}
                                                className="text-red-400 hover:text-red-300"
                                            >
                                                &times;
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                <div className="flex justify-between items-center pt-4 border-t border-border">
                                    <span className="font-bold">Total</span>
                                    <span className="font-bold text-xl">R$ {calculateTotal().toFixed(2)}</span>
                                </div>
                            </div>
                        )}
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
                            disabled={isLoading || orderItems.length === 0}
                            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50"
                        >
                            {isLoading ? 'Salvando...' : 'Finalizar Pedido'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
