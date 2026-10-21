/**
 * Camada 5 · Repository (chat, leitura)
 * Regra: único ponto que lê `conversations` e `messages` para a caixa de
 * entrada. Recebe o client DA SESSÃO (RLS decide o que o usuário vê, nunca
 * `service_role`).
 * Por que: antes o browser fazia 1 query de perfil + 1 de contagem POR conversa
 * (N+1). Aqui o perfil dos dois participantes vem aninhado na query das conversas
 * e as não lidas vêm numa única query para todas as conversas. Total fixo,
 * independente de N.
 * Não faz: regra de negócio (qual é o "outro", papel principal): camada 7.
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"
import { RepositoryError } from "./repository-error"

export interface ChatPeerRow {
  id: string
  full_name: string | null
  avatar_url: string | null
  user_roles: Array<{ roles: { name: string | null } | null }> | null
}

export interface ChatConversationRow {
  id: string
  mentor_id: string
  mentee_id: string
  last_message_at: string | null
  created_at: string
  mentor: ChatPeerRow | null
  mentee: ChatPeerRow | null
}

export interface ChatRepository {
  /** 1 query: conversas do usuário + perfil (e papéis) de mentor e mentorado. */
  listConversationsWithPeers(userId: string): Promise<ChatConversationRow[]>
  /** 1 query: um `conversation_id` por mensagem não lida enviada por outra pessoa. */
  listUnreadConversationIds(userId: string, conversationIds: string[]): Promise<string[]>
  /** 1 query: ids das conversas em que o usuário participa. */
  listConversationIds(userId: string): Promise<string[]>
  /** 1 query: total de mensagens não lidas de outra pessoa nessas conversas. */
  countUnread(userId: string, conversationIds: string[]): Promise<number>
}

const PEER_SELECT = "id, full_name, avatar_url, user_roles(roles(name))"

export function createChatRepository(db: SupabaseClient<Database>): ChatRepository {
  return {
    async listConversationsWithPeers(userId) {
      const { data, error } = await db
        .from("conversations")
        .select(
          `id, mentor_id, mentee_id, last_message_at, created_at,
           mentor:profiles!conversations_mentor_id_fkey(${PEER_SELECT}),
           mentee:profiles!conversations_mentee_id_fkey(${PEER_SELECT})`
        )
        .or(`mentor_id.eq.${userId},mentee_id.eq.${userId}`)
        .order("last_message_at", { ascending: false })
      if (error) throw new RepositoryError("chat.listConversationsWithPeers", error)
      return (data ?? []) as unknown as ChatConversationRow[]
    },

    async listUnreadConversationIds(userId, conversationIds) {
      if (conversationIds.length === 0) return []
      const { data, error } = await db
        .from("messages")
        .select("conversation_id")
        .in("conversation_id", conversationIds)
        .neq("sender_id", userId)
        .is("read_at", null)
      if (error) throw new RepositoryError("chat.listUnreadConversationIds", error)
      return (data ?? []).map((row) => row.conversation_id)
    },

    async listConversationIds(userId) {
      const { data, error } = await db
        .from("conversations")
        .select("id")
        .or(`mentor_id.eq.${userId},mentee_id.eq.${userId}`)
      if (error) throw new RepositoryError("chat.listConversationIds", error)
      return (data ?? []).map((row) => row.id)
    },

    async countUnread(userId, conversationIds) {
      if (conversationIds.length === 0) return 0
      const { count, error } = await db
        .from("messages")
        .select("*", { count: "exact", head: true })
        .in("conversation_id", conversationIds)
        .neq("sender_id", userId)
        .is("read_at", null)
      if (error) throw new RepositoryError("chat.countUnread", error)
      return count ?? 0
    },
  }
}
