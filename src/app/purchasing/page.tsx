'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getContainers, getPurchaseOrders } from '@/lib/purchasing-actions';
import { Ship, Package, TrendingUp, AlertCircle } from 'lucide-react';

const TENANT_ID = 'demo-tenant-1';

export default function PurchasingDashboard() {
    const router = useRouter();
    const [containers, setContainers] = useState<any[]>([]);
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const [containersData, ordersData] = await Promise.all([
                getContainers(TENANT_ID),
                getPurchaseOrders(TENANT_ID),
            ]);
            setContainers(containersData);
            setOrders(ordersData);
        } catch (error) {
            console.error('Failed to load purchasing data:', error);
        } finally {
            setLoading(false);
        }
    }

    const stats = {
        activeContainers: containers.filter(c => c.status !== 'RECEIVED').length,
        pendingOrders: orders.filter(o => o.status !== 'COMPLETED').length,
        totalFreight: containers.reduce((sum, c) => sum + (c.freightCost || 0), 0),
        incomingValue: orders
            .filter(o => o.status !== 'COMPLETED')
            .reduce((sum, o) => sum + (o.totalAmount || 0), 0),
    };

    if (loading) {
        return <div className="p-8 text-center">Carregando dashboard de compras...</div>;
    }

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-2">Compras & Importação</h1>
            <p className="text-muted-foreground mb-8">Gestão de fornecedores, pedidos de compra e containers</p>

            {/* Quick Actions */}
            <div className="flex gap-4 mb-8">
                <button
                    onClick={() => router.push('/purchasing/suppliers')}
                    className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg font-medium"
                >
                    Fornecedores
                </button>
                <button
                    onClick={() => router.push('/purchasing/orders')}
                    className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg font-medium"
                >
                    Pedidos de Compra
                </button>
                <button
                    onClick={() => router.push('/purchasing/containers')}
                    className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg font-medium"
                >
                    Containers
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                            <Ship className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded">
                            Em Trânsito
                        </span>
                    </div>
                    <p className="text-sm text-muted-foreground">Containers Ativos</p>
                    <h3 className="text-2xl font-bold">{stats.activeContainers}</h3>
                </div>

                <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                            <Package className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded">
                            Pendentes
                        </span>
                    </div>
                    <p className="text-sm text-muted-foreground">Pedidos Abertos</p>
                    <h3 className="text-2xl font-bold">{stats.pendingOrders}</h3>
                </div>

                <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground">Valor em Trânsito</p>
                    <h3 className="text-2xl font-bold">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'USD' }).format(stats.incomingValue)}
                    </h3>
                </div>

                <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground">Custo Frete (Total)</p>
                    <h3 className="text-2xl font-bold">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'USD' }).format(stats.totalFreight)}
                    </h3>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Containers */}
                <div className="bg-card border border-border rounded-xl p-6">
                    <h2 className="text-xl font-semibold mb-4">Containers Recentes</h2>
                    <div className="space-y-4">
                        {containers.slice(0, 5).map((container) => (
                            <div key={container.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                                <div>
                                    <p className="font-medium">{container.number}</p>
                                    <p className="text-sm text-muted-foreground">
                                        ETA: {container.eta ? new Date(container.eta).toLocaleDateString() : 'N/A'}
                                    </p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${container.status === 'RECEIVED' ? 'bg-green-100 text-green-700' :
                                        container.status === 'ON_WATER' ? 'bg-blue-100 text-blue-700' :
                                            'bg-gray-100 text-gray-700'
                                    }`}>
                                    {container.status}
                                </span>
                            </div>
                        ))}
                        {containers.length === 0 && (
                            <p className="text-center text-muted-foreground py-4">Nenhum container encontrado</p>
                        )}
                    </div>
                </div>

                {/* Recent Orders */}
                <div className="bg-card border border-border rounded-xl p-6">
                    <h2 className="text-xl font-semibold mb-4">Pedidos Recentes</h2>
                    <div className="space-y-4">
                        {orders.slice(0, 5).map((order) => (
                            <div key={order.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                                <div>
                                    <p className="font-medium">{order.number}</p>
                                    <p className="text-sm text-muted-foreground">{order.supplier?.name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-medium">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: order.currency }).format(order.totalAmount)}
                                    </p>
                                    <span className="text-xs text-muted-foreground">{order.status}</span>
                                </div>
                            </div>
                        ))}
                        {orders.length === 0 && (
                            <p className="text-center text-muted-foreground py-4">Nenhum pedido encontrado</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
