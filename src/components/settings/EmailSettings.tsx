'use client';

import { useState } from 'react';
import { Plus, CheckCircle, XCircle, RefreshCw, Trash2, Copy, Globe } from 'lucide-react';
import { addEmailDomain, verifyEmailDomain, deleteEmailDomain } from '@/lib/email-domain-actions';
import { Modal } from '@/components/Modal';

interface EmailSettingsProps {
    domains: any[];
    tenantId: string;
}

export function EmailSettings({ domains: initialDomains, tenantId }: EmailSettingsProps) {
    const [domains, setDomains] = useState(initialDomains);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [newDomain, setNewDomain] = useState('');
    const [dnsRecords, setDnsRecords] = useState<any>(null);

    async function handleAddDomain(e: React.FormEvent) {
        e.preventDefault();
        setIsLoading(true);
        try {
            const result = await addEmailDomain(tenantId, newDomain);
            if (result.success) {
                setDomains([result.domain, ...domains]);
                setDnsRecords(result.dnsRecords);
                setNewDomain('');
            } else {
                alert(result.error);
            }
        } catch (error) {
            console.error('Failed to add domain', error);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleVerifyDomain(domainId: string) {
        try {
            const result = await verifyEmailDomain(domainId, tenantId);
            if (result.success) {
                setDomains(domains.map(d =>
                    d.id === domainId ? { ...d, isVerified: result.verified, status: result.verified ? 'VERIFIED' : 'FAILED' } : d
                ));
                alert(result.verified ? 'Domain verified successfully!' : 'Domain verification failed. Please check DNS records.');
            } else {
                alert(result.error);
            }
        } catch (error) {
            console.error('Failed to verify domain', error);
        }
    }

    async function handleDeleteDomain(domainId: string) {
        if (!confirm('Are you sure you want to remove this domain?')) return;

        try {
            const result = await deleteEmailDomain(domainId, tenantId);
            if (result.success) {
                setDomains(domains.filter(d => d.id !== domainId));
            } else {
                alert(result.error);
            }
        } catch (error) {
            console.error('Failed to delete domain', error);
        }
    }

    function copyToClipboard(text: string) {
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-medium">Email Domains</h3>
                    <p className="text-sm text-muted-foreground">Configure custom domains for sending emails.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                    <Plus size={18} />
                    Add Domain
                </button>
            </div>

            {domains.length === 0 ? (
                <div className="glass-panel p-12 text-center">
                    <Globe className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                    <h4 className="font-medium mb-2">No domains configured</h4>
                    <p className="text-sm text-muted-foreground">Add your first domain to start sending emails from your own address.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {domains.map((domain) => (
                        <div key={domain.id} className="glass-panel p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <Globe className="text-primary" size={24} />
                                    <div>
                                        <h4 className="font-medium text-lg">{domain.domain}</h4>
                                        <p className="text-xs text-muted-foreground">Added {new Date(domain.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {domain.isVerified ? (
                                        <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-500/10 px-3 py-1.5 rounded-full">
                                            <CheckCircle size={14} />
                                            Verified
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1.5 text-xs font-medium text-amber-600 bg-amber-500/10 px-3 py-1.5 rounded-full">
                                            <XCircle size={14} />
                                            Pending
                                        </span>
                                    )}
                                    <button
                                        onClick={() => handleVerifyDomain(domain.id)}
                                        className="p-2 hover:bg-accent rounded-lg transition-colors"
                                        title="Verify Domain"
                                    >
                                        <RefreshCw size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteDomain(domain.id)}
                                        className="p-2 hover:bg-red-50 text-muted-foreground hover:text-red-600 rounded-lg transition-colors"
                                        title="Remove Domain"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {!domain.isVerified && domain.dkimRecord && (
                                <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                                    <p className="text-sm font-medium">DNS Records (Add these to your domain):</p>
                                    <div className="space-y-2 text-xs">
                                        <div className="flex items-center justify-between bg-background p-2 rounded">
                                            <code className="flex-1 text-muted-foreground">{domain.dkimRecord}</code>
                                            <button onClick={() => copyToClipboard(domain.dkimRecord)} className="ml-2">
                                                <Copy size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setDnsRecords(null);
                }}
                title="Add Email Domain"
            >
                {!dnsRecords ? (
                    <form onSubmit={handleAddDomain} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Domain Name</label>
                            <input
                                required
                                type="text"
                                className="w-full bg-background border border-input rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                                value={newDomain}
                                onChange={e => setNewDomain(e.target.value)}
                                placeholder="example.com"
                            />
                            <p className="text-xs text-muted-foreground mt-1">Enter your domain without http:// or www</p>
                        </div>

                        <div className="pt-4 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 border border-border rounded-lg hover:bg-accent"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
                            >
                                {isLoading ? 'Adding...' : 'Add Domain'}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-4">
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
                            <p className="text-sm font-medium text-emerald-700">Domain added successfully!</p>
                            <p className="text-xs text-emerald-600 mt-1">Add the DNS records below to verify your domain.</p>
                        </div>

                        <div className="space-y-2">
                            <p className="text-sm font-medium">DNS Records:</p>
                            {Object.entries(dnsRecords || {}).map(([key, value]: [string, any]) => (
                                <div key={key} className="bg-muted/30 rounded p-3">
                                    <p className="text-xs font-medium uppercase text-muted-foreground mb-1">{key}</p>
                                    <div className="flex items-center gap-2">
                                        <code className="flex-1 text-xs bg-background p-2 rounded">{value}</code>
                                        <button onClick={() => copyToClipboard(value)} className="p-2 hover:bg-accent rounded">
                                            <Copy size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => {
                                setIsModalOpen(false);
                                setDnsRecords(null);
                            }}
                            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                        >
                            Done
                        </button>
                    </div>
                )}
            </Modal>
        </div>
    );
}
