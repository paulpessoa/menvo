"use client"

import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/lib/auth"
import { getJson } from "@/lib/query/http"
import { chatKeys } from "@/lib/query/keys/chat"
import { chatConversationsResponseSchema } from "@/lib/schemas/chat"

/**
 * Caixa de entrada do chat (`GET /api/chat/conversations`). A chave leva o id
 * do usuário. O realtime não escreve aqui: só invalida a chave, e o refetch
 * traz o dado do servidor.
 */
export function useChatConversations() {
  const { user } = useAuth()
  return useQuery({
    queryKey: chatKeys.conversations(user?.id ?? ""),
    enabled: !!user,
    queryFn: async () => (await getJson("/api/chat/conversations", chatConversationsResponseSchema)).conversations,
  })
}
