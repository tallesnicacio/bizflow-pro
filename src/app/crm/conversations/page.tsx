'use client';

import { useState, useEffect } from 'react';
import { Send, Phone, Mail, MessageSquare, User, Loader2 } from 'lucide-react';
import { getConversations, getConversation, sendMessage } from '@/lib/conversation-actions';
import { getContacts } from '@/lib/crm-actions';
import { cn } from '@/lib/utils';

const TENANT_ID = 'demo-tenant-1';

export default function ConversationsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [conversations, setConversations] = useState<any[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<any>(null);
    const [contacts, setContacts] = useState<any[]>([]);
    const [messageInput, setMessageInput] = useState('');
    const [isNewMessage, setIsNewMessage] = useState(false);
    const [newMessageContactId, setNewMessageContactId] = useState('');

    useEffect(() => {
        loadConversations();
        loadContacts();
    }, []);

    async function loadConversations() {
        setIsLoading(true);
        try {
            const data = await getConversations(TENANT_ID);
            setConversations(data);
        } catch (error) {
            console.error('Failed to load conversations', error);
        } finally {
            setIsLoading(false);
        }
    }

    async function loadContacts() {
        try {
            const data = await getContacts(TENANT_ID);
            setContacts(data);
        } catch (error) {
            console.error('Failed to load contacts', error);
        }
    }

    async function handleSelectConversation(id: string) {
        try {
            const data = await getConversation(id);
            setSelectedConversation(data);
            setIsNewMessage(false);
        } catch (error) {
            console.error('Failed to load conversation', error);
        }
    }

    async function handleSendMessage(e: React.FormEvent) {
        e.preventDefault();
        if (!messageInput.trim()) return;

        try {
            await sendMessage({
                conversationId: selectedConversation?.id,
                contactId: isNewMessage ? newMessageContactId : undefined,
                content: messageInput,
                channel: 'EMAIL', // Defaulting to EMAIL for now
                tenantId: TENANT_ID,
            });
            setMessageInput('');
            if (isNewMessage) {
                setIsNewMessage(false);
                setNewMessageContactId('');
                await loadConversations();
                // Ideally select the new conversation here
            } else {
                await handleSelectConversation(selectedConversation.id);
            }
        } catch (error) {
            console.error('Failed to send message', error);
        }
    }

    return (
        <div className="h-[calc(100vh-2rem)] flex gap-6">
            {/* Sidebar List */}
            <div className="w-1/3 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-foreground">Conversas</h1>
                    <button
                        onClick={() => { setSelectedConversation(null); setIsNewMessage(true); }}
                        className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all"
                    >
                        <MessageSquare size={20} />
                    </button>
                </div>

                <div className="glass-panel flex-1 overflow-y-auto p-2 space-y-2">
                    {isLoading ? (
                        <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
                    ) : conversations.length === 0 ? (
                        <p className="text-center text-muted-foreground p-4">Nenhuma conversa iniciada.</p>
                    ) : (
                        conversations.map(conv => (
                            <button
                                key={conv.id}
                                onClick={() => handleSelectConversation(conv.id)}
                                className={cn(
                                    "w-full text-left p-4 rounded-lg transition-all border border-transparent",
                                    selectedConversation?.id === conv.id
                                        ? "bg-primary/10 border-primary/20"
                                        : "hover:bg-accent border-border"
                                )}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-semibold">{conv.contact.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {new Date(conv.lastMessageAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground truncate">
                                    {conv.messages[0]?.content || 'Sem mensagens'}
                                </p>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 glass-panel flex flex-col overflow-hidden">
                {selectedConversation || isNewMessage ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">
                                    {isNewMessage ? <User size={20} /> : selectedConversation.contact.name.charAt(0)}
                                </div>
                                <div>
                                    {isNewMessage ? (
                                        <select
                                            className="bg-background border border-input rounded px-2 py-1 text-sm"
                                            value={newMessageContactId}
                                            onChange={e => setNewMessageContactId(e.target.value)}
                                        >
                                            <option value="">Selecione um contato...</option>
                                            {contacts.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <>
                                            <h2 className="font-bold">{selectedConversation.contact.name}</h2>
                                            <p className="text-xs text-muted-foreground">{selectedConversation.contact.email}</p>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button className="p-2 hover:bg-accent rounded-lg text-muted-foreground"><Phone size={18} /></button>
                                <button className="p-2 hover:bg-accent rounded-lg text-muted-foreground"><Mail size={18} /></button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {selectedConversation?.messages.map((msg: any) => (
                                <div
                                    key={msg.id}
                                    className={cn(
                                        "max-w-[70%] p-3 rounded-xl text-sm",
                                        msg.direction === 'OUTBOUND'
                                            ? "ml-auto bg-primary text-primary-foreground rounded-br-none"
                                            : "bg-muted rounded-bl-none"
                                    )}
                                >
                                    <p>{msg.content}</p>
                                    <p className={cn("text-[10px] mt-1 opacity-70", msg.direction === 'OUTBOUND' ? "text-primary-foreground" : "text-muted-foreground")}>
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Input */}
                        <form onSubmit={handleSendMessage} className="p-4 border-t border-border bg-muted/30">
                            <div className="flex gap-2">
                                <input
                                    className="flex-1 bg-background border border-input rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                                    placeholder="Digite sua mensagem..."
                                    value={messageInput}
                                    onChange={e => setMessageInput(e.target.value)}
                                    disabled={isNewMessage && !newMessageContactId}
                                />
                                <button
                                    type="submit"
                                    disabled={!messageInput.trim() || (isNewMessage && !newMessageContactId)}
                                    className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50"
                                >
                                    <Send size={20} />
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                        <MessageSquare size={48} className="mb-4 opacity-20" />
                        <p>Selecione uma conversa para começar</p>
                    </div>
                )}
            </div>
        </div>
    );
}
