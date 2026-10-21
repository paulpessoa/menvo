/**
 * Camada 7 · Service (caixa de entrada do chat)
 * Regra: monta a lista de conversas e a contagem de não lidas a partir do
 * repository. Recebe o repository por parâmetro (testável sem banco).
 * Por que aqui: escolher o "outro participante" e o papel principal é regra de
 * negócio; antes vivia no service do browser, junto com o N+1.
 * Erros do repository sobem como `RepositoryError`; a rota decide o status.
 */
import type { ChatConversationItem } from "@/lib/schemas/chat"
import type { ChatPeerRow, ChatRepository } from "@/lib/repositories/chat.repository"

export interface ChatInboxService {
  getConversations(userId: string): Promise<ChatConversationItem[]>
  getUnreadCount(userId: string): Promise<number>
}

/** admin > mentor > mentee, como a tela já exibia. */
function primaryRole(peer: ChatPeerRow | null): string {
  const names = (peer?.user_roles ?? []).map((ur) => ur.roles?.name)
  if (names.includes("admin")) return "admin"
  if (names.includes("mentor")) return "mentor"
  return "mentee"
}

export function createChatInboxService(repo: ChatRepository): ChatInboxService {
  return {
    async getConversations(userId) {
      const rows = await repo.listConversationsWithPeers(userId)
      if (rows.length === 0) return []

      const unreadIds = await repo.listUnreadConversationIds(
        userId,
        rows.map((r) => r.id)
      )
      const unreadByConversation = new Map<string, number>()
      for (const id of unreadIds) unreadByConversation.set(id, (unreadByConversation.get(id) ?? 0) + 1)

      const items: ChatConversationItem[] = []
      for (const row of rows) {
        const isMentor = row.mentor_id === userId
        const otherId = isMentor ? row.mentee_id : row.mentor_id
        if (otherId === userId) continue
        const peer = isMentor ? row.mentee : row.mentor
        items.push({
          id: row.id,
          mentor_id: row.mentor_id,
          mentee_id: row.mentee_id,
          last_message_at: row.last_message_at,
          created_at: row.created_at,
          unread_count: unreadByConversation.get(row.id) ?? 0,
          other_user: {
            id: otherId,
            full_name: peer?.full_name || "Usuário",
            avatar_url: peer?.avatar_url || null,
            role_name: primaryRole(peer),
          },
        })
      }
      return items
    },

    async getUnreadCount(userId) {
      const ids = await repo.listConversationIds(userId)
      return repo.countUnread(userId, ids)
    },
  }
}
