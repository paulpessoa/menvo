import { createClient } from '@/lib/utils/supabase/client'

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
  }
}
