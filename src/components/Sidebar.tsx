import Link from 'next/link';
import { LayoutDashboard, Package, ShoppingCart, DollarSign, Users, Settings, BarChart3, KanbanSquare, MessageSquare, FileText, Hammer, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Inventário', href: '/inventory', icon: Package },
    { name: 'Vendas', href: '/orders', icon: ShoppingCart },
    { name: 'Orçamentos', href: '/orders/quotes', icon: FileText },
    { name: 'Produção', href: '/jobs', icon: Hammer },
    { name: 'Financeiro', href: '/finance', icon: DollarSign },
    { name: 'Contatos', href: '/crm', icon: Users },
    { name: 'Agenda', href: '/crm/calendar', icon: Calendar },
    { name: 'Conversas', href: '/crm/conversations', icon: MessageSquare },
    { name: 'Pipelines', href: '/crm/pipelines', icon: KanbanSquare },
    { name: 'Relatórios', href: '/reports', icon: BarChart3 },
    { name: 'Configurações', href: '/settings', icon: Settings },
];

export function Sidebar() {
    return (
        <aside className="w-64 h-screen fixed left-0 top-0 p-4 border-r border-border bg-card/30 backdrop-blur-xl flex flex-col">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-8 px-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-xl">B</span>
                </div>
                <div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                        BizFlow Pro
                    </h1>
                    <p className="text-xs text-muted-foreground">Sistema de Gestão</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1">
                {navItems.map((item) => (
                    <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                            "flex items-center gap-3 px-4 py-3 rounded-lg",
                            "text-muted-foreground hover:text-foreground",
                            "hover:bg-accent transition-all duration-200",
                            "group relative overflow-hidden"
                        )}
                    >
                        <item.icon className="w-5 h-5 group-hover:text-primary transition-colors relative z-10" />
                        <span className="font-medium relative z-10">{item.name}</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                ))}
            </nav>

            {/* User Profile */}
            <div className="mt-auto p-4 rounded-xl bg-card border border-border">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">
                        A
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">Admin User</p>
                        <p className="text-xs text-muted-foreground">Plano Pro</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
