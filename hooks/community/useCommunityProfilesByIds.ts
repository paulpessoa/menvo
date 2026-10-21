"use client"

import { useMutation } from "@tanstack/react-query"
import { getJson } from "@/lib/query/http"
import { communityProfilesResponseSchema, type CommunityProfile } from "@/lib/schemas/community"

/**
 * Busca os perfis recomendados pelo match de IA (`GET /api/community/profiles`).
 * É mutation e não query porque é disparada por um evento (a resposta da IA),
 * não por dados que a tela precisa manter em dia. Antes a página lia `profiles`
 * direto do navegador; agora a leitura passa pelo servidor e pelo RLS da sessão.
 */
export function useCommunityProfilesByIds() {
  return useMutation({
    mutationFn: async (ids: string[]): Promise<CommunityProfile[]> => {
      if (ids.length === 0) return []
      const url = `/api/community/profiles?ids=${encodeURIComponent(ids.join(","))}`
      return (await getJson(url, communityProfilesResponseSchema)).profiles
    },
  })
}