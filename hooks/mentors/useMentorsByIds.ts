"use client"

import { useQuery } from "@tanstack/react-query"
import { qk } from "@/lib/query/keys"
import { getJson } from "@/lib/query/http"
import { isMentorId } from "@/lib/domain/mentors/mentor.entity"
import { MENTORS_BY_IDS_MAX, mentorsListResponseSchema } from "@/lib/schemas/mentors"

/**
 * Perfis públicos de vários mentores por id (favoritos, recomendação da IA).
 * A IA às vezes inventa um id que não é UUID; a rota rejeita a lista inteira
 * se um id for inválido, então filtramos aqui para um id alucinado nunca
 * derrubar os válidos. Ids vazios não disparam requisição.
 */
export function useMentorsByIds(ids: readonly string[], options: { enabled?: boolean } = {}) {
  const valid = [...new Set(ids.filter(isMentorId))].slice(0, MENTORS_BY_IDS_MAX)
  return useQuery({
    queryKey: qk.mentors.byIds(valid),
    enabled: (options.enabled ?? true) && valid.length > 0,
    queryFn: async () => (await getJson(`/api/mentors?ids=${valid.join(",")}`, mentorsListResponseSchema)).mentors,
  })
}
