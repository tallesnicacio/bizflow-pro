'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    getHolds,
    getHoldStats,
    releaseHold,
    convertHoldToSale,
    extendHold,
    deleteHold,
    processExpiredHolds,
} from '@/lib/hold-actions';
import { getContacts } from '@/lib/crm-actions';
import { Modal } from '@/components/Modal';

const TENANT_ID = 'demo-tenant-1';

export default function HoldsPage() {
    const router = useRouter();
    const [holds, setHolds] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [contacts, setContacts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('ACTIVE');
    const [selectedHold, setSelectedHold] = useState<any>(null);
    const [showExtendModal, setShowExtendModal] = useState(false);
    const [extendDays, setExtendDays] = useState(7);

    useEffect(() => {
        loadData();
    }, [filter]);

    async function loadData() {
        try {
            const [holdsData, statsData, contactsData] = await Promise.all([
                getHolds(TENANT_ID, filter !== 'ALL' ? { status: filter } : undefined),
                getHoldStats(TENANT_ID),
                getContacts(TENANT_ID),
            ]);
            setHolds(holdsData);
            setStats(statsData);
            setContacts(contactsData);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleRelease(holdId: string) {
        if (!confirm('Tem certeza que deseja liberar esta reserva?')) return;

        try {
            await releaseHold(holdId);
            await loadData();
        } catch (error: any) {
            alert(error.message || 'Erro ao liberar reserva');
        }
    }

    async function handleConvert(holdId: string) {
        if (!confirm('Converter reserva em venda? A chapa será marcada como VENDIDA.')) return;

        try {
            await convertHoldToSale(holdId);
            await loadData();
        } catch (error: any) {
            alert(error.message || 'Erro ao converter reserva');
        }
    }

    async function handleExtend() {
        if (!selectedHold) return;

        try {
            const newDate = new Date();
            newDate.setDate(newDate.getDate() + extendDays);
            await extendHold(selectedHold.id, newDate);
            setShowExtendModal(false);
            setSelectedHold(null);
            await loadData();
        } catch (error: any) {
            alert(error.message || 'Erro ao estender reserva');
        }
    }

    async function handleDelete(holdId: string) {
        if (!confirm('Tem certeza que deseja excluir esta reserva?')) return;

        try {
            await deleteHold(holdId);
            await loadData();
        } catch (error: any) {
            alert(error.message || 'Erro ao excluir reserva');
        }
    }

    async function handleProcessExpired() {
        try {
            const result = await processExpiredHolds(TENANT_ID);
            alert(`${result.processedCount} reservas expiradas foram processadas.`);
            await loadData();
        } catch (error: any) {
            alert(error.message || 'Erro ao processar reservas expiradas');
        }
    }

    function formatDate(date: string | Date) {
        return new Date(date).toLocaleDateString('pt-BR');
    }

    function getStatusColor(status: string) {
        switch (status) {
            case 'ACTIVE':
                return 'bg-blue-500/20 text-blue-600';
            case 'RELEASED':
                return 'bg-gray-500/20 text-gray-600';
            case 'EXPIRED':
                return 'bg-red-500/20 text-red-600';
            case 'CONVERTED':
                return 'bg-green-500/20 text-green-600';
            default:
                return 'bg-gray-500/20 text-gray-600';
        }
    }

    function getStatusLabel(status: string) {
        const labels: Record<string, string> = {
            ACTIVE: 'Ativa',
            RELEASED: 'Liberada',
            EXPIRED: 'Expirada',
            CONVERTED: 'Convertida',
        };
        return labels[status] || status;
    }

    function isExpiringSoon(expiresAt: string) {
        const expiry = new Date(expiresAt);
        const now = new Date();
        const diffDays = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        return diffDays <= 3 && diffDays > 0;
    }

    function isExpired(expiresAt: string) {
        return new Date(expiresAt) < new Date();
    }

    if (loading) {
        return (
            <div className="p-8">
                <div className="text-center">Carregando reservas...</div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Reservas (Holds)</h1>
                    <p className="text-muted-foreground mt-2">
                        Gerencie reservas de chapas para clientes
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleProcessExpired}
                        className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg font-medium"
                    >
                        Processar Expiradas
                    </button>
                    <button
                        onClick={() => router.push('/inventory')}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium"
                    >
                        + Nova Reserva
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-5 gap-4 mb-8">
                    <div className="bg-card border border-border rounded-lg p-4">
                        <p className="text-sm text-muted-foreground">Ativas</p>
                        <p className="text-2xl font-bold text-blue-600">{stats.active}</p>
                    </div>
                    <div className="bg-card border border-border rounded-lg p-4">
                        <p className="text-sm text-muted-foreground">Expirando em 3 dias</p>
                        <p className="text-2xl font-bold text-orange-600">{stats.expiringIn3Days}</p>
                    </div>
                    <div className="bg-card border border-border rounded-lg p-4">
                        <p className="text-sm text-muted-foreground">Convertidas</p>
                        <p className="text-2xl font-bold text-green-600">{stats.converted}</p>
                    </div>
                    <div className="bg-card border border-border rounded-lg p-4">
                        <p className="text-sm text-muted-foreground">Liberadas</p>
                        <p className="text-2xl font-bold text-gray-600">{stats.released}</p>
                    </div>
                    <div className="bg-card border border-border rounded-lg p-4">
                        <p className="text-sm text-muted-foreground">Expiradas</p>
                        <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="mb-6 flex gap-2">
                {['ALL', 'ACTIVE', 'CONVERTED', 'RELEASED', 'EXPIRED'].map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-4 py-2 rounded-lg font-medium ${filter === status
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                            }`}
                    >
                        {status === 'ALL' ? 'Todas' : getStatusLabel(status)}
                    </button>
                ))}
            </div>

            {/* Holds List */}
            {holds.length === 0 ? (
                <div className="text-center py-12 bg-muted/30 rounded-lg border-2 border-dashed border-border">
                    <p className="text-muted-foreground mb-4">Nenhuma reserva encontrada</p>
                    <button
                        onClick={() => router.push('/inventory')}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium"
                    >
                        Ir para Inventário
                    </button>
                </div>
            ) : (
                <div className="bg-card border border-border rounded-lg overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="text-left p-4 font-medium">Chapa</th>
                                <th className="text-left p-4 font-medium">Produto</th>
                                <th className="text-left p-4 font-medium">Cliente</th>
                                <th className="text-left p-4 font-medium">Motivo</th>
                                <th className="text-left p-4 font-medium">Expira em</th>
                                <th className="text-left p-4 font-medium">Status</th>
                                <th className="text-right p-4 font-medium">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {holds.map((hold) => (
                                <tr key={hold.id} className="hover:bg-muted/30">
                                    <td className="p-4">
                                        <span className="font-mono font-medium">
                                            {hold.slab?.serialNumber || '-'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        {hold.slab?.product?.name || '-'}
                                    </td>
                                    <td className="p-4">
                                        {hold.contact?.name || (
                                            <span className="text-muted-foreground">Não informado</span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <span className="text-sm">{hold.reason || '-'}</span>
                                    </td>
                                    <td className="p-4">
                                        <span
                                            className={`${isExpired(hold.expiresAt)
                                                ? 'text-red-600'
                                                : isExpiringSoon(hold.expiresAt)
                                                    ? 'text-orange-600 font-medium'
                                                    : ''
                                                }`}
                                        >
                                            {formatDate(hold.expiresAt)}
                                            {isExpiringSoon(hold.expiresAt) && ' ⚠️'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                                hold.status
                                            )}`}
                                        >
                                            {getStatusLabel(hold.status)}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex gap-2 justify-end">
                                            {hold.status === 'ACTIVE' && (
                                                <>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedHold(hold);
                                                            setShowExtendModal(true);
                                                        }}
                                                        className="px-3 py-1 bg-muted hover:bg-muted/80 rounded text-sm"
                                                        title="Estender prazo"
                                                    >
                                                        Estender
                                                    </button>
                                                    <button
                                                        onClick={() => handleConvert(hold.id)}
                                                        className="px-3 py-1 bg-green-500 text-white hover:bg-green-600 rounded text-sm"
                                                        title="Converter em venda"
                                                    >
                                                        Vender
                                                    </button>
                                                    <button
                                                        onClick={() => handleRelease(hold.id)}
                                                        className="px-3 py-1 bg-orange-500 text-white hover:bg-orange-600 rounded text-sm"
                                                        title="Liberar reserva"
                                                    >
                                                        Liberar
                                                    </button>
                                                </>
                                            )}
                                            <button
                                                onClick={() => handleDelete(hold.id)}
                                                className="px-3 py-1 bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded text-sm"
                                            >
                                                Excluir
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Extend Modal */}
            <Modal
                isOpen={showExtendModal}
                onClose={() => {
                    setShowExtendModal(false);
                    setSelectedHold(null);
                }}
                title="Estender Reserva"
            >
                <div className="space-y-4">
                    <p className="text-muted-foreground">
                        Chapa: <strong>{selectedHold?.slab?.serialNumber}</strong>
                    </p>
                    <p className="text-muted-foreground">
                        Expira atualmente em: <strong>{selectedHold && formatDate(selectedHold.expiresAt)}</strong>
                    </p>
                    <div>
                        <label className="block text-sm font-medium mb-2">Estender por (dias)</label>
                        <input
                            type="number"
                            value={extendDays}
                            onChange={(e) => setExtendDays(parseInt(e.target.value) || 7)}
                            min={1}
                            max={90}
                            className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                        />
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Nova data de expiração:{' '}
                        <strong>
                            {formatDate(new Date(Date.now() + extendDays * 24 * 60 * 60 * 1000))}
                        </strong>
                    </p>
                    <div className="flex gap-3 justify-end pt-4">
                        <button
                            onClick={() => {
                                setShowExtendModal(false);
                                setSelectedHold(null);
                            }}
                            className="px-4 py-2 border border-border rounded-lg hover:bg-muted font-medium"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleExtend}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium"
                        >
                            Estender
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
