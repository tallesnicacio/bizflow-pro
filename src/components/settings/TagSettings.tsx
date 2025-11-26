'use client';

import { useState } from 'react';
import { Plus, Tag as TagIcon, Trash2, X } from 'lucide-react';
import { createTag, deleteTag } from '@/lib/tag-actions';
import { Modal } from '@/components/Modal';

interface TagSettingsProps {
    tags: any[];
    tenantId: string;
}

const PRESET_COLORS = [
    'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500',
    'bg-lime-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500',
    'bg-cyan-500', 'bg-sky-500', 'bg-blue-500', 'bg-indigo-500',
    'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500',
    'bg-rose-500', 'bg-slate-500'
];

export function TagSettings({ tags: initialTags, tenantId }: TagSettingsProps) {
    const [tags, setTags] = useState(initialTags);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [tagName, setTagName] = useState('');
    const [tagColor, setTagColor] = useState('bg-blue-500');

    async function handleCreateTag(e: React.FormEvent) {
        e.preventDefault();
        setIsLoading(true);
        try {
            const result = await createTag({ name: tagName, color: tagColor, tenantId });
            if (result.success) {
                setTags([...tags, result.tag].sort((a, b) => a.name.localeCompare(b.name)));
                setIsModalOpen(false);
                setTagName('');
                setTagColor('bg-blue-500');
            } else {
                alert(result.error);
            }
        } catch (error) {
            console.error('Failed to create tag', error);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleDeleteTag(tagId: string) {
        if (!confirm('Are you sure you want to delete this tag?')) return;

        try {
            const result = await deleteTag(tagId, tenantId);
            if (result.success) {
                setTags(tags.filter(t => t.id !== tagId));
            } else {
                alert(result.error);
            }
        } catch (error) {
            console.error('Failed to delete tag', error);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-medium">Tags</h3>
                    <p className="text-sm text-muted-foreground">Organize your contacts with custom tags.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                    <Plus size={18} />
                    Create Tag
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {tags.map((tag) => (
                    <div key={tag.id} className="glass-panel p-4 flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded-full ${tag.color}`} />
                            <div>
                                <h4 className="font-medium">{tag.name}</h4>
                                <p className="text-xs text-muted-foreground">
                                    {tag._count?.contacts || 0} contacts
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => handleDeleteTag(tag.id)}
                            className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                            title="Delete Tag"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}

                {tags.length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                        <TagIcon className="mx-auto h-12 w-12 opacity-20 mb-4" />
                        <p>No tags created yet.</p>
                    </div>
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Create New Tag"
            >
                <form onSubmit={handleCreateTag} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium mb-1">Tag Name</label>
                        <input
                            required
                            className="w-full bg-background border border-input rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                            value={tagName}
                            onChange={e => setTagName(e.target.value)}
                            placeholder="e.g. VIP Client"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Color</label>
                        <div className="grid grid-cols-6 gap-2">
                            {PRESET_COLORS.map((color) => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => setTagColor(color)}
                                    className={`w-8 h-8 rounded-full ${color} transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring ${tagColor === color ? 'ring-2 ring-offset-2 ring-ring scale-110' : ''
                                        }`}
                                />
                            ))}
                        </div>
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
                            {isLoading ? 'Creating...' : 'Create Tag'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
