'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    getContainers,
    getPurchaseOrders,
    addPOToContainer,
    updateContainerCosts,
    receiveContainer
} from '@/lib/purchasing-actions';
import { Modal } from '@/components/Modal';
import { Ship, Package, DollarSign, CheckCircle, AlertTriangle, Plus } from 'lucide-react';

const TENANT_ID = 'demo-tenant-1';

export default function ContainerDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const containerId = params.containerId as string;

    const [container, setContainer] = useState<any>(null);
    const [availableOrders, setAvailableOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddPOModal, setShowAddPOModal] = useState(false);

    // Cost State
    const [costs, setCosts] = useState({
        freightCost: 0,
        customsCost: 0,
        truckingCost: 0,
        otherCosts: 0,
    });

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const containersData = await getContainers(TENANT_ID);
            const currentContainer = containersData.find((c: any) => c.id === containerId);

            if (currentContainer) {
                setContainer(currentContainer);
                setCosts({
                    freightCost: currentContainer.freightCost || 0,
                    customsCost: currentContainer.customsCost || 0,
                    truckingCost: currentContainer.truckingCost || 0,
                    otherCosts: currentContainer.otherCosts || 0,
                });
            }

            const ordersData = await getPurchaseOrders(TENANT_ID);
            setAvailableOrders(ordersData.filter((o: any) => !o.containerId && o.status !== 'COMPLETED'));
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleAddPO(orderId: string) {
        try {
            await addPOToContainer(containerId, orderId);
            setShowAddPOModal(false);
            await loadData();
        } catch (error) {
            alert('Erro ao adicionar pedido ao container');
        }
    }

    async function handleUpdateCosts() {
        try {
            await updateContainerCosts(containerId, costs);
            alert('Custos atualizados com sucesso!');
            await loadData();
        } catch (error) {
            alert('Erro ao atualizar custos');
        }
    }

    async function handleReceive() {
        if (!confirm('Tem certeza que deseja receber este container? Isso criará itens no inventário e calculará os custos finais. Esta ação não pode ser desfeita.')) return;

        try {
            const result = await receiveContainer(containerId);
            alert(`Container recebido com sucesso! ${result.productsCreated} produtos criados no inventário.`);
            router.push('/inventory');
        } catch (error: any) {
            alert(`Erro ao receber container: ${error.message}`);
        }
    }

    if (loading) return <div className="p-8 text-center">Carregando container...</div>;
    if (!container) return <div className="p-8 text-center">Container não encontrado</div>;

    const totalGoodsValue = container.purchaseOrders.reduce((sum: number, po: any) => sum + po.totalAmount, 0);
    const totalLandedCosts = Number(costs.freightCost) + Number(costs.customsCost) + Number(costs.truckingCost) + Number(costs.otherCosts);
    const totalInvestment = totalGoodsValue + totalLandedCosts;
    const costFactor = totalGoodsValue > 0 ? (totalInvestment / totalGoodsValue) : 0;

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                        <Ship className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">{container.number}</h1>
                        <div className="flex items-center gap-3 text-muted-foreground mt-1">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${container.status === 'RECEIVED' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                }`}>
                                {container.status}
                            </span>
                            <span>•</span>
                            <span>ETA: {container.eta ? new Date(container.eta).toLocaleDateString() : 'N/A'}</span>
                        </div>
                    </div>
                </div>

                {container.status !== 'RECEIVED' && (
                    <button
                        onClick={handleReceive}
                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold shadow-lg flex items-center gap-2"
                    >
                        <CheckCircle className="w-5 h-5" />
                        Receber Container
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: POs and Items */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-card border border-border rounded-xl p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <Package className="w-5 h-5" />
                                Pedidos no Container
                            </h2>
                            {container.status !== 'RECEIVED' && (
                                <button
                                    onClick={() => setShowAddPOModal(true)}
                                    className="text-sm text-primary hover:underline flex items-center gap-1"
                                >
                                    <Plus className="w-4 h-4" /> Adicionar PO
                                </button>
                            )}
                        </div>

                        <div className="space-y-4">
                            {container.purchaseOrders.map((po: any) => (
                                <div key={po.id} className="border border-border rounded-lg overflow-hidden">
                                    <div className="bg-muted/30 p-3 flex justify-between items-center border-b border-border">
                                        <div>
                                            <span className="font-bold">{po.number}</span>
                                            <span className="text-muted-foreground text-sm mx-2">•</span>
                                            <span className="text-sm">{po.supplier.name}</span>
                                        </div>
                                        <span className="font-mono font-medium">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: po.currency }).format(po.totalAmount)}
                                        </span>
                                    </div>
                                    <div className="p-3 bg-background">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="text-muted-foreground text-left">
                                                    <th className="pb-2">Item</th>
                                                    <th className="pb-2 text-right">Qtd</th>
                                                    <th className="pb-2 text-right">Unit.</th>
                                                    <th className="pb-2 text-right">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {po.items.map((item: any) => (
                                                    <tr key={item.id} className="border-t border-border/50">
                                                        <td className="py-2">{item.description}</td>
                                                        <td className="py-2 text-right">{item.quantity}</td>
                                                        <td className="py-2 text-right">{item.unitPrice.toFixed(2)}</td>
                                                        <td className="py-2 text-right font-medium">{item.totalPrice.toFixed(2)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ))}
                            {container.purchaseOrders.length === 0 && (
                                <p className="text-center text-muted-foreground py-4">Nenhum pedido adicionado</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Costs and Summary */}
                <div className="space-y-6">
                    {/* Cost Entry */}
                    <div className="bg-card border border-border rounded-xl p-6">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <DollarSign className="w-5 h-5" />
                            Custos de Importação
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Frete Internacional</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-muted-foreground">$</span>
                                    <input
                                        type="number"
                                        className="w-full pl-7 p-2 border rounded-md bg-background"
                                        value={costs.freightCost}
                                        onChange={e => setCosts({ ...costs, freightCost: Number(e.target.value) })}
                                        disabled={container.status === 'RECEIVED'}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Impostos / Alfândega</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-muted-foreground">$</span>
                                    <input
                                        type="number"
                                        className="w-full pl-7 p-2 border rounded-md bg-background"
                                        value={costs.customsCost}
                                        onChange={e => setCosts({ ...costs, customsCost: Number(e.target.value) })}
                                        disabled={container.status === 'RECEIVED'}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Transporte Terrestre</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-muted-foreground">$</span>
                                    <input
                                        type="number"
                                        className="w-full pl-7 p-2 border rounded-md bg-background"
                                        value={costs.truckingCost}
                                        onChange={e => setCosts({ ...costs, truckingCost: Number(e.target.value) })}
                                        disabled={container.status === 'RECEIVED'}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Outros Custos</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-muted-foreground">$</span>
                                    <input
                                        type="number"
                                        className="w-full pl-7 p-2 border rounded-md bg-background"
                                        value={costs.otherCosts}
                                        onChange={e => setCosts({ ...costs, otherCosts: Number(e.target.value) })}
                                        disabled={container.status === 'RECEIVED'}
                                    />
                                </div>
                            </div>

                            {container.status !== 'RECEIVED' && (
                                <button
                                    onClick={handleUpdateCosts}
                                    className="w-full py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium mt-4"
                                >
                                    Salvar Custos
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Landed Cost Summary */}
                    <div className="bg-muted/30 border border-border rounded-xl p-6">
                        <h3 className="font-semibold mb-4">Resumo de Custos (Landed Cost)</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Valor das Mercadorias:</span>
                                <span className="font-medium">
                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalGoodsValue)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Total Custos Extras:</span>
                                <span className="font-medium text-orange-600">
                                    + {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalLandedCosts)}
                                </span>
                            </div>
                            <div className="border-t border-border my-2 pt-2 flex justify-between text-base font-bold">
                                <span>Custo Total:</span>
                                <span>
                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalInvestment)}
                                </span>
                            </div>

                            {totalGoodsValue > 0 && (
                                <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded-lg text-xs">
                                    <div className="flex items-center gap-2 mb-1 font-semibold">
                                        <AlertTriangle className="w-4 h-4" />
                                        Fator de Custo: {costFactor.toFixed(4)}x
                                    </div>
                                    <p>
                                        Cada $1.00 em mercadoria terá um custo final de ${costFactor.toFixed(2)} no inventário.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Add PO Modal */}
            <Modal isOpen={showAddPOModal} onClose={() => setShowAddPOModal(false)} title="Adicionar Pedido ao Container">
                <div className="space-y-4">
                    {availableOrders.length === 0 ? (
                        <p className="text-muted-foreground text-center py-4">
                            Não há pedidos disponíveis para adicionar.
                        </p>
                    ) : (
                        <div className="grid gap-2">
                            {availableOrders.map(po => (
                                <button
                                    key={po.id}
                                    onClick={() => handleAddPO(po.id)}
                                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted text-left"
                                >
                                    <div>
                                        <p className="font-medium">{po.number}</p>
                                        <p className="text-xs text-muted-foreground">{po.supplier.name}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium text-sm">
                                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: po.currency }).format(po.totalAmount)}
                                        </p>
                                        <p className="text-xs text-muted-foreground">{po.items.length} itens</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                    <div className="flex justify-end pt-4">
                        <button
                            onClick={() => setShowAddPOModal(false)}
                            className="px-4 py-2 border rounded-md hover:bg-muted"
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
