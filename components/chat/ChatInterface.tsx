'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ChatInterfaceProps {
    mentorId: string;
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
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const supabase = createClient();

    // Carregar mensagens ao montar
    useEffect(() => {
        loadMessages();
    }, [mentorId]);

    // Scroll para o final quando novas mensagens chegarem
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Subscrever ao Realtime quando conversationId estiver disponível
    useEffect(() => {
        if (!conversationId) return;

        console.log('[CHAT] 🔌 Subscrevendo ao Realtime para conversa:', conversationId);

        // Criar subscription para novas mensagens e typing indicator
        const channel = supabase
            .channel(`conversation:${conversationId}`, {
                config: {
                    broadcast: { self: false }, // Não receber próprios eventos
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
                    console.log('[CHAT] 🔥 REALTIME DISPAROU! Nova mensagem:', payload);
                    const newMessage = payload.new as Message;

                    // Evitar duplicatas
                    setMessages((prev) => {
                        const exists = prev.some(m => m.id === newMessage.id);
                        if (exists) {
                            console.log('[CHAT] ⚠️ Mensagem duplicada, ignorando');
                            return prev;
                        }
                        console.log('[CHAT] ✅ Adicionando mensagem ao estado');
                        return [...prev, newMessage];
                    });
                }
            )
            .on('broadcast', { event: 'typing' }, (payload: any) => {
                console.log('[CHAT] ✍️ Usuário está digitando:', payload);
                setIsTyping(true);

                // Limpar timeout anterior
                if (typingTimeoutRef.current) {
                    clearTimeout(typingTimeoutRef.current);
                }

                // Parar de mostrar "digitando" após 3 segundos
                typingTimeoutRef.current = setTimeout(() => {
                    setIsTyping(false);
                }, 3000);
            })
            .subscribe((status, err) => {
                console.log('[CHAT] 📡 Status da subscription:', status);
                if (err) console.error('[CHAT] ❌ Erro:', err);

                if (status === 'SUBSCRIBED') {
                    console.log('[CHAT] ✅ REALTIME CONECTADO!');
                    setRealtimeStatus('connected');
                } else if (status === 'CLOSED') {
                    console.log('[CHAT] ❌ REALTIME DESCONECTADO');
                    setRealtimeStatus('disconnected');
                } else {
                    setRealtimeStatus('connecting');
                }
            });

        // Cleanup: unsubscribe ao desmontar
        return () => {
            console.log('[CHAT] Removendo subscription');
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            supabase.removeChannel(channel);
        };
    }, [conversationId]);

    const loadMessages = async () => {
        try {
            setLoading(true);
            console.log('[CHAT] Carregando mensagens para mentorId:', mentorId, 'currentUserId:', currentUserId);
            const response = await fetch(`/api/chat/messages/${mentorId}`);

            if (!response.ok) {
                throw new Error('Erro ao carregar mensagens');
            }

            const data = await response.json();
            console.log('[CHAT] Dados recebidos:', data);
            console.log('[CHAT] ConversationId:', data.conversationId);
            setMessages(data.messages || []);
            setConversationId(data.conversationId);

            // Marcar mensagens como lidas após carregar
            if (data.conversationId) {
                markAsRead(data.conversationId);
            }
        } catch (error) {
            console.error('[CHAT] Erro ao carregar mensagens:', error);
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
            console.log('[CHAT] ✅ Mensagens marcadas como lidas');
        } catch (error) {
            console.error('[CHAT] Erro ao marcar como lida:', error);
        }
    };

    const handleTyping = () => {
        if (!conversationId) return;

        // Enviar evento de "digitando" via broadcast
        supabase.channel(`conversation:${conversationId}`).send({
            type: 'broadcast',
            event: 'typing',
            payload: { userId: currentUserId },
        });
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newMessage.trim() || sending) return;

        const messageContent = newMessage.trim();
        setNewMessage('');
        setSending(true);

        try {
            const response = await fetch('/api/chat/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    mentorId,
                    content: messageContent,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Erro ao enviar mensagem');
            }

            const data = await response.json();
            console.log('[CHAT] Mensagem enviada:', data);

            // Adicionar mensagem otimisticamente (fallback se Realtime falhar)
            // O Realtime vai adicionar de novo, mas temos proteção contra duplicatas
            const optimisticMessage: Message = {
                id: data.messageId,
                conversation_id: data.conversationId,
                sender_id: currentUserId,
                content: messageContent,
                created_at: new Date().toISOString(),
            };

            setMessages((prev) => {
                const exists = prev.some(m => m.id === optimisticMessage.id);
                if (!exists) {
                    return [...prev, optimisticMessage];
                }
                return prev;
            });
        } catch (error) {
            console.error('[CHAT] Erro ao enviar mensagem:', error);
            toast.error(error instanceof Error ? error.message : 'Erro ao enviar mensagem');
            setNewMessage(messageContent); // Restaurar mensagem
        } finally {
            setSending(false);
        }
    };

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[600px] bg-white rounded-lg shadow-lg">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b bg-indigo-50">
                {mentorAvatar && (
                    <img
                        src={mentorAvatar}
                        alt={mentorName}
                        className="w-10 h-10 rounded-full"
                    />
                )}
                <div>
                    <h3 className="font-semibold text-gray-900">{mentorName}</h3>
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${realtimeStatus === 'connected' ? 'bg-green-500' :
                            realtimeStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                                'bg-red-500'
                            }`} />
                        <p className="text-xs text-gray-500">
                            {isTyping ? (
                                <span className="italic">digitando...</span>
                            ) : realtimeStatus === 'connected' ? 'Online' :
                                realtimeStatus === 'connecting' ? 'Conectando...' :
                                    'Desconectado'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="text-center text-gray-500 mt-8">
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
                                    className={`max-w-[70%] rounded-lg px-4 py-2 ${isCurrentUser
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-gray-100 text-gray-900'
                                        }`}
                                >
                                    <p className="text-sm">{message.content}</p>
                                    <p
                                        className={`text-xs mt-1 ${isCurrentUser ? 'text-indigo-200' : 'text-gray-500'
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
            <form onSubmit={handleSendMessage} className="p-4 border-t">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => {
                            setNewMessage(e.target.value);
                            handleTyping();
                        }}
                        placeholder="Digite sua mensagem..."
                        disabled={sending}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || sending}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
