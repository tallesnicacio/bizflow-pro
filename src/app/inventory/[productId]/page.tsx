'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Plus, ArrowLeft, Loader2, Ruler, Layers } from 'lucide-react';
import { getProduct, createSlab } from '@/lib/inventory-slab-actions';
import { Modal } from '@/components/Modal';
import { cn } from '@/lib/utils';

const TENANT_ID = 'demo-tenant-1';

export default function ProductDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const productId = params.productId as string;

    const [isLoading, setIsLoading] = useState(true);
    const [product, setProduct] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        serialNumber: '',
        length: '',
        height: '',
        thickness: '2',
        finish: 'Polished'
    });

    useEffect(() => {
        loadData();
    }, [productId]);

    async function loadData() {
        setIsLoading(true);
        try {
            const data = await getProduct(productId);
            setProduct(data);
        } catch (error) {
            console.error('Failed to load product', error);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setIsLoading(true);
        try {
            await createSlab({
                serialNumber: formData.serialNumber,
                length: Number(formData.length),
                height: Number(formData.height),
                thickness: Number(formData.thickness),
                finish: formData.finish,
                productId: productId,
                tenantId: TENANT_ID,
            });
            setIsModalOpen(false);
            setFormData({
                serialNumber: '',
                length: '',
                height: '',
                thickness: '2',
                finish: 'Polished'
            });
            await loadData();
        } catch (error) {
            console.error('Failed to create slab', error);
        } finally {
            setIsLoading(false);
        }
    }

    if (isLoading && !product) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    if (!product) {
        return <div>Produto não encontrado</div>;
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <header className="flex flex-col gap-4">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors w-fit"
                >
                    <ArrowLeft size={20} />
                    Voltar para Inventário
                </button>
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-4xl font-bold text-foreground mb-2">{product.name}</h1>
                        <div className="flex gap-4 text-muted-foreground">
                            <span className="px-2 py-1 bg-muted rounded text-sm font-mono">{product.sku}</span>
                            <span>R$ {Number(product.price).toFixed(2)} / un</span>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 font-medium"
                    >
                        <Plus size={20} />
                        Adicionar Chapa (Slab)
                    </button>
                </div>
            </header>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-panel p-6 flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
                        <Layers size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Total de Chapas</p>
                        <h3 className="text-2xl font-bold">{product.slabs?.length || 0}</h3>
                    </div>
                </div>
                <div className="glass-panel p-6 flex items-center gap-4">
                    <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
                        <Ruler size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Área Total Estimada</p>
                        <h3 className="text-2xl font-bold">
                            {product.slabs?.reduce((acc: number, slab: any) => acc + (Number(slab.length) * Number(slab.height)) / 144, 0).toFixed(2)} sqft
                        </h3>
                    </div>
                </div>
            </div>

            {/* Slabs List */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold">Chapas em Estoque</h2>
                <div className="glass-panel overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border bg-muted/50">
                                <th className="text-left p-4 font-medium text-muted-foreground">Serial #</th>
                                <th className="text-left p-4 font-medium text-muted-foreground">Dimensões (LxA)</th>
                                <th className="text-left p-4 font-medium text-muted-foreground">Espessura</th>
                                <th className="text-left p-4 font-medium text-muted-foreground">Acabamento</th>
                                <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {product.slabs?.map((slab: any) => (
                                <tr key={slab.id} className="border-b border-border hover:bg-accent/50 transition-colors">
                                    <td className="p-4 font-mono">{slab.serialNumber}</td>
                                    <td className="p-4">{Number(slab.length)} x {Number(slab.height)} in</td>
                                    <td className="p-4">{Number(slab.thickness)} cm</td>
                                    <td className="p-4">{slab.finish}</td>
                                    <td className="p-4">
                                        <span className={cn(
                                            "px-2 py-1 rounded-full text-xs font-medium",
                                            slab.status === 'AVAILABLE' ? "bg-emerald-500/20 text-emerald-400" : "bg-yellow-500/20 text-yellow-400"
                                        )}>
                                            {slab.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {(!product.slabs || product.slabs.length === 0) && (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-muted-foreground">
                                        Nenhuma chapa cadastrada.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Slab Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Adicionar Nova Chapa"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Número de Série / Bundle</label>
                        <input
                            required
                            className="w-full bg-background border border-input rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                            value={formData.serialNumber}
                            onChange={e => setFormData({ ...formData, serialNumber: e.target.value })}
                            placeholder="B001-01"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Comprimento (in)</label>
                            <input
                                required
                                type="number"
                                step="0.1"
                                className="w-full bg-background border border-input rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                                value={formData.length}
                                onChange={e => setFormData({ ...formData, length: e.target.value })}
                                placeholder="120"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Altura (in)</label>
                            <input
                                required
                                type="number"
                                step="0.1"
                                className="w-full bg-background border border-input rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                                value={formData.height}
                                onChange={e => setFormData({ ...formData, height: e.target.value })}
                                placeholder="70"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Espessura</label>
                            <select
                                className="w-full bg-background border border-input rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                                value={formData.thickness}
                                onChange={e => setFormData({ ...formData, thickness: e.target.value })}
                            >
                                <option value="2">2 cm</option>
                                <option value="3">3 cm</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Acabamento</label>
                            <select
                                className="w-full bg-background border border-input rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                                value={formData.finish}
                                onChange={e => setFormData({ ...formData, finish: e.target.value })}
                            >
                                <option value="Polished">Polido</option>
                                <option value="Honed">Fosco (Honed)</option>
                                <option value="Leathered">Escovado (Leathered)</option>
                            </select>
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
                            {isLoading ? 'Salvando...' : 'Salvar Chapa'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
