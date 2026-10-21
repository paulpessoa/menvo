"use client"

import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/lib/auth"
import { getJson } from "@/lib/query/http"
import { chatKeys } from "@/lib/query/keys/chat"
import { chatUnreadCountResponseSchema } from "@/lib/schemas/chat"

/**
 * Mensagens não lidas para o badge do header (`GET /api/chat/unread-count`).
 * Falha vira 0: um badge quebrado não deve atrapalhar a navegação.
 */
export function useUnreadCount() {
  const { user, isAuthenticated } = useAuth()
  const query = useQuery({
    queryKey: chatKeys.unreadCount(user?.id ?? ""),
    enabled: isAuthenticated && !!user,
    queryFn: async () => (await getJson("/api/chat/unread-count", chatUnreadCountResponseSchema)).count,
  })
  return query.data ?? 0
}
