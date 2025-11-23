'use client';

import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export function IntegrationSettings() {
    // In a real app, we would check these values from the server or an API
    // For now, we'll simulate the status based on typical env var presence logic (client-side simulation)

    const integrations = [
        {
            name: 'Stripe',
            description: 'Processamento de pagamentos e faturas.',
            status: 'connected', // Simulated
            icon: '💳'
        },
        {
            name: 'SendGrid',
            description: 'Envio de emails transacionais e marketing.',
            status: 'connected', // Simulated
            icon: '📧'
        },
        {
            name: 'Twilio',
            description: 'Envio de SMS e notificações.',
            status: 'connected', // Simulated
            icon: '📱'
        },
        {
            name: 'Google Calendar',
            description: 'Sincronização de agenda e compromissos.',
            status: 'disconnected',
            icon: '📅'
        }
    ];

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Integrações</h3>
                <p className="text-sm text-muted-foreground">Conecte o BizFlow Pro a outras ferramentas.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {integrations.map((integration) => (
                    <div key={integration.name} className="glass-panel p-6 flex items-start justify-between">
                        <div className="flex gap-4">
                            <div className="text-3xl bg-muted/50 w-12 h-12 flex items-center justify-center rounded-lg">
                                {integration.icon}
                            </div>
                            <div>
                                <h4 className="font-medium">{integration.name}</h4>
                                <p className="text-sm text-muted-foreground mt-1">{integration.description}</p>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            {integration.status === 'connected' ? (
                                <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                                    <CheckCircle size={12} />
                                    Conectado
                                </span>
                            ) : (
                                <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                                    <XCircle size={12} />
                                    Desconectado
                                </span>
                            )}
                            <button className="text-xs text-primary hover:underline">
                                {integration.status === 'connected' ? 'Configurar' : 'Conectar'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex gap-3">
                <AlertCircle className="text-blue-600 shrink-0" size={20} />
                <div>
                    <h4 className="text-sm font-medium text-blue-700">Configuração via Variáveis de Ambiente</h4>
                    <p className="text-sm text-blue-600/80 mt-1">
                        Atualmente, as chaves de API são configuradas diretamente no servidor via arquivo <code>.env</code>.
                        Para alterar as chaves, contate o administrador do sistema.
                    </p>
                </div>
            </div>
        </div>
    );
}
