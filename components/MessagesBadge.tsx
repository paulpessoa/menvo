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
        if (!user?.id) return;

        try {
            // Buscar todas as conversas do usuário
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
    }, [user?.id, supabase]);

    useEffect(() => {
        if (!isAuthenticated || !user?.id) return;

        loadUnreadCount();

        // Inscrição Realtime com ID único para evitar conflitos
        const channelName = `unread-badge-${user.id}`;
        const channel = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'messages'
                },
                (payload) => {
                    console.log('[BADGE] Mudança detectada na tabela messages:', payload.eventType);
                    loadUnreadCount();
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('[BADGE] Realtime conectado com sucesso');
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [isAuthenticated, user?.id, loadUnreadCount, supabase]);

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
