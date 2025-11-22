import React from 'react';
import { Mail, MessageSquare, CheckSquare, Tag, Edit } from 'lucide-react';

const ACTION_TYPES = [
    { type: 'SEND_EMAIL', label: 'Enviar Email', icon: Mail, description: 'Enviar um email para o contato' },
    { type: 'SEND_SMS', label: 'Enviar SMS', icon: MessageSquare, description: 'Enviar mensagem de texto' },
    { type: 'CREATE_TASK', label: 'Criar Tarefa', icon: CheckSquare, description: 'Criar tarefa interna' },
    { type: 'ADD_TAG', label: 'Adicionar Tag', icon: Tag, description: 'Adicionar tag ao contato' },
    { type: 'UPDATE_FIELD', label: 'Atualizar Campo', icon: Edit, description: 'Atualizar campo do contato' },
];

export function Sidebar() {
    const onDragStart = (event: React.DragEvent, nodeType: string) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <aside className="w-80 bg-card border-l border-border h-full flex flex-col">
            <div className="p-4 border-b border-border">
                <h2 className="font-semibold text-lg">Ações</h2>
                <p className="text-xs text-muted-foreground">Arraste para o fluxo</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {ACTION_TYPES.map((action) => (
                    <div
                        key={action.type}
                        className="bg-background border border-border rounded-lg p-3 cursor-grab hover:border-primary hover:shadow-md transition-all flex items-start gap-3"
                        onDragStart={(event) => onDragStart(event, action.type)}
                        draggable
                    >
                        <div className="p-2 bg-muted rounded-md text-muted-foreground">
                            <action.icon size={20} />
                        </div>
                        <div>
                            <div className="font-medium text-sm">{action.label}</div>
                            <div className="text-xs text-muted-foreground mt-1">{action.description}</div>
                        </div>
                    </div>
                ))}
            </div>
        </aside>
    );
}
