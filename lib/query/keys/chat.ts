/**
 * Camada 10 · Query keys (chat)
 * Regra: só chaves do domínio chat, todas começando por `["chat"]`. Todas levam
 * o id do usuário: outra conta no mesmo navegador não vê este cache.
 * Montadas em `lib/query/keys.ts` como `qk.chat` (pendente do orquestrador).
 */
export const chatKeys = {
  all: ["chat"] as const,
  conversations: (userId: string) => ["chat", "conversations", userId] as const,
  unreadCount: (userId: string) => ["chat", "unread-count", userId] as const,
} as const
