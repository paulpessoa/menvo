/**
 * Camada 10 · Query keys (profile)
 * Regra: só chaves do perfil próprio, todas começando por `["profile"]`.
 * Montadas em `lib/query/keys.ts` como `qk.profile`. O id do usuário faz parte
 * da chave para uma conta nunca enxergar o cache de outra no mesmo navegador.
 */
export const profileKeys = {
  all: ["profile"] as const,
  /** O perfil de quem está logado (`GET /api/profile`). */
  own: (userId: string) => ["profile", "own", userId] as const,
} as const
