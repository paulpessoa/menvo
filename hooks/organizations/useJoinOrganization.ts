"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { orgEffects } from "@/lib/query/effects/org"
import { runEffects } from "@/lib/query/effects"
import { postJson } from "@/lib/query/http"
import { membershipResultSchema, orgEnvelope } from "@/lib/schemas/organizations"

const responseSchema = orgEnvelope(membershipResultSchema)

/**
 * Pede para entrar numa organização pelo slug, ou aceita o convite que a
 * pessoa já tinha (o servidor decide pelo estado atual). Devolve o estado em
 * que ela ficou e a mensagem pronta para o toast. Ao concluir, a lista de
 * vínculos é rebuscada antes de a mutation resolver, então quem chama já
 * encontra o estado novo no cache. Erro é `ApiClientError` (403 quando a org
 * é só por convite).
 */
export function useJoinOrganization(userId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (slug: string) => postJson("/api/me/organizations", { slug }, responseSchema),
    onSuccess: () => runEffects(qc, orgEffects["org.membership.change"]({ userId: userId ?? "" })),
  })
}
