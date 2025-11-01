'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/lib/auth';

export function MessagesBadge() {
    const { user, isAuthenticated } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);
    const supabase = createClient();

    useEffect(() => {
        if (!isAuthenticated || !user) return;

        loadUnreadCount();

        // Subscrever ao Realtime para atualizar o contador
        const channel = supabase
            .channel('unread-messages')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                },
                () => {
                    // Quando uma nova mensagem chega, recarregar o contador
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
                () => {
                    // Quando uma mensagem é marcada como lida, recarregar
                    loadUnreadCount();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [isAuthenticated, user]);

    const loadUnreadCount = async () => {
        if (!user) return;

        try {
            // Buscar todas as conversas do usuário
            const { data: conversations } = await supabase
                .from('conversations')
                .select('id')
                .or(`mentor_id.eq.${user.id},mentee_id.eq.${user.id}`);

            if (!conversations || conversations.length === 0) {
                setUnreadCount(0);
                return;
            }

            const conversationIds = conversations.map((c: any) => c.id);

            // Contar mensagens não lidas em todas as conversas
            const { count } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .in('conversation_id', conversationIds)
                .neq('sender_id', user.id)
                .is('read_at', null);

            setUnreadCount(count || 0);
        } catch (error) {
            console.error('Erro ao carregar contador de não lidas:', error);
        }
    };

    if (!isAuthenticated) return null;

    return (
        <Button variant="ghost" size="icon" className="relative" asChild>
            <Link href="/messages">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </Link>
        </Button>
    );
}
