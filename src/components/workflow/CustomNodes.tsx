import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Mail, MessageSquare, CheckSquare, Tag, Edit, Play, Settings } from 'lucide-react';

const NODE_STYLES = {
    TRIGGER: 'bg-blue-50 border-blue-200',
    ACTION: 'bg-white border-border',
};

const ICONS: Record<string, any> = {
    CONTACT_CREATED: Play,
    TAG_ADDED: Tag,
    PIPELINE_STAGE_CHANGED: Settings,
    FORM_SUBMITTED: Edit,
    SEND_EMAIL: Mail,
    SEND_SMS: MessageSquare,
    CREATE_TASK: CheckSquare,
    ADD_TAG: Tag,
    UPDATE_FIELD: Edit,
};

const LABELS: Record<string, string> = {
    CONTACT_CREATED: 'Contato Criado',
    TAG_ADDED: 'Tag Adicionada',
    PIPELINE_STAGE_CHANGED: 'Estágio Mudou',
    FORM_SUBMITTED: 'Formulário Enviado',
    SEND_EMAIL: 'Enviar Email',
    SEND_SMS: 'Enviar SMS',
    CREATE_TASK: 'Criar Tarefa',
    ADD_TAG: 'Adicionar Tag',
    UPDATE_FIELD: 'Atualizar Campo',
};

export const TriggerNode = memo(({ data }: any) => {
    const Icon = ICONS[data.type] || Play;

    return (
        <div className={`px-4 py-3 shadow-md rounded-lg border-2 min-w-[250px] ${NODE_STYLES.TRIGGER}`}>
            <div className="flex items-center">
                <div className="rounded-full w-10 h-10 flex items-center justify-center bg-blue-100 text-blue-600 mr-3">
                    <Icon size={20} />
                </div>
                <div>
                    <div className="text-xs text-blue-600 font-bold uppercase tracking-wider">Gatilho</div>
                    <div className="text-sm font-bold text-gray-900">{LABELS[data.type] || data.type}</div>
                </div>
            </div>
            <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-blue-400" />
        </div>
    );
});

export const ActionNode = memo(({ data }: any) => {
    const Icon = ICONS[data.type] || Settings;

    return (
        <div className={`px-4 py-3 shadow-sm rounded-lg border-2 min-w-[250px] bg-white border-gray-200 hover:border-primary/50 transition-colors`}>
            <Handle type="target" position={Position.Top} className="w-3 h-3 bg-gray-400" />
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <div className="rounded-full w-10 h-10 flex items-center justify-center bg-gray-100 text-gray-600 mr-3">
                        <Icon size={20} />
                    </div>
                    <div>
                        <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Ação</div>
                        <div className="text-sm font-bold text-gray-900">{LABELS[data.type] || data.type}</div>
                        {data.summary && (
                            <div className="text-xs text-gray-500 mt-1 truncate max-w-[180px]">{data.summary}</div>
                        )}
                    </div>
                </div>
                <button
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    onClick={(e) => {
                        e.stopPropagation();
                        data.onDelete();
                    }}
                >
                    ✕
                </button>
            </div>
            <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-gray-400" />
        </div>
    );
});

export const AddNode = memo(({ data }: any) => {
    return (
        <div className="flex justify-center">
            <div className="w-8 h-8 rounded-full bg-gray-100 hover:bg-primary hover:text-white flex items-center justify-center cursor-pointer transition-colors border border-gray-300 text-gray-500">
                <span className="text-xl font-bold">+</span>
            </div>
            <Handle type="target" position={Position.Top} className="opacity-0" />
            <Handle type="source" position={Position.Bottom} className="opacity-0" />
        </div>
    );
});
