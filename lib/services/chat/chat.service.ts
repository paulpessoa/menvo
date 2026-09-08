import { createClient } from '@/lib/utils/supabase/client'

export interface ChatConversationItem {
  id: string
  mentor_id: string
  mentee_id: string
  last_message_at: string | null
  created_at: string
  unread_count: number
  other_user: {
    id: string
    full_name: string
    avatar_url: string | null
    role_name: string
  }
}

interface RawConversation {
  id: string
  mentor_id: string
  mentee_id: string
  last_message_at: string | null
  created_at: string
}

interface OtherUserProfile {
  id: string
  full_name: string | null
  avatar_url: string | null
  user_roles?: Array<{ roles?: { name?: string } | null }> | null
}

/**
 * Service for chat and messaging operations.
 */
export const chatService = {
  /**
   * Retrieves the total unread messages count for a user across all their conversations.
   */
  async getUnreadCount(userId: string): Promise<number> {
    const supabase = createClient()

    try {
      // 1. Buscar todas as conversas onde o usuário participa
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('id')
        .or(`mentor_id.eq.${userId},mentee_id.eq.${userId}`)

      if (convError || !conversations || conversations.length === 0) {
        return 0
      }

      const conversationIds = conversations.map((c: { id: string }) => c.id)

      // 2. Contar mensagens não lidas enviadas por OUTRA pessoa
      const { count, error: msgError } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .in('conversation_id', conversationIds)
        .neq('sender_id', userId)
        .is('read_at', null)

      if (msgError) {
        return 0
      }

      return count || 0
    } catch (error) {
      console.error('[CHAT_SERVICE] Erro ao buscar unread count:', error)
      return 0
    }
  },

  /**
   * Retrieves all conversations for a user with counterpart profiles and unread count.
   */
  async getConversations(userId: string): Promise<ChatConversationItem[]> {
    const supabase = createClient()

    const { data: convs, error } = await supabase
      .from('conversations')
      .select(`
        id,
        mentor_id,
        mentee_id,
        last_message_at,
        created_at
      `)
      .or(`mentor_id.eq.${userId},mentee_id.eq.${userId}`)
      .order('last_message_at', { ascending: false })

    if (error) throw error
    if (!convs) return []

    const rawConvs = convs as RawConversation[]
    const conversationsWithDetails: ChatConversationItem[] = []

    for (const conv of rawConvs) {
      try {
        const otherUserId = conv.mentor_id === userId ? conv.mentee_id : conv.mentor_id
        if (otherUserId === userId) continue

        const { data: otherUser } = await supabase
          .from('profiles')
          .select(`
            id, 
            full_name, 
            avatar_url,
            user_roles (
              roles (
                name
              )
            )
          `)
          .eq('id', otherUserId)
          .maybeSingle()

        const { count: unreadCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .neq('sender_id', userId)
          .is('read_at', null)

        const profileData = otherUser as unknown as OtherUserProfile | null
        const roles = profileData?.user_roles || []
        const roleNames = roles.map((ur) => ur.roles?.name).filter(Boolean)
        let primaryRole = 'mentee'
        if (roleNames.includes('admin')) primaryRole = 'admin'
        else if (roleNames.includes('mentor')) primaryRole = 'mentor'

        conversationsWithDetails.push({
          id: conv.id,
          mentor_id: conv.mentor_id,
          mentee_id: conv.mentee_id,
          last_message_at: conv.last_message_at,
          created_at: conv.created_at,
          unread_count: unreadCount || 0,
          other_user: {
            id: otherUserId,
            full_name: profileData?.full_name || 'Usuário',
            avatar_url: profileData?.avatar_url || null,
            role_name: primaryRole
          }
        })
      } catch (itemErr) {
        console.warn(`[chatService] Erro ao carregar detalhes da conversa ${conv.id}:`, itemErr)
      }
    }

    return conversationsWithDetails
  },

  /**
   * Subscribes to real-time message changes for all conversations of a user.
   * Returns an unsubscribe cleanup callback.
   */
  subscribeToUserChats(userId: string, onNewMessage: () => void): () => void {
    const supabase = createClient()
    const channel = supabase
      .channel(`user-chats-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        (payload: any) => {
          if (payload.new?.sender_id !== userId) {
            onNewMessage()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  },

  /**
   * Subscribes to real-time changes, typing events, and connection status for a specific conversation.
   * Returns an unsubscribe cleanup callback.
   */
  subscribeToConversation(
    conversationId: string,
    currentUserId: string,
    callbacks: {
      onMessage: (msg: any) => void
      onTyping: () => void
      onStatusChange?: (status: 'connecting' | 'connected' | 'disconnected') => void
    }
  ): () => void {
    const supabase = createClient()
    const channel = supabase
      .channel(`conversation:${conversationId}`, {
        config: {
          broadcast: { self: false },
          presence: { key: currentUserId }
        }
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload: any) => {
          callbacks.onMessage(payload.new)
        }
      )
      .on('broadcast', { event: 'typing' }, () => {
        callbacks.onTyping()
      })
      .subscribe((status: string) => {
        if (!callbacks.onStatusChange) return
        if (status === 'SUBSCRIBED') {
          callbacks.onStatusChange('connected')
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          callbacks.onStatusChange('disconnected')
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  },

  /**
   * Broadcasts a typing indicator to other participants in the conversation.
   */
  broadcastTyping(conversationId: string, currentUserId: string): void {
    const supabase = createClient()
    supabase.channel(`conversation:${conversationId}`).send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId: currentUserId }
    })
  }
}
