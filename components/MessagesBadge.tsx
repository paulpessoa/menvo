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
            // 1. Buscar todas as conversas onde o usuário participa
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

            // 2. Contar mensagens não lidas enviadas por OUTRA pessoa
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

        // 3. Subscrever ao Realtime de forma IDÊNTICA à página de mensagens
        // O Supabase filtra automaticamente os eventos via RLS
        const channel = supabase
            .channel('unread-badge-sync')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                },
                () => {
                    console.log('[BADGE] Nova mensagem detectada');
                    loadUnreadCount();
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'messages',
                },
                (payload: any) => {
                    // Atualiza se o status de leitura mudou (importante para zerar o sino ao ler)
                    if (payload.new.read_at !== payload.old.read_at) {
                        console.log('[BADGE] Status de leitura alterado');
                        loadUnreadCount();
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'messages',
                },
                () => {
                    loadUnreadCount();
                }
            )
            .subscribe();

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
