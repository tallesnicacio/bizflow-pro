'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    getFunnel,
    updateFunnel,
    createFunnelPage,
    updateFunnelPage,
    deleteFunnelPage,
} from '@/lib/funnel-actions';
import { PAGE_BLOCK_TYPES, generateSlug } from '@/lib/form-utils';
import { getForms } from '@/lib/form-actions';
import { Modal } from '@/components/Modal';

const TENANT_ID = 'demo-tenant-1';

interface Block {
    id: string;
    type: string;
    content: any;
}

export default function FunnelEditorPage() {
    const router = useRouter();
    const params = useParams();
    const funnelId = params?.funnelId as string;

    const [funnel, setFunnel] = useState<any>(null);
    const [forms, setForms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
    const [blocks, setBlocks] = useState<Block[]>([]);
    const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

    const [showNewPageModal, setShowNewPageModal] = useState(false);
    const [newPageName, setNewPageName] = useState('');
    const [newPageSlug, setNewPageSlug] = useState('');

    const [activePanel, setActivePanel] = useState<'pages' | 'blocks' | 'settings'>('blocks');

    useEffect(() => {
        loadData();
    }, [funnelId]);

    async function loadData() {
        try {
            const [funnelData, formsData] = await Promise.all([
                getFunnel(funnelId),
                getForms(TENANT_ID),
            ]);
            setFunnel(funnelData);
            setForms(formsData);

            // Select first page
            if (funnelData?.pages && funnelData.pages.length > 0) {
                const firstPage = funnelData.pages[0];
                setSelectedPageId(firstPage.id);
                setBlocks((firstPage.content as any)?.blocks || []);
            }
        } catch (error) {
            console.error('Failed to load funnel:', error);
        } finally {
            setLoading(false);
        }
    }

    function selectPage(pageId: string) {
        const page = funnel.pages.find((p: any) => p.id === pageId);
        if (page) {
            setSelectedPageId(pageId);
            setBlocks((page.content as any)?.blocks || []);
            setSelectedBlockId(null);
        }
    }

    async function handleAddPage() {
        if (!newPageName.trim()) {
            alert('Nome da página é obrigatório');
            return;
        }

        try {
            await createFunnelPage({
                funnelId,
                name: newPageName,
                slug: newPageSlug || generateSlug(newPageName),
                content: { blocks: [] },
            });
            setShowNewPageModal(false);
            setNewPageName('');
            setNewPageSlug('');
            await loadData();
        } catch (error) {
            console.error('Failed to create page:', error);
        }
    }

    async function handleDeletePage(pageId: string) {
        if (!confirm('Tem certeza que deseja excluir esta página?')) return;

        try {
            await deleteFunnelPage(pageId);
            if (selectedPageId === pageId) {
                setSelectedPageId(null);
                setBlocks([]);
            }
            await loadData();
        } catch (error) {
            console.error('Failed to delete page:', error);
        }
    }

    function addBlock(type: string) {
        const blockType = PAGE_BLOCK_TYPES.find((b) => b.type === type);
        if (!blockType) return;

        const newBlock: Block = {
            id: `block-${Date.now()}`,
            type,
            content: { ...blockType.defaultContent },
        };
        setBlocks([...blocks, newBlock]);
        setSelectedBlockId(newBlock.id);
    }

    function updateBlock(blockId: string, content: any) {
        setBlocks(blocks.map((b) => (b.id === blockId ? { ...b, content } : b)));
    }

    function removeBlock(blockId: string) {
        setBlocks(blocks.filter((b) => b.id !== blockId));
        if (selectedBlockId === blockId) {
            setSelectedBlockId(null);
        }
    }

    function moveBlock(blockId: string, direction: 'up' | 'down') {
        const index = blocks.findIndex((b) => b.id === blockId);
        if (index === -1) return;

        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= blocks.length) return;

        const newBlocks = [...blocks];
        [newBlocks[index], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[index]];
        setBlocks(newBlocks);
    }

    async function handleSave() {
        if (!selectedPageId) return;

        setSaving(true);
        try {
            await updateFunnelPage(selectedPageId, {
                content: { blocks },
            });
            await loadData();
        } catch (error) {
            console.error('Failed to save page:', error);
            alert('Erro ao salvar página');
        } finally {
            setSaving(false);
        }
    }

    const selectedBlock = blocks.find((b) => b.id === selectedBlockId);
    const selectedPage = funnel?.pages?.find((p: any) => p.id === selectedPageId);

    if (loading) {
        return (
            <div className="p-8">
                <div className="text-center">Carregando funnel...</div>
            </div>
        );
    }

    if (!funnel) {
        return (
            <div className="p-8">
                <div className="text-center">Funnel não encontrado</div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col">
            {/* Top Bar */}
            <div className="h-14 border-b border-border bg-card flex items-center justify-between px-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/funnels')}
                        className="text-muted-foreground hover:text-foreground"
                    >
                        ← Voltar
                    </button>
                    <span className="font-semibold">{funnel.name}</span>
                    {selectedPage && (
                        <span className="text-muted-foreground">/ {selectedPage.name}</span>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <a
                        href={`/p/${funnel.slug}${selectedPage ? `/${selectedPage.slug}` : ''}`}
                        target="_blank"
                        className="px-3 py-1.5 bg-muted hover:bg-muted/80 rounded text-sm font-medium"
                    >
                        Preview
                    </a>
                    <button
                        onClick={handleSave}
                        disabled={saving || !selectedPageId}
                        className="px-4 py-1.5 bg-primary text-primary-foreground rounded hover:bg-primary/90 text-sm font-medium disabled:opacity-50"
                    >
                        {saving ? 'Salvando...' : 'Salvar'}
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar - Pages & Blocks */}
                <div className="w-64 border-r border-border bg-card flex flex-col">
                    {/* Tabs */}
                    <div className="flex border-b border-border">
                        <button
                            onClick={() => setActivePanel('pages')}
                            className={`flex-1 py-2 text-sm font-medium ${activePanel === 'pages' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'
                                }`}
                        >
                            Páginas
                        </button>
                        <button
                            onClick={() => setActivePanel('blocks')}
                            className={`flex-1 py-2 text-sm font-medium ${activePanel === 'blocks' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'
                                }`}
                        >
                            Blocos
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4">
                        {activePanel === 'pages' && (
                            <div className="space-y-2">
                                {funnel.pages.map((page: any) => (
                                    <div
                                        key={page.id}
                                        className={`flex items-center justify-between p-2 rounded cursor-pointer ${selectedPageId === page.id ? 'bg-primary/10' : 'hover:bg-muted'
                                            }`}
                                        onClick={() => selectPage(page.id)}
                                    >
                                        <span className="text-sm truncate">{page.name}</span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeletePage(page.id);
                                            }}
                                            className="text-destructive hover:text-destructive/80 opacity-0 group-hover:opacity-100"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                                <button
                                    onClick={() => setShowNewPageModal(true)}
                                    className="w-full py-2 text-sm text-muted-foreground hover:text-foreground border-2 border-dashed border-border rounded hover:border-primary"
                                >
                                    + Nova Página
                                </button>
                            </div>
                        )}

                        {activePanel === 'blocks' && (
                            <div className="space-y-2">
                                {PAGE_BLOCK_TYPES.map((blockType) => (
                                    <button
                                        key={blockType.type}
                                        onClick={() => addBlock(blockType.type)}
                                        disabled={!selectedPageId}
                                        className="w-full p-3 text-left text-sm bg-muted hover:bg-muted/80 rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        <span className="mr-2">{blockType.icon}</span>
                                        {blockType.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Canvas */}
                <div className="flex-1 bg-muted/30 overflow-y-auto p-8">
                    {!selectedPageId ? (
                        <div className="h-full flex items-center justify-center text-muted-foreground">
                            Selecione ou crie uma página
                        </div>
                    ) : blocks.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                            <p className="mb-4">Nenhum bloco adicionado</p>
                            <p className="text-sm">Adicione blocos pelo painel lateral</p>
                        </div>
                    ) : (
                        <div className="max-w-4xl mx-auto space-y-4">
                            {blocks.map((block, index) => (
                                <div
                                    key={block.id}
                                    className={`relative group bg-card border rounded-lg overflow-hidden ${selectedBlockId === block.id ? 'border-primary ring-2 ring-primary/20' : 'border-border'
                                        }`}
                                    onClick={() => setSelectedBlockId(block.id)}
                                >
                                    {/* Block Controls */}
                                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                moveBlock(block.id, 'up');
                                            }}
                                            disabled={index === 0}
                                            className="p-1 bg-background border rounded hover:bg-muted disabled:opacity-30"
                                        >
                                            ↑
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                moveBlock(block.id, 'down');
                                            }}
                                            disabled={index === blocks.length - 1}
                                            className="p-1 bg-background border rounded hover:bg-muted disabled:opacity-30"
                                        >
                                            ↓
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeBlock(block.id);
                                            }}
                                            className="p-1 bg-background border rounded hover:bg-destructive hover:text-white"
                                        >
                                            ✕
                                        </button>
                                    </div>

                                    {/* Block Preview */}
                                    <BlockPreview block={block} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right Sidebar - Block Settings */}
                <div className="w-80 border-l border-border bg-card overflow-y-auto">
                    {selectedBlock ? (
                        <div className="p-4">
                            <h3 className="font-semibold mb-4">
                                {PAGE_BLOCK_TYPES.find((b) => b.type === selectedBlock.type)?.label || 'Bloco'}
                            </h3>
                            <BlockEditor
                                block={selectedBlock}
                                forms={forms}
                                onUpdate={(content) => updateBlock(selectedBlock.id, content)}
                            />
                        </div>
                    ) : (
                        <div className="p-4 text-center text-muted-foreground">
                            Selecione um bloco para editar
                        </div>
                    )}
                </div>
            </div>

            {/* New Page Modal */}
            <Modal isOpen={showNewPageModal} onClose={() => setShowNewPageModal(false)} title="Nova Página">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Nome da Página *</label>
                        <input
                            type="text"
                            value={newPageName}
                            onChange={(e) => {
                                setNewPageName(e.target.value);
                                setNewPageSlug(generateSlug(e.target.value));
                            }}
                            className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                            placeholder="Ex: Página de Obrigado"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Slug (URL)</label>
                        <input
                            type="text"
                            value={newPageSlug}
                            onChange={(e) => setNewPageSlug(e.target.value)}
                            className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                            placeholder="obrigado"
                        />
                    </div>
                    <div className="flex gap-3 justify-end pt-4">
                        <button
                            onClick={() => setShowNewPageModal(false)}
                            className="px-4 py-2 border border-border rounded-lg hover:bg-muted font-medium"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleAddPage}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium"
                        >
                            Adicionar Página
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

// Block Preview Component
function BlockPreview({ block }: { block: Block }) {
    const { type, content } = block;

    switch (type) {
        case 'hero':
            return (
                <div className="py-16 px-8 text-center bg-gradient-to-br from-primary/10 to-primary/5">
                    <h1 className="text-3xl font-bold mb-4">{content.title}</h1>
                    <p className="text-lg text-muted-foreground mb-6">{content.subtitle}</p>
                    <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium">
                        {content.buttonText}
                    </button>
                </div>
            );
        case 'text':
            return (
                <div className={`p-6 text-${content.alignment || 'left'}`}>
                    <p>{content.content}</p>
                </div>
            );
        case 'cta':
            return (
                <div className="py-12 px-8 text-center bg-primary/5">
                    <h2 className="text-2xl font-bold mb-2">{content.title}</h2>
                    <p className="text-muted-foreground mb-6">{content.subtitle}</p>
                    <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium">
                        {content.buttonText}
                    </button>
                </div>
            );
        case 'features':
            return (
                <div className="py-12 px-8">
                    <h2 className="text-2xl font-bold text-center mb-8">{content.title}</h2>
                    <div className="grid grid-cols-3 gap-6">
                        {(content.items || []).map((item: any, i: number) => (
                            <div key={i} className="text-center">
                                <div className="text-3xl mb-2">{item.icon}</div>
                                <h3 className="font-semibold mb-1">{item.title}</h3>
                                <p className="text-sm text-muted-foreground">{item.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            );
        case 'form':
            return (
                <div className="p-8 text-center text-muted-foreground">
                    [Formulário: {content.formId || 'Nenhum selecionado'}]
                </div>
            );
        case 'divider':
            return <div className={`h-${content.height || 40}px`}></div>;
        default:
            return (
                <div className="p-6 text-center text-muted-foreground">
                    [{type}]
                </div>
            );
    }
}

// Block Editor Component
function BlockEditor({
    block,
    forms,
    onUpdate,
}: {
    block: Block;
    forms: any[];
    onUpdate: (content: any) => void;
}) {
    const { type, content } = block;

    const handleChange = (field: string, value: any) => {
        onUpdate({ ...content, [field]: value });
    };

    switch (type) {
        case 'hero':
        case 'cta':
            return (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Título</label>
                        <input
                            type="text"
                            value={content.title || ''}
                            onChange={(e) => handleChange('title', e.target.value)}
                            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Subtítulo</label>
                        <textarea
                            value={content.subtitle || ''}
                            onChange={(e) => handleChange('subtitle', e.target.value)}
                            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm"
                            rows={2}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Texto do Botão</label>
                        <input
                            type="text"
                            value={content.buttonText || ''}
                            onChange={(e) => handleChange('buttonText', e.target.value)}
                            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">URL do Botão</label>
                        <input
                            type="text"
                            value={content.buttonUrl || ''}
                            onChange={(e) => handleChange('buttonUrl', e.target.value)}
                            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm"
                        />
                    </div>
                </div>
            );
        case 'text':
            return (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Conteúdo</label>
                        <textarea
                            value={content.content || ''}
                            onChange={(e) => handleChange('content', e.target.value)}
                            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm"
                            rows={5}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Alinhamento</label>
                        <select
                            value={content.alignment || 'left'}
                            onChange={(e) => handleChange('alignment', e.target.value)}
                            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm"
                        >
                            <option value="left">Esquerda</option>
                            <option value="center">Centro</option>
                            <option value="right">Direita</option>
                        </select>
                    </div>
                </div>
            );
        case 'form':
            return (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Formulário</label>
                        <select
                            value={content.formId || ''}
                            onChange={(e) => handleChange('formId', e.target.value)}
                            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm"
                        >
                            <option value="">Selecione um formulário</option>
                            {forms.map((form) => (
                                <option key={form.id} value={form.id}>
                                    {form.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            );
        default:
            return (
                <div className="text-sm text-muted-foreground">
                    Editor não disponível para este tipo de bloco
                </div>
            );
    }
}
