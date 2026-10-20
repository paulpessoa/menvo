/**
 * Camada 10 · Query keys (mentors)
 * Regra: só chaves do domínio mentors, todas começando por `["mentors"]`.
 * Montadas em `lib/query/keys.ts` como `qk.mentors`.
 */
export const mentorsKeys = {
  /** Resolução de nomes sugeridos pela IA para slug/id de perfil. */
  slugs: (names: readonly string[]) => ["mentors", "slugs", [...names].sort()] as const,
} as const
