"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { runEffects } from "@/lib/query/effects"
import { orgEffects } from "@/lib/query/effects/org"
import { deleteJson, patchJson, postJson } from "@/lib/query/http"
import {
  membershipResultSchema,
  orgEnvelope,
  orgRowSchema,
  removedMemberSchema,
  type UpdateOrgSettingsInput,
} from "@/lib/schemas/organizations"

/**
 * Ações do admin da org sobre o próprio dashboard: convidar, aprovar, remover
 * (ou recusar/cancelar) e mudar a política de entrada. Cada uma chama a rota
 * de hoje e, ao concluir, rebusca o dashboard antes de a mutation resolver, então
 * a tela já mostra o estado novo. O texto do toast vem do servidor (`message`)
 * ou de quem chama, que sabe o contexto ("Solicitação recusada").
 * `orgId` indefinido só acontece antes de a org carregar; as ações ficam
 * desabilitadas na tela nesse período.
 */
export function useOrgMemberActions(orgId: string | undefined) {
  const qc = useQueryClient()
  const refresh = () => runEffects(qc, orgEffects["org.member.change"]({ orgId: orgId ?? "" }))
  const base = `/api/org/${orgId}`

  const invite = useMutation({
    mutationFn: (email: string) => postJson(`${base}/members`, { email }, orgEnvelope(membershipResultSchema)),
    onSuccess: refresh,
  })

  const approve = useMutation({
    mutationFn: (userId: string) => patchJson(`${base}/members`, { userId }, orgEnvelope(membershipResultSchema)),
    onSuccess: refresh,
  })

  const remove = useMutation({
    mutationFn: (userId: string) =>
      deleteJson(`${base}/members?userId=${encodeURIComponent(userId)}`, orgEnvelope(removedMemberSchema)),
    onSuccess: refresh,
  })

  const updateJoinPolicy = useMutation({
    mutationFn: (joinPolicy: UpdateOrgSettingsInput["join_policy"]) =>
      patchJson(base, { join_policy: joinPolicy }, orgEnvelope(orgRowSchema)),
    onSuccess: refresh,
  })

  return { invite, approve, remove, updateJoinPolicy }
}
