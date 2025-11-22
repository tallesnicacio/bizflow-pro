'use client';

import { DollarSign, Package, ShoppingCart, Users, TrendingUp, TrendingDown, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Modal } from '@/components/Modal';
import { createOrder } from '@/lib/actions';
import { getProducts } from '@/lib/inventory-actions';
import { getDashboardStats } from '@/lib/dashboard-actions';
import { cn } from '@/lib/utils';

const TENANT_ID = 'demo-tenant-1';

export default function Home() {
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    revenue: 0,
    activeOrders: 0,
    lowStockCount: 0,
    newLeads: 0
  });
  const [products, setProducts] = useState<any[]>([]);

  const [orderForm, setOrderForm] = useState({
    customerName: '',
    customerEmail: '',
    productId: '',
    quantity: 1
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    setIsLoading(true);
    try {
      const [dashboardStats, productsList] = await Promise.all([
        getDashboardStats(TENANT_ID),
        getProducts(TENANT_ID)
      ]);
      setStats(dashboardStats);
      setProducts(productsList);
      if (productsList.length > 0) {
        setOrderForm(prev => ({ ...prev, productId: productsList[0].id }));
      }
    } catch (error) {
      console.error('Failed to load dashboard', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateOrder(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    try {
      await createOrder({
        tenantId: TENANT_ID,
        customerName: orderForm.customerName,
        customerEmail: orderForm.customerEmail,
        items: [{ productId: orderForm.productId, quantity: Number(orderForm.quantity) }]
      });
      setIsOrderModalOpen(false);
      setOrderForm({ customerName: '', customerEmail: '', productId: products[0]?.id || '', quantity: 1 });
      await loadDashboardData();
    } catch (error) {
      console.error('Failed to create order', error);
      alert('Erro ao criar pedido. Verifique o estoque.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Bem-vindo de volta, Admin</p>
        </div>
        <button
          onClick={() => setIsOrderModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 font-medium"
        >
          <Plus size={20} />
          Novo Pedido
        </button>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Receita Total"
          value={`R$ ${stats.revenue.toLocaleString('pt-BR')}`}
          change="+20.1%"
          trend="up"
          icon={DollarSign}
          gradient="from-emerald-500 to-teal-600"
        />
        <StatCard
          title="Pedidos Ativos"
          value={stats.activeOrders.toString()}
          change="+12.5%"
          trend="up"
          icon={ShoppingCart}
          gradient="from-blue-500 to-cyan-600"
        />
        <StatCard
          title="Estoque Baixo"
          value={stats.lowStockCount.toString()}
          change={stats.lowStockCount > 0 ? "Atenção" : "OK"}
          trend={stats.lowStockCount > 0 ? "down" : "up"}
          icon={Package}
          alert={stats.lowStockCount > 0}
          gradient="from-orange-500 to-red-600"
        />
        <StatCard
          title="Novos Leads"
          value={stats.newLeads.toString()}
          change="+4.3%"
          trend="up"
          icon={Users}
          gradient="from-purple-500 to-pink-600"
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* System Status */}
        <div className="lg:col-span-2 glass-panel p-6">
          <h3 className="text-lg font-semibold mb-4">Status do Sistema</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <div>
                  <p className="font-medium">Sync Engine</p>
                  <p className="text-sm text-muted-foreground">Ativo e sincronizando</p>
                </div>
              </div>
              <span className="text-xs bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full font-medium">Online</span>
            </div>
            <div className="p-4 rounded-lg bg-card border border-border">
              <p className="text-sm text-muted-foreground">
                O sistema está monitorando vendas, estoque e atualizações de CRM em tempo real.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="glass-panel p-6">
          <h3 className="text-lg font-semibold mb-4">Ações Rápidas</h3>
          <div className="space-y-3">
            <button className="w-full p-4 rounded-lg border border-border hover:bg-accent transition-colors text-left group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Package className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Adicionar Produto</p>
                  <p className="text-xs text-muted-foreground">Gerenciar inventário</p>
                </div>
              </div>
            </button>
            <button className="w-full p-4 rounded-lg border border-border hover:bg-accent transition-colors text-left group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
                  <Users className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <p className="font-medium">Novo Contato</p>
                  <p className="text-xs text-muted-foreground">Adicionar ao CRM</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* New Order Modal */}
      <Modal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        title="Criar Novo Pedido"
      >
        <form onSubmit={handleCreateOrder} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nome do Cliente</label>
            <input
              required
              className="w-full bg-background border border-input rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring transition-all"
              value={orderForm.customerName}
              onChange={e => setOrderForm({ ...orderForm, customerName: e.target.value })}
              placeholder="João Silva"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Email do Cliente</label>
            <input
              required
              type="email"
              className="w-full bg-background border border-input rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring transition-all"
              value={orderForm.customerEmail}
              onChange={e => setOrderForm({ ...orderForm, customerEmail: e.target.value })}
              placeholder="joao@exemplo.com"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-2">Produto</label>
              <select
                className="w-full bg-background border border-input rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                value={orderForm.productId}
                onChange={e => setOrderForm({ ...orderForm, productId: e.target.value })}
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} (R$ {Number(p.price)}) - Estoque: {p.stock}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Qtd</label>
              <input
                required
                type="number"
                min="1"
                className="w-full bg-background border border-input rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                value={orderForm.quantity}
                onChange={e => setOrderForm({ ...orderForm, quantity: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg text-sm">
            <p className="font-medium mb-2">Este pedido irá automaticamente:</p>
            <ul className="space-y-1 text-muted-foreground">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Deduzir estoque do inventário
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Criar/Atualizar contato no CRM
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Disparar regras de automação
              </li>
            </ul>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsOrderModalOpen(false)}
              className="px-6 py-2 border border-border rounded-lg hover:bg-accent transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50"
            >
              {isLoading ? 'Processando...' : 'Criar Pedido'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function StatCard({ title, value, change, trend, icon: Icon, alert, gradient }: any) {
  return (
    <div className="glass-panel p-6 relative overflow-hidden group hover:shadow-xl transition-all duration-300">
      {/* Gradient Background */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br opacity-5 group-hover:opacity-10 transition-opacity",
        gradient
      )} />

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <h3 className="text-3xl font-bold">{value}</h3>
          </div>
          <div className={cn(
            "p-3 rounded-xl bg-gradient-to-br shadow-lg",
            gradient,
            alert && "from-orange-500 to-red-600"
          )}>
            <Icon size={24} className="text-white" />
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          {trend === 'up' ? (
            <TrendingUp size={16} className="text-emerald-500" />
          ) : (
            <TrendingDown size={16} className={alert ? "text-orange-500" : "text-red-500"} />
          )}
          <span className={cn(
            "font-medium",
            trend === 'up' ? "text-emerald-500" : (alert ? "text-orange-500" : "text-red-500")
          )}>
            {change}
          </span>
          <span className="text-muted-foreground">vs mês anterior</span>
        </div>
      </div>
    </div>
  );
}
