'use client';

import { Plus, Search, Filter, MoreVertical, Loader2, Package } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Modal } from '@/components/Modal';
import { createProduct, getProducts } from '@/lib/inventory-actions';
import { cn } from '@/lib/utils';

const TENANT_ID = 'demo-tenant-1';

export default function InventoryPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [products, setProducts] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        price: '',
        stock: '',
    });

    useEffect(() => {
        loadProducts();
    }, []);

    async function loadProducts() {
        setIsLoading(true);
        try {
            const data = await getProducts(TENANT_ID);
            setProducts(data);
        } catch (error) {
            console.error('Failed to load products', error);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setIsLoading(true);
        try {
            await createProduct({
                name: formData.name,
                sku: formData.sku,
                price: Number(formData.price),
                stock: Number(formData.stock),
                tenantId: TENANT_ID,
            });
            setIsModalOpen(false);
            setFormData({ name: '', sku: '', price: '', stock: '' });
            await loadProducts();
        } catch (error) {
            console.error('Failed to create product', error);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-bold text-foreground mb-2">Inventário</h1>
                    <p className="text-muted-foreground">Gerencie seus produtos e níveis de estoque</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 font-medium"
                >
                    <Plus size={20} />
                    Adicionar Produto
                </button>
            </header>

            {/* Search & Filters */}
            <div className="flex gap-4 items-center glass-panel p-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar produtos..."
                        className="w-full bg-background border border-input rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                    />
                </div>
                <button className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-lg hover:bg-accent transition-colors">
                    <Filter size={20} />
                    Filtros
                </button>
            </div>

            {/* Products Table */}
            <div className="glass-panel overflow-hidden">
                {isLoading && products.length === 0 ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="animate-spin text-primary" size={32} />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border bg-muted/50">
                                    <th className="text-left p-4 font-medium text-muted-foreground">Produto</th>
                                    <th className="text-left p-4 font-medium text-muted-foreground">SKU</th>
                                    <th className="text-left p-4 font-medium text-muted-foreground">Estoque</th>
                                    <th className="text-left p-4 font-medium text-muted-foreground">Preço</th>
                                    <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                                    <th className="text-left p-4 font-medium text-muted-foreground"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map((product) => (
                                    <tr key={product.id} className="border-b border-border hover:bg-accent/50 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-lg">
                                                    {product.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <a href={`/inventory/${product.id}`} className="font-medium hover:underline hover:text-primary transition-colors">
                                                        {product.name}
                                                    </a>
                                                    <p className="text-sm text-muted-foreground">Categoria A</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <code className="px-2 py-1 bg-muted rounded text-sm font-mono">{product.sku}</code>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-lg">{product.stock}</span>
                                                <span className="text-xs text-muted-foreground">unidades</span>
                                            </div>
                                        </td>
                                        <td className="p-4 font-semibold">R$ {Number(product.price).toFixed(2)}</td>
                                        <td className="p-4">
                                            <span className={cn(
                                                "px-3 py-1 rounded-full text-xs font-medium",
                                                product.stock < 10
                                                    ? "bg-red-500/20 text-red-400"
                                                    : "bg-emerald-500/20 text-emerald-400"
                                            )}>
                                                {product.stock < 10 ? 'Estoque Baixo' : 'Em Estoque'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button className="p-2 hover:bg-accent rounded-lg transition-colors">
                                                <MoreVertical size={18} className="text-muted-foreground" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {products.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-12 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                                                    <Package size={32} className="text-muted-foreground" />
                                                </div>
                                                <p className="text-muted-foreground">Nenhum produto encontrado. Adicione um para começar.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add Product Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Adicionar Novo Produto"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Nome do Produto</label>
                        <input
                            required
                            className="w-full bg-background border border-input rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Mármore Carrara Premium"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">SKU</label>
                        <input
                            required
                            className="w-full bg-background border border-input rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring transition-all font-mono"
                            value={formData.sku}
                            onChange={e => setFormData({ ...formData, sku: e.target.value })}
                            placeholder="MRM-001"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Preço (R$)</label>
                            <input
                                required
                                type="number"
                                step="0.01"
                                className="w-full bg-background border border-input rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                                value={formData.price}
                                onChange={e => setFormData({ ...formData, price: e.target.value })}
                                placeholder="245.00"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Estoque</label>
                            <input
                                required
                                type="number"
                                className="w-full bg-background border border-input rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                                value={formData.stock}
                                onChange={e => setFormData({ ...formData, stock: e.target.value })}
                                placeholder="50"
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
                            {isLoading ? 'Salvando...' : 'Salvar Produto'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
