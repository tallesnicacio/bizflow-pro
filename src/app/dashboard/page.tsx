import { getDashboardStats, getRecentActivity } from '@/lib/analytics-actions';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { DollarSign, Users, Hammer, Package, Plus } from 'lucide-react';
import Link from 'next/link';

export default async function DashboardPage() {
    const stats = await getDashboardStats();
    const activity = await getRecentActivity();

    if (!stats) {
        return (
            <div className="p-8">
                <h1 className="text-2xl font-bold">Dashboard</h1>
                <p className="text-muted-foreground">Faça login para ver seus dados.</p>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">Visão geral do seu negócio hoje.</p>
                </div>
                <div className="flex gap-3">
                    <Link href="/orders" className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium text-sm">
                        <Plus size={16} />
                        Novo Pedido
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    title="Receita (Mês)"
                    value={`$${stats.revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                    icon={DollarSign}
                    trend="+12.5%"
                    trendUp={true}
                    description="vs. mês passado"
                />
                <StatsCard
                    title="Leads Ativos"
                    value={stats.activeLeads.toString()}
                    icon={Users}
                    description="Oportunidades em aberto"
                />
                <StatsCard
                    title="Jobs Pendentes"
                    value={stats.pendingJobs.toString()}
                    icon={Hammer}
                    description="Em fabricação"
                />
                <StatsCard
                    title="Valor em Estoque"
                    value={`$${stats.inventoryValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                    icon={Package}
                    description="Total em produtos"
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Chart Area (Placeholder for now) */}
                <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6 shadow-sm min-h-[400px]">
                    <h3 className="font-semibold text-lg mb-6">Desempenho de Vendas</h3>
                    <div className="h-[300px] flex items-center justify-center bg-muted/10 rounded-lg border border-dashed border-border">
                        <p className="text-muted-foreground text-sm">Gráfico de Vendas (Em Breve)</p>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="lg:col-span-1">
                    <RecentActivity activities={activity} />
                </div>
            </div>
        </div>
    );
}
