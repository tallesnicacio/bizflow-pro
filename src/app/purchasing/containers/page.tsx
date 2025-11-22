'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getContainers, createContainer } from '@/lib/purchasing-actions';
import { Modal } from '@/components/Modal';
import { Ship, Calendar, ArrowRight } from 'lucide-react';

const TENANT_ID = 'demo-tenant-1';

export default function ContainersPage() {
    const router = useRouter();
    const [containers, setContainers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newContainerNumber, setNewContainerNumber] = useState('');
    const [etd, setEtd] = useState('');
    const [eta, setEta] = useState('');

    useEffect(() => {
        loadContainers();
    }, []);

    async function loadContainers() {
        try {
            const data = await getContainers(TENANT_ID);
            setContainers(data);
        } catch (error) {
            console.error('Failed to load containers:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        try {
            await createContainer({
                number: newContainerNumber,
                etd: etd ? new Date(etd) : undefined,
                eta: eta ? new Date(eta) : undefined,
                tenantId: TENANT_ID,
            });
            setShowModal(false);
            setNewContainerNumber('');
            setEtd('');
            setEta('');
            await loadContainers();
        } catch (error) {
            alert('Erro ao criar container');
        }
    }

    if (loading) return <div className="p-8 text-center">Carregando containers...</div>;

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Containers</h1>
                    <p className="text-muted-foreground">Rastreamento de importações</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium"
                >
                    + Novo Container
                </button>
            </div>

            <div className="grid gap-4">
                {containers.map((container) => (
                    <div
                        key={container.id}
                        onClick={() => router.push(`/purchasing/containers/${container.id}`)}
                        className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                                    <Ship className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold group-hover:text-primary transition-colors">
                                        {container.number}
                                    </h3>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            ETA: {container.eta ? new Date(container.eta).toLocaleDateString() : 'N/A'}
                                        </span>
                                        <span>•</span>
                                        <span>{container.purchaseOrders.length} Pedidos</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <p className="text-sm text-muted-foreground">Status</p>
                                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${container.status === 'RECEIVED' ? 'bg-green-100 text-green-700' :
                                            container.status === 'ON_WATER' ? 'bg-blue-100 text-blue-700' :
                                                'bg-gray-100 text-gray-700'
                                        }`}>
                                        {container.status}
                                    </span>
                                </div>
                                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                        </div>
                    </div>
                ))}
                {containers.length === 0 && (
                    <div className="text-center py-12 bg-muted/30 rounded-lg border-2 border-dashed border-border">
                        <p className="text-muted-foreground mb-4">Nenhum container encontrado</p>
                        <button
                            onClick={() => setShowModal(true)}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium"
                        >
                            Criar Primeiro Container
                        </button>
                    </div>
                )}
            </div>

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Novo Container">
                <form onSubmit={handleCreate} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Número do Container *</label>
                        <input
                            required
                            className="w-full p-2 border rounded-md bg-background"
                            value={newContainerNumber}
                            onChange={e => setNewContainerNumber(e.target.value)}
                            placeholder="Ex: MSCU1234567"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">ETD (Saída)</label>
                            <input
                                type="date"
                                className="w-full p-2 border rounded-md bg-background"
                                value={etd}
                                onChange={e => setEtd(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">ETA (Chegada)</label>
                            <input
                                type="date"
                                className="w-full p-2 border rounded-md bg-background"
                                value={eta}
                                onChange={e => setEta(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <button
                            type="button"
                            onClick={() => setShowModal(false)}
                            className="px-4 py-2 border rounded-md hover:bg-muted"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                        >
                            Criar Container
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
