"use client"

import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/lib/auth"
import { qk } from "@/lib/query/keys"
import { getJson } from "@/lib/query/http"
import { ownProfileEnvelopeSchema } from "@/lib/schemas/profile"

/**
 * O perfil de quem está logado (`GET /api/profile`), com mentor e mentorado
 * achatados. A chave leva o id do usuário: outra conta no mesmo navegador não
 * vê este cache. Substitui o `useProfile` (useState + fetch à mão).
 * `retry: false` mantém o comportamento antigo: uma falha aparece, não fica
 * tentando em silêncio.
 */
export function useOwnProfile() {
  const { user } = useAuth()
  const query = useQuery({
    queryKey: qk.profile.own(user?.id ?? ""),
    enabled: !!user,
    retry: false,
    queryFn: async () => (await getJson("/api/profile", ownProfileEnvelopeSchema)).profile,
  })

  return {
    profile: query.data ?? null,
    loading: !!user && query.isLoading,
    error: query.error ? query.error.message : null,
    refetch: query.refetch,
  }
}
