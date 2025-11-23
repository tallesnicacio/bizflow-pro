'use client';

import { useState } from 'react';
import {
    Settings as SettingsIcon, Users, Link as LinkIcon, Building,
    User, CreditCard, BarChart3, Calendar, Bot, Mail, Phone,
    MessageSquare, Database, Tag, Globe, Activity, FileText,
    Layout, Shield
} from 'lucide-react';
import { TeamSettings } from '@/components/settings/TeamSettings';
import { IntegrationSettings } from '@/components/settings/IntegrationSettings';
import { EmailSettings } from '@/components/settings/EmailSettings';
import { TagSettings } from '@/components/settings/TagSettings';
import { cn } from '@/lib/utils';

// Homio-style Settings Menu Structure
const SETTINGS_MENU = [
    {
        title: 'MY BUSINESS',
        items: [
            { id: 'business-profile', label: 'Business Profile', icon: Building },
            { id: 'my-profile', label: 'My Profile', icon: User },
            { id: 'billing', label: 'Billing', icon: CreditCard },
            { id: 'my-staff', label: 'My Staff', icon: Users },
            { id: 'pipelines', label: 'Opportunities & Pipelines', icon: BarChart3 },
        ]
    },
    {
        title: 'BUSINESS SERVICES',
        items: [
            { id: 'automation', label: 'Automation', icon: Activity },
            { id: 'calendars', label: 'Calendars', icon: Calendar },
            { id: 'conversation-ai', label: 'Conversation AI', icon: Bot },
            { id: 'email-services', label: 'Email Services', icon: Mail },
            { id: 'phone-system', label: 'Phone System', icon: Phone },
            { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
        ]
    },
    {
        title: 'OTHER SETTINGS',
        items: [
            { id: 'custom-fields', label: 'Custom Fields', icon: Database },
            { id: 'domains', label: 'Domains & Redirects', icon: Globe },
            { id: 'integrations', label: 'Integrations', icon: LinkIcon },
            { id: 'tags', label: 'Tags', icon: Tag },
            { id: 'audit-logs', label: 'Audit Logs', icon: FileText },
        ]
    }
];

export default function SettingsPage({ users, emailDomains, tags, tenantId }: { users: any[], emailDomains: any[], tags: any[], tenantId: string }) {
    const [activeTab, setActiveTab] = useState('my-staff');

    return (
        <div className="space-y-6">
            <header className="border-b border-border pb-6">
                <h1 className="text-3xl font-bold text-foreground">Settings</h1>
            </header>

            <div className="flex flex-col md:flex-row gap-8 items-start">
                {/* Sidebar Navigation */}
                <aside className="w-full md:w-64 shrink-0 space-y-8">
                    {SETTINGS_MENU.map((section, idx) => (
                        <div key={idx}>
                            <h3 className="text-xs font-semibold text-muted-foreground mb-3 pl-3 tracking-wider">
                                {section.title}
                            </h3>
                            <nav className="flex flex-col gap-0.5">
                                {section.items.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => setActiveTab(item.id)}
                                        className={cn(
                                            "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors text-left",
                                            activeTab === item.id
                                                ? "bg-primary/10 text-primary"
                                                : "text-muted-foreground hover:bg-accent hover:text-foreground"
                                        )}
                                    >
                                        <item.icon size={16} />
                                        {item.label}
                                    </button>
                                ))}
                            </nav>
                        </div>
                    ))}
                </aside>

                {/* Content Area */}
                <main className="flex-1 min-w-0 bg-card rounded-xl border border-border shadow-sm min-h-[600px]">
                    <div className="p-6">
                        {activeTab === 'business-profile' && (
                            <div className="text-center py-20">
                                <Building className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                                <h3 className="text-lg font-medium">Business Profile</h3>
                                <p className="text-muted-foreground">Manage your business details here.</p>
                            </div>
                        )}

                        {activeTab === 'my-staff' && (
                            <TeamSettings users={users} tenantId={tenantId} />
                        )}

                        {activeTab === 'email-services' && (
                            <EmailSettings domains={emailDomains} tenantId={tenantId} />
                        )}

                        {activeTab === 'tags' && (
                            <TagSettings tags={tags} tenantId={tenantId} />
                        )}

                        {activeTab === 'integrations' && (
                            <IntegrationSettings />
                        )}

                        {/* Placeholder for other tabs */}
                        {!['business-profile', 'my-staff', 'email-services', 'tags', 'integrations'].includes(activeTab) && (
                            <div className="text-center py-20">
                                <SettingsIcon className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                                <h3 className="text-lg font-medium">Coming Soon</h3>
                                <p className="text-muted-foreground">The {SETTINGS_MENU.flatMap(s => s.items).find(i => i.id === activeTab)?.label} settings are under development.</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
