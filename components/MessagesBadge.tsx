'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/utils/supabase/client';
import { useAuth } from '@/lib/auth';
import { chatService } from '@/lib/services/chat/chat.service';

export function MessagesBadge() {
    const { user, isAuthenticated } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);
    const supabase = createClient();

    const loadUnreadCount = useCallback(async () => {
        if (!user?.id) return;
        const count = await chatService.getUnreadCount(user.id);
        setUnreadCount(count);
    }, [user?.id]);

    useEffect(() => {
        if (!isAuthenticated || !user?.id) return;

        loadUnreadCount();

        // 3. Estratégia de Realtime Infalível:
        // Escutamos mudanças na tabela 'conversations' filtrando pelo ID do usuário.
        // Toda vez que uma mensagem é enviada, o campo 'last_message_at' da conversa é atualizado.
        // Isso dispara o evento de UPDATE que o Realtime captura com 100% de precisão para aquele usuário.
        
        const channelMentor = supabase
            .channel(`badge-mentor-${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'conversations',
                    filter: `mentor_id=eq.${user.id}`
                },
                () => {
                    console.log('[BADGE] Atualização detectada via mentor_id');
                    loadUnreadCount();
                }
            )
            .subscribe();

        const channelMentee = supabase
            .channel(`badge-mentee-${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'conversations',
                    filter: `mentee_id=eq.${user.id}`
                },
                () => {
                    console.log('[BADGE] Atualização detectada via mentee_id');
                    loadUnreadCount();
                }
            )
            .subscribe();

        // Também escutamos a tabela de mensagens para capturar o "marcar como lido" (UPDATE)
        const channelMessages = supabase
            .channel(`badge-messages-${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'messages'
                },
                () => {
                    loadUnreadCount();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channelMentor);
            supabase.removeChannel(channelMentee);
            supabase.removeChannel(channelMessages);
        };
    }, [isAuthenticated, user?.id, loadUnreadCount, supabase]);

    if (!isAuthenticated) return null;

    return (
        <Button variant="ghost" size="icon" className="relative" asChild title="Mensagens">
            <Link href="/messages">
                <MessageSquare className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-sm ring-2 ring-background">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </Link>
        </Button>
    );
}
