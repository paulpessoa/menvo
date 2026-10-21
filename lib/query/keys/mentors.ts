/**
 * Camada 10 · Query keys (mentors)
 * Regra: só chaves do domínio mentors, todas começando por `["mentors"]`.
 * Montadas em `lib/query/keys.ts` como `qk.mentors`.
 */
export const mentorsKeys = {
  /** Resolução de nomes sugeridos pela IA para slug/id de perfil. */
  slugs: (names: readonly string[]) => ["mentors", "slugs", [...names].sort()] as const,
  /** Perfis públicos por id (favoritos, recomendação da IA). Ordenada: a ordem dos ids não muda o resultado. */
  byIds: (ids: readonly string[]) => ["mentors", "by-ids", [...ids].sort()] as const,
  /** Um mentor por slug ou UUID. */
  detail: (slugOrId: string) => ["mentors", "detail", slugOrId] as const,
} as const
