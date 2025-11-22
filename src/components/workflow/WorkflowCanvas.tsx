'use client';

import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
    ReactFlowProvider,
    addEdge,
    useNodesState,
    useEdgesState,
    Controls,
    Background,
    Connection,
    Edge,
    Node,
    MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { TriggerNode, ActionNode } from './CustomNodes';
import { Sidebar } from './Sidebar';
import { Modal } from '@/components/Modal';

const nodeTypes = {
    trigger: TriggerNode,
    action: ActionNode,
};

const INITIAL_TRIGGER_NODE: Node = {
    id: 'trigger',
    type: 'trigger',
    position: { x: 250, y: 50 },
    data: { type: 'CONTACT_CREATED' },
};

export function WorkflowCanvas({
    initialData,
    onSave,
    saving
}: {
    initialData?: any,
    onSave: (data: any) => void,
    saving: boolean
}) {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

    // Configuration Modal State
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const [configOpen, setConfigOpen] = useState(false);
    const [nodeConfig, setNodeConfig] = useState<any>({});

    // Initialize Flow
    useEffect(() => {
        if (initialData) {
            const initialNodes: Node[] = [];
            const initialEdges: Edge[] = [];

            // 1. Trigger Node
            initialNodes.push({
                id: 'trigger',
                type: 'trigger',
                position: { x: 250, y: 50 },
                data: {
                    type: initialData.trigger?.type || 'CONTACT_CREATED',
                    config: initialData.trigger?.config || {},
                    label: 'Start'
                },
            });

            // 2. Action Nodes
            let yPos = 150;
            let previousNodeId = 'trigger';

            if (initialData.actions) {
                initialData.actions.forEach((action: any, index: number) => {
                    const nodeId = `action-${index}`;
                    yPos += 100;

                    initialNodes.push({
                        id: nodeId,
                        type: 'action',
                        position: { x: 250, y: yPos },
                        data: {
                            type: action.type,
                            config: action.config || {},
                            summary: getActionSummary(action),
                            onDelete: () => deleteNode(nodeId),
                        },
                    });

                    initialEdges.push({
                        id: `e-${previousNodeId}-${nodeId}`,
                        source: previousNodeId,
                        target: nodeId,
                        type: 'smoothstep',
                        markerEnd: { type: MarkerType.ArrowClosed },
                    });

                    previousNodeId = nodeId;
                });
            }

            setNodes(initialNodes);
            setEdges(initialEdges);
        } else {
            setNodes([INITIAL_TRIGGER_NODE]);
        }
    }, [initialData]);

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge({ ...params, type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } }, eds)),
        [setEdges],
    );

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            const type = event.dataTransfer.getData('application/reactflow');
            if (typeof type === 'undefined' || !type) {
                return;
            }

            const position = reactFlowInstance.screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            const newNodeId = `action-${Date.now()}`;
            const newNode: Node = {
                id: newNodeId,
                type: 'action',
                position,
                data: {
                    type,
                    config: {},
                    onDelete: () => deleteNode(newNodeId),
                },
            };

            setNodes((nds) => nds.concat(newNode));

            // Auto-connect to the last node if possible (simple heuristic)
            // In a real app, we might want smarter auto-connect
            const lastNode = nodes[nodes.length - 1];
            if (lastNode) {
                setEdges((eds) => addEdge({
                    id: `e-${lastNode.id}-${newNodeId}`,
                    source: lastNode.id,
                    target: newNodeId,
                    type: 'smoothstep',
                    markerEnd: { type: MarkerType.ArrowClosed },
                }, eds));
            }
        },
        [reactFlowInstance, nodes],
    );

    const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
        setSelectedNode(node);
        setNodeConfig(node.data.config || {});
        setConfigOpen(true);
    }, []);

    const deleteNode = (nodeId: string) => {
        setNodes((nds) => nds.filter((n) => n.id !== nodeId));
        setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    };

    const handleConfigSave = () => {
        if (!selectedNode) return;

        setNodes((nds) => nds.map((node) => {
            if (node.id === selectedNode.id) {
                return {
                    ...node,
                    data: {
                        ...node.data,
                        config: nodeConfig,
                        summary: getActionSummary({ type: node.data.type, config: nodeConfig }),
                    },
                };
            }
            return node;
        }));
        setConfigOpen(false);
    };

    const handleSaveWorkflow = () => {
        // Convert Graph to Linear List
        // 1. Find Trigger
        const triggerNode = nodes.find(n => n.type === 'trigger');
        if (!triggerNode) return alert('Workflow must have a trigger');

        // 2. Traverse Edges to find sequence
        // This is a simplified traversal assuming linear flow. 
        // For robust implementation, we'd need a graph traversal algorithm (BFS/DFS).
        // Here we just sort by Y position as a heuristic for the linear list since we auto-layout vertically usually.
        // OR better: follow the edges.

        const actionsList: any[] = [];
        let currentNodeId = triggerNode.id;

        // Safety break to prevent infinite loops
        let iterations = 0;
        const maxIterations = 100;

        while (iterations < maxIterations) {
            const edge = edges.find(e => e.source === currentNodeId);
            if (!edge) break;

            const nextNode = nodes.find(n => n.id === edge.target);
            if (!nextNode) break;

            if (nextNode.type === 'action') {
                actionsList.push({
                    type: nextNode.data.type,
                    config: nextNode.data.config,
                });
            }

            currentNodeId = nextNode.id;
            iterations++;
        }

        const workflowData = {
            trigger: {
                type: triggerNode.data.type,
                config: triggerNode.data.config,
            },
            actions: actionsList,
        };

        onSave(workflowData);
    };

    return (
        <div className="flex h-[calc(100vh-100px)] border border-border rounded-lg overflow-hidden bg-background">
            <div className="flex-1 relative">
                <ReactFlowProvider>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onInit={setReactFlowInstance}
                        onDrop={onDrop}
                        onDragOver={onDragOver}
                        onNodeClick={onNodeClick}
                        nodeTypes={nodeTypes}
                        fitView
                    >
                        <Controls />
                        <Background color="#aaa" gap={16} />
                    </ReactFlow>
                </ReactFlowProvider>

                <div className="absolute top-4 right-4 z-10 flex gap-2">
                    <button
                        onClick={handleSaveWorkflow}
                        disabled={saving}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg shadow-lg hover:bg-primary/90 font-bold"
                    >
                        {saving ? 'Salvando...' : 'Salvar Workflow'}
                    </button>
                </div>
            </div>
            <Sidebar />

            {/* Configuration Modal */}
            <Modal isOpen={configOpen} onClose={() => setConfigOpen(false)} title="Configurar Ação">
                <div className="space-y-4">
                    {selectedNode?.type === 'trigger' && (
                        <div>
                            <label className="block text-sm font-medium mb-2">Tipo de Gatilho</label>
                            <select
                                className="w-full p-2 border rounded-md bg-background"
                                value={selectedNode.data.type}
                                onChange={(e) => {
                                    setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, type: e.target.value } } : n));
                                    setSelectedNode(prev => prev ? { ...prev, data: { ...prev.data, type: e.target.value } } : null);
                                }}
                            >
                                <option value="CONTACT_CREATED">Contato Criado</option>
                                <option value="TAG_ADDED">Tag Adicionada</option>
                                <option value="PIPELINE_STAGE_CHANGED">Estágio do Pipeline Alterado</option>
                                <option value="FORM_SUBMITTED">Formulário Enviado</option>
                            </select>
                        </div>
                    )}

                    {selectedNode?.data.type === 'SEND_EMAIL' && (
                        <>
                            <input
                                className="w-full p-2 border rounded-md bg-background"
                                placeholder="Para (Email)"
                                value={nodeConfig.to || ''}
                                onChange={e => setNodeConfig({ ...nodeConfig, to: e.target.value })}
                            />
                            <input
                                className="w-full p-2 border rounded-md bg-background"
                                placeholder="Assunto"
                                value={nodeConfig.subject || ''}
                                onChange={e => setNodeConfig({ ...nodeConfig, subject: e.target.value })}
                            />
                            <textarea
                                className="w-full p-2 border rounded-md bg-background"
                                placeholder="Mensagem"
                                rows={4}
                                value={nodeConfig.body || ''}
                                onChange={e => setNodeConfig({ ...nodeConfig, body: e.target.value })}
                            />
                        </>
                    )}

                    {selectedNode?.data.type === 'SEND_SMS' && (
                        <>
                            <input
                                className="w-full p-2 border rounded-md bg-background"
                                placeholder="Para (Telefone)"
                                value={nodeConfig.to || ''}
                                onChange={e => setNodeConfig({ ...nodeConfig, to: e.target.value })}
                            />
                            <textarea
                                className="w-full p-2 border rounded-md bg-background"
                                placeholder="Mensagem"
                                rows={3}
                                value={nodeConfig.message || ''}
                                onChange={e => setNodeConfig({ ...nodeConfig, message: e.target.value })}
                            />
                        </>
                    )}

                    {/* Add other config fields as needed */}

                    <div className="flex justify-end gap-2 pt-4">
                        <button
                            onClick={() => setConfigOpen(false)}
                            className="px-4 py-2 border rounded-md hover:bg-muted"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleConfigSave}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                        >
                            Salvar Configuração
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

function getActionSummary(action: any) {
    if (action.type === 'SEND_EMAIL') return `Para: ${action.config.to || '?'}`;
    if (action.type === 'SEND_SMS') return `Para: ${action.config.to || '?'}`;
    if (action.type === 'ADD_TAG') return `Tag: ${action.config.tag || '?'}`;
    return '';
}
