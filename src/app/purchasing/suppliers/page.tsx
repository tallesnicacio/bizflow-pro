'use client';

import { useState, useEffect } from 'react';
import { getSuppliers, createSupplier } from '@/lib/purchasing-actions';
import { Modal } from '@/components/Modal';
import { Building2, Mail, Phone, MapPin } from 'lucide-react';

const TENANT_ID = 'demo-tenant-1';

export default function SuppliersPage() {
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        email: '',
        phone: '',
        address: '',
        country: '',
        currency: 'USD',
    });

    useEffect(() => {
        loadSuppliers();
    }, []);

    async function loadSuppliers() {
        try {
            const data = await getSuppliers(TENANT_ID);
            setSuppliers(data);
        } catch (error) {
            console.error('Failed to load suppliers:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        try {
            await createSupplier({ ...formData, tenantId: TENANT_ID });
            setShowModal(false);
            setFormData({
                name: '',
                code: '',
                email: '',
                phone: '',
                address: '',
                country: '',
                currency: 'USD',
            });
            await loadSuppliers();
        } catch (error) {
            alert('Erro ao criar fornecedor');
        }
    }

    if (loading) return <div className="p-8 text-center">Carregando fornecedores...</div>;

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Fornecedores</h1>
                    <p className="text-muted-foreground">Gestão de fornecedores internacionais</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium"
                >
                    + Novo Fornecedor
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {suppliers.map((supplier) => (
                    <div key={supplier.id} className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                    <Building2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg">{supplier.name}</h3>
                                    <p className="text-xs text-muted-foreground">{supplier.code}</p>
                                </div>
                            </div>
                            <span className="text-xs font-medium bg-muted px-2 py-1 rounded">
                                {supplier.currency}
                            </span>
                        </div>

                        <div className="space-y-2 text-sm text-muted-foreground">
                            {supplier.email && (
                                <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4" />
                                    <span>{supplier.email}</span>
                                </div>
                            )}
                            {supplier.phone && (
                                <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4" />
                                    <span>{supplier.phone}</span>
                                </div>
                            )}
                            {(supplier.address || supplier.country) && (
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4" />
                                    <span>
                                        {[supplier.address, supplier.country].filter(Boolean).join(', ')}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Novo Fornecedor">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Nome *</label>
                        <input
                            required
                            className="w-full p-2 border rounded-md bg-background"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Código</label>
                            <input
                                className="w-full p-2 border rounded-md bg-background"
                                value={formData.code}
                                onChange={e => setFormData({ ...formData, code: e.target.value })}
                                placeholder="Ex: SUP-001"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Moeda</label>
                            <select
                                className="w-full p-2 border rounded-md bg-background"
                                value={formData.currency}
                                onChange={e => setFormData({ ...formData, currency: e.target.value })}
                            >
                                <option value="USD">USD - Dólar</option>
                                <option value="EUR">EUR - Euro</option>
                                <option value="BRL">BRL - Real</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input
                            type="email"
                            className="w-full p-2 border rounded-md bg-background"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Telefone</label>
                        <input
                            className="w-full p-2 border rounded-md bg-background"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Endereço</label>
                            <input
                                className="w-full p-2 border rounded-md bg-background"
                                value={formData.address}
                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">País</label>
                            <input
                                className="w-full p-2 border rounded-md bg-background"
                                value={formData.country}
                                onChange={e => setFormData({ ...formData, country: e.target.value })}
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
                            Salvar
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
