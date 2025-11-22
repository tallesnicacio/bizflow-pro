'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { logout } from '@/lib/auth-actions';
import {
    LayoutDashboard,
    MessageSquare,
    Calendar,
    Users,
    Target, // Opportunities
    CreditCard, // Payments
    Megaphone, // Marketing
    Workflow, // Automation
    Globe, // Sites
    GraduationCap, // Memberships
    Image, // Media
    Star, // Reputation
    BarChart3, // Reporting
    Rocket, // Launchpad
    Box, // Inventory
    Truck, // Purchasing
    Hammer, // Jobs
    LogOut,
    Lock
} from 'lucide-react';

const MAIN_MENU = [
    { name: 'Launchpad', href: '/launchpad', icon: Rocket },
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Conversations', href: '/crm/conversations', icon: MessageSquare },
    { name: 'Calendars', href: '/crm/calendar', icon: Calendar },
    { name: 'Contacts', href: '/crm', icon: Users },
    { name: 'Opportunities', href: '/crm/pipelines', icon: Target },
    { name: 'Payments', href: '/finance', icon: CreditCard },
    { name: 'Marketing', href: '/marketing', icon: Megaphone },
    { name: 'Automation', href: '/automation', icon: Workflow },
    { name: 'Sites', href: '/funnels', icon: Globe },
    { name: 'Memberships', href: '/memberships', icon: GraduationCap },
    { name: 'Media Storage', href: '/media', icon: Image },
    { name: 'Reputation', href: '/reputation', icon: Star },
    { name: 'Reporting', href: '/reports', icon: BarChart3 },
];

const OPERATIONS_MENU = [
    { name: 'Inventory', href: '/inventory', icon: Box },
    { name: 'Purchasing', href: '/purchasing', icon: Truck },
    { name: 'Jobs', href: '/jobs', icon: Hammer },
    { name: 'Orders', href: '/orders', icon: CreditCard },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="w-64 bg-card border-r border-border h-screen flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-border">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                    BizFlow Pro
                </h1>
                <p className="text-xs text-muted-foreground mt-1">Demo Company</p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6 custom-scrollbar">
                {/* Main Menu */}
                <div className="space-y-1">
                    {MAIN_MENU.map((item) => {
                        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                            >
                                <item.icon className="w-4 h-4" />
                                {item.name}
                            </Link>
                        );
                    })}
                </div>

                {/* Operations Section (ERP) */}
                <div>
                    <h3 className="px-3 text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider mb-2">
                        Operações
                    </h3>
                    <div className="space-y-1">
                        {OPERATIONS_MENU.map((item) => {
                            const isActive = pathname === item.href || pathname.startsWith(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                                        isActive
                                            ? "bg-primary/10 text-primary"
                                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                    )}
                                >
                                    <item.icon className="w-4 h-4" />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </nav>

            {/* Footer / User */}
            <div className="p-4 border-t border-border bg-muted/10">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                        A
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-medium truncate">Admin User</p>
                        <p className="text-xs text-muted-foreground truncate">admin@bizflow.com</p>
                    </div>
                </div>
                <form action={logout}>
                    <button className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                        <LogOut className="w-4 h-4" />
                        Sair
                    </button>
                </form>
            </div>
        </div>
    );
}
