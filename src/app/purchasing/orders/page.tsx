'use client';

import { useState, useEffect } from 'react';
import { getPurchaseOrders, createPurchaseOrder, getSuppliers } from '@/lib/purchasing-actions';
import { Modal } from '@/components/Modal';
import { FileText, Plus, Trash2 } from 'lucide-react';

const TENANT_ID = 'demo-tenant-1';

export default function PurchaseOrdersPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form State
    const [poNumber, setPoNumber] = useState('');
    const [supplierId, setSupplierId] = useState('');
    const [currency, setCurrency] = useState('USD');
    const [items, setItems] = useState([{ description: '', quantity: 1, unitPrice: 0 }]);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const [ordersData, suppliersData] = await Promise.all([
                getPurchaseOrders(TENANT_ID),
                getSuppliers(TENANT_ID),
            ]);
            setOrders(ordersData);
            setSuppliers(suppliersData);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    }

    function addItem() {
        setItems([...items, { description: '', quantity: 1, unitPrice: 0 }]);
    }

    function removeItem(index: number) {
        setItems(items.filter((_, i) => i !== index));
    }

    function updateItem(index: number, field: string, value: any) {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        try {
            await createPurchaseOrder({
                number: poNumber,
                supplierId,
                currency,
                tenantId: TENANT_ID,
                items: items.map(item => ({
                    ...item,
                    quantity: Number(item.quantity),
                    unitPrice: Number(item.unitPrice),
                })),
            });
            setShowModal(false);
            resetForm();
            await loadData();
        } catch (error) {
            alert('Erro ao criar pedido de compra');
        }
    }

    function resetForm() {
        setPoNumber('');
        setSupplierId('');
        setCurrency('USD');
        setItems([{ description: '', quantity: 1, unitPrice: 0 }]);
    }

    if (loading) return <div className="p-8 text-center">Carregando pedidos...</div>;

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Pedidos de Compra</h1>
                    <p className="text-muted-foreground">Gerencie seus pedidos de importação</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium"
                >
                    + Novo Pedido
                </button>
            </div>

            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                <table className="w-full">
                    <thead className="bg-muted/50">
                        <tr>
                            <th className="text-left p-4 font-medium">Número</th>
                            <th className="text-left p-4 font-medium">Fornecedor</th>
                            <th className="text-left p-4 font-medium">Status</th>
                            <th className="text-left p-4 font-medium">Container</th>
                            <th className="text-right p-4 font-medium">Total</th>
                            <th className="text-right p-4 font-medium">Itens</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {orders.map((order) => (
                            <tr key={order.id} className="hover:bg-muted/30">
                                <td className="p-4 font-medium flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-muted-foreground" />
                                    {order.number}
                                </td>
                                <td className="p-4">{order.supplier?.name}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${order.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                            order.status === 'DRAFT' ? 'bg-gray-100 text-gray-700' :
                                                'bg-blue-100 text-blue-700'
                                        }`}>
                                        {order.status}
                                    </span>
                                </td>
                                <td className="p-4">
                                    {order.container ? (
                                        <span className="text-blue-600 font-medium">{order.container.number}</span>
                                    ) : (
                                        <span className="text-muted-foreground text-sm">-</span>
                                    )}
                                </td>
                                <td className="p-4 text-right font-medium">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: order.currency }).format(order.totalAmount)}
                                </td>
                                <td className="p-4 text-right text-muted-foreground">
                                    {order.items.length}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {orders.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground">Nenhum pedido encontrado</div>
                )}
            </div>

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Novo Pedido de Compra">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Número PO *</label>
                            <input
                                required
                                className="w-full p-2 border rounded-md bg-background"
                                value={poNumber}
                                onChange={e => setPoNumber(e.target.value)}
                                placeholder="Ex: PO-2024-001"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Moeda</label>
                            <select
                                className="w-full p-2 border rounded-md bg-background"
                                value={currency}
                                onChange={e => setCurrency(e.target.value)}
                            >
                                <option value="USD">USD - Dólar</option>
                                <option value="EUR">EUR - Euro</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Fornecedor *</label>
                        <select
                            required
                            className="w-full p-2 border rounded-md bg-background"
                            value={supplierId}
                            onChange={e => setSupplierId(e.target.value)}
                        >
                            <option value="">Selecione um fornecedor...</option>
                            {suppliers.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium">Itens do Pedido</label>
                            <button
                                type="button"
                                onClick={addItem}
                                className="text-sm text-primary hover:underline flex items-center gap-1"
                            >
                                <Plus className="w-3 h-3" /> Adicionar Item
                            </button>
                        </div>
                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                            {items.map((item, index) => (
                                <div key={index} className="flex gap-2 items-start bg-muted/30 p-3 rounded-lg">
                                    <div className="flex-1">
                                        <input
                                            required
                                            className="w-full p-2 border rounded-md bg-background text-sm"
                                            placeholder="Descrição (ex: Taj Mahal Block)"
                                            value={item.description}
                                            onChange={e => updateItem(index, 'description', e.target.value)}
                                        />
                                    </div>
                                    <div className="w-20">
                                        <input
                                            required
                                            type="number"
                                            min="1"
                                            className="w-full p-2 border rounded-md bg-background text-sm"
                                            placeholder="Qtd"
                                            value={item.quantity}
                                            onChange={e => updateItem(index, 'quantity', e.target.value)}
                                        />
                                    </div>
                                    <div className="w-28">
                                        <input
                                            required
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            className="w-full p-2 border rounded-md bg-background text-sm"
                                            placeholder="Preço Unit."
                                            value={item.unitPrice}
                                            onChange={e => updateItem(index, 'unitPrice', e.target.value)}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeItem(index)}
                                        className="p-2 text-destructive hover:bg-destructive/10 rounded-md"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="mt-2 text-right font-medium text-sm">
                            Total Estimado: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(
                                items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unitPrice)), 0)
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <button
                            type="button"
                            onClick={() => setShowModal(false)}
                            className="px-4 py-2 border rounded-md hover:bg-muted"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                        >
                            Criar Pedido
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
