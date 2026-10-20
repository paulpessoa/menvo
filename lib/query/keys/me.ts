/**
 * Camada 10 · Query keys (me)
 * Regra: só chaves das rotas `/api/me/**` do próprio usuário (favoritos e
 * notificações), todas começando por `["me"]`. Montadas em `lib/query/keys.ts`
 * como `qk.me`. `/api/me/organizations` é da linha org, que define as chaves dela.
 */
export const meKeys = {
  all: ["me"] as const,
  favorites: (userId: string) => ["me", "favorites", userId] as const,
  /** `role` entra na chave porque muda quais categorias o servidor calcula. */
  notifications: (userId: string, role?: string | null) => ["me", "notifications", userId, role ?? null] as const,
} as const
