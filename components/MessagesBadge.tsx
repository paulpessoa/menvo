'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/lib/auth';

export function MessagesBadge() {
    const { user, isAuthenticated } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);
    const supabase = createClient();

    const loadUnreadCount = useCallback(async () => {
        if (!user) return;

        try {
            // Buscar todas as conversas do usuário (ele pode ser mentor ou mentee)
            const { data: conversations, error: convError } = await supabase
                .from('conversations')
                .select('id')
                .or(`mentor_id.eq.${user.id},mentee_id.eq.${user.id}`);

            if (convError) throw convError;

            if (!conversations || conversations.length === 0) {
                setUnreadCount(0);
                return;
            }

            const conversationIds = conversations.map((c: any) => c.id);

            // Contar mensagens não lidas onde o usuário NÃO é o remetente
            const { count, error: msgError } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .in('conversation_id', conversationIds)
                .neq('sender_id', user.id)
                .is('read_at', null);

            if (msgError) throw msgError;

            setUnreadCount(count || 0);
        } catch (error) {
            console.error('[BADGE] Erro ao carregar contador:', error);
        }
    }, [user, supabase]);

    useEffect(() => {
        if (!isAuthenticated || !user) return;

        loadUnreadCount();

        // Inscrição Realtime simplificada e robusta
        // Escuta qualquer inserção ou update na tabela de mensagens
        // O Supabase Realtime filtrará automaticamente baseado nas permissões de RLS do usuário
        const channel = supabase
            .channel('unread-badge-realtime')
            .on(
                'postgres_changes',
                {
                    event: '*', // Escuta INSERT, UPDATE e DELETE
                    schema: 'public',
                    table: 'messages',
                },
                () => {
                    // Recarrega o contador para garantir precisão
                    loadUnreadCount();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [isAuthenticated, user, loadUnreadCount, supabase]);

    if (!isAuthenticated) return null;

    return (
        <Button variant="ghost" size="icon" className="relative" asChild title="Mensagens">
            <Link href="/messages">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-sm ring-2 ring-background">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </Link>
        </Button>
    );
}
