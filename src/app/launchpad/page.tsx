'use client';

import {
    Rocket, Users, CreditCard, Mail, Smartphone,
    Plus, ShoppingCart, FileText, Settings, BarChart3
} from 'lucide-react';
import { OnboardingStep } from '@/components/launchpad/OnboardingStep';
import Link from 'next/link';

export default function LaunchpadPage() {
    // In a real app, these statuses would come from the database
    const onboardingSteps = [
        {
            id: 'stripe',
            title: 'Connect Stripe',
            description: 'Start accepting payments from your customers directly through the platform.',
            href: '/settings',
            isCompleted: true, // Mocked as completed since we did it
            icon: <CreditCard size={40} />
        },
        {
            id: 'team',
            title: 'Add Team Members',
            description: 'Invite your staff to collaborate and manage operations together.',
            href: '/settings',
            isCompleted: false,
            icon: <Users size={40} />
        },
        {
            id: 'email',
            title: 'Connect Email Service',
            description: 'Setup your custom domain to send professional emails to clients.',
            href: '/settings',
            isCompleted: true, // Mocked as completed
            icon: <Mail size={40} />
        },
        {
            id: 'mobile',
            title: 'Download Mobile App',
            description: 'Manage your business on the go with our iOS and Android apps.',
            href: '#',
            isCompleted: false,
            icon: <Smartphone size={40} />
        }
    ];

    const quickActions = [
        { label: 'New Order', icon: ShoppingCart, href: '/orders', color: 'text-blue-600 bg-blue-50' },
        { label: 'New Contact', icon: Users, href: '/crm', color: 'text-purple-600 bg-purple-50' },
        { label: 'Create Invoice', icon: FileText, href: '/finance', color: 'text-emerald-600 bg-emerald-50' },
        { label: 'View Reports', icon: BarChart3, href: '/dashboard', color: 'text-amber-600 bg-amber-50' },
    ];

    const completedSteps = onboardingSteps.filter(s => s.isCompleted).length;
    const progress = (completedSteps / onboardingSteps.length) * 100;

    return (
        <div className="max-w-5xl mx-auto space-y-10 py-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
                        Launchpad <Rocket className="text-primary" size={32} />
                    </h1>
                    <p className="text-muted-foreground mt-2 text-lg">
                        Welcome to BizFlow Pro! Let's get your business up and running.
                    </p>
                </div>
                <div className="bg-card border border-border rounded-xl p-4 min-w-[200px] shadow-sm">
                    <div className="flex justify-between text-sm mb-2">
                        <span className="font-medium">Setup Progress</span>
                        <span className="text-primary font-bold">{Math.round(progress)}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary transition-all duration-500 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {quickActions.map((action) => (
                    <Link
                        key={action.label}
                        href={action.href}
                        className="flex flex-col items-center justify-center p-6 bg-card border border-border rounded-xl hover:shadow-md hover:border-primary/30 transition-all group"
                    >
                        <div className={`p-3 rounded-full mb-3 ${action.color} group-hover:scale-110 transition-transform`}>
                            <action.icon size={24} />
                        </div>
                        <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                            {action.label}
                        </span>
                    </Link>
                ))}
            </div>

            {/* Onboarding Steps */}
            <div>
                <h2 className="text-2xl font-semibold mb-6">Getting Started</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {onboardingSteps.map((step) => (
                        <OnboardingStep
                            key={step.id}
                            {...step}
                        />
                    ))}
                </div>
            </div>

            {/* Mobile App Promo */}
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-8">
                <div>
                    <h3 className="text-2xl font-bold mb-2">Get the Mobile App</h3>
                    <p className="text-muted-foreground max-w-md">
                        Stay connected with your business from anywhere. Real-time notifications, order management, and more.
                    </p>
                    <div className="flex gap-4 mt-6">
                        <button className="bg-foreground text-background px-6 py-2.5 rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center gap-2">
                            <Smartphone size={18} /> iOS App
                        </button>
                        <button className="bg-foreground text-background px-6 py-2.5 rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center gap-2">
                            <Smartphone size={18} /> Android App
                        </button>
                    </div>
                </div>
                <div className="relative w-32 h-32 md:w-48 md:h-48 bg-background rounded-2xl shadow-lg flex items-center justify-center border border-border rotate-3">
                    <div className="text-center">
                        <span className="text-4xl font-bold text-primary">Biz</span>
                        <span className="text-4xl font-bold text-foreground">Flow</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
