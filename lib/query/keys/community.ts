/**
 * Camada 10 · Query keys (community)
 * Regra: só chaves do domínio community, todas começando por `["community"]`.
 * Montadas em `lib/query/keys.ts` como `qk.community` (linha pendente).
 */
export const communityKeys = {
  all: ["community"] as const,
  /** Perfis recomendados pela IA, por ids (ordenados: a ordem não muda o resultado). */
  profilesByIds: (ids: readonly string[]) => ["community", "profiles", [...ids].sort()] as const,
} as const