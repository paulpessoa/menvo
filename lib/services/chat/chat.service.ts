import { createClient } from '@/lib/utils/supabase/client'

/**
 * Realtime-only chat client (browser). The reads (conversations, unread count)
 * moved to GET /api/chat/* (lib/services/chat/chat-inbox.service.ts); realtime
 * stays on the anon client on purpose and only triggers query invalidation.
 */
export const chatService = {
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
