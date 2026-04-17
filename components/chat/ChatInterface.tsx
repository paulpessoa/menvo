'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ChatInterfaceProps {
    mentorId: string; // This is the ID of the person we are talking to
    currentUserId: string;
    mentorName: string;
    mentorAvatar?: string;
}

interface Message {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    created_at: string;
}

export function ChatInterface({
    mentorId,
    currentUserId,
    mentorName,
    mentorAvatar,
}: ChatInterfaceProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [realtimeStatus, setRealtimeStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const supabase = createClient();

    // Reset state and load messages when mentorId changes
    useEffect(() => {
        setMessages([]);
        setConversationId(null);
        setNewMessage('');
        setIsTyping(false);
        loadMessages();
    }, [mentorId]);

    // Focus input on initial load and when mentorId changes
    useEffect(() => {
        if (!loading) {
            inputRef.current?.focus();
        }
    }, [loading, mentorId]);

    // Scroll to bottom when messages update
    useEffect(() => {
        if (messages.length > 0) {
            const timer = setTimeout(() => {
                scrollToBottom();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [messages.length]);

    // Realtime subscription
    useEffect(() => {
        if (!conversationId) return;

        console.log('[CHAT] 🔌 Subscribing to conversation:', conversationId);

        const channel = supabase
            .channel(`conversation:${conversationId}`, {
                config: {
                    broadcast: { self: false },
                    presence: { key: currentUserId },
                },
            })
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${conversationId}`,
                },
                (payload: any) => {
                    const newMessage = payload.new as Message;
                    
                    setMessages((prev) => {
                        if (prev.some(m => m.id === newMessage.id)) return prev;
                        
                        if (newMessage.sender_id !== currentUserId) {
                            markAsRead(conversationId);
                        }
                        return [...prev, newMessage];
                    });
                }
            )
            .on('broadcast', { event: 'typing' }, () => {
                setIsTyping(true);
                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
            })
            .subscribe((status: string) => {
                if (status === 'SUBSCRIBED') setRealtimeStatus('connected');
                else if (status === 'CLOSED') setRealtimeStatus('disconnected');
            });

        return () => {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            supabase.removeChannel(channel);
        };
    }, [conversationId, currentUserId, supabase]);

    const loadMessages = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/chat/messages/${mentorId}`);

            if (!response.ok) throw new Error('Erro ao carregar mensagens');

            const data = await response.json();
            setMessages(data.messages || []);
            setConversationId(data.conversationId);

            if (data.conversationId) {
                markAsRead(data.conversationId);
            }
        } catch (error) {
            console.error('[CHAT] Error loading messages:', error);
            toast.error('Erro ao carregar mensagens');
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (convId: string) => {
        try {
            await fetch('/api/chat/mark-read', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conversationId: convId }),
            });
        } catch (error) {
            console.error('[CHAT] Error marking as read:', error);
        }
    };

    const handleTyping = () => {
        if (!conversationId) return;
        supabase.channel(`conversation:${conversationId}`).send({
            type: 'broadcast',
            event: 'typing',
            payload: { userId: currentUserId },
        });
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || sending) return;

        const content = newMessage.trim();
        setNewMessage('');
        setSending(true);
        
        // Mantém o foco no input
        inputRef.current?.focus();

        try {
            const response = await fetch('/api/chat/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mentorId, content }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Erro ao enviar mensagem');
            }

            const data = await response.json();
            const optimisticMessage: Message = {
                id: data.messageId,
                conversation_id: data.conversationId,
                sender_id: currentUserId,
                content,
                created_at: new Date().toISOString(),
            };

            setMessages((prev) => {
                if (prev.some(m => m.id === optimisticMessage.id)) return prev;
                return [...prev, optimisticMessage];
            });
            
            // Garante foco após renderizar mensagem otimista
            setTimeout(() => inputRef.current?.focus(), 0);

        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Erro ao enviar mensagem');
            setNewMessage(content);
            inputRef.current?.focus();
        } finally {
            setSending(false);
        }
    };

    const formatTime = (timestamp: string) => {
        return new Date(timestamp).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full min-h-[500px] bg-white rounded-lg overflow-hidden border">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b bg-primary/5">
                {mentorAvatar && (
                    <img
                        src={mentorAvatar}
                        alt={mentorName}
                        className="w-10 h-10 rounded-full object-cover border"
                    />
                )}
                <div>
                    <h3 className="font-semibold text-gray-900">{mentorName}</h3>
                    <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${realtimeStatus === 'connected' ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span className="text-xs text-gray-500">
                            {realtimeStatus === 'connected' ? 'Online' : 'Conectando...'}
                        </span>
                        {isTyping && (
                            <span className="text-xs text-primary animate-pulse ml-2 italic">digitando...</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-60">
                        <Send className="w-12 h-12 mb-2" />
                        <p>Nenhuma mensagem ainda.</p>
                        <p className="text-sm">Envie uma mensagem para começar a conversa!</p>
                    </div>
                ) : (
                    messages.map((message) => {
                        const isCurrentUser = message.sender_id === currentUserId;
                        return (
                            <div
                                key={message.id}
                                className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-2xl px-4 py-2 shadow-sm ${isCurrentUser
                                        ? 'bg-primary text-primary-foreground rounded-tr-none'
                                        : 'bg-white text-gray-900 border rounded-tl-none'
                                        }`}
                                >
                                    <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                                    <p
                                        className={`text-[10px] mt-1 text-right ${isCurrentUser ? 'opacity-80' : 'text-gray-400'
                                            }`}
                                    >
                                        {formatTime(message.created_at)}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t bg-white">
                <div className="flex gap-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={newMessage}
                        onChange={(e) => {
                            setNewMessage(e.target.value);
                            handleTyping();
                        }}
                        placeholder="Digite sua mensagem..."
                        disabled={sending}
                        className="flex-1 px-4 py-2 bg-gray-100 border-none rounded-full text-sm focus:ring-2 focus:ring-primary focus:bg-white transition-all disabled:opacity-50"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || sending}
                        className="p-2 bg-primary text-primary-foreground rounded-full hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {sending ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Send className="w-5 h-5" />
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
