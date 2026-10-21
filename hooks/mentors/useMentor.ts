"use client"

import { useQuery } from "@tanstack/react-query"
import { qk } from "@/lib/query/keys"
import { ApiClientError, getJson } from "@/lib/query/http"
import { mentorDetailResponseSchema } from "@/lib/schemas/mentors"

/**
 * Perfil público de um mentor por slug ou UUID. 404 resolve para `null` (a
 * tela mostra "não encontrado"); outros erros ficam em `error`.
 */
export function useMentor(slugOrId: string | undefined) {
  return useQuery({
    queryKey: qk.mentors.detail(slugOrId ?? ""),
    enabled: !!slugOrId,
    retry: false,
    queryFn: async () => {
      try {
        return (await getJson(`/api/mentors/${encodeURIComponent(slugOrId ?? "")}`, mentorDetailResponseSchema)).mentor
      } catch (error) {
        if (error instanceof ApiClientError && error.status === 404) return null
        throw error
      }
    },
  })
}
