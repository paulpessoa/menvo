"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { orgEffects } from "@/lib/query/effects/org"
import { runEffects } from "@/lib/query/effects"
import { deleteJson } from "@/lib/query/http"
import { leftOrganizationSchema, orgEnvelope } from "@/lib/schemas/organizations"

const responseSchema = orgEnvelope(leftOrganizationSchema)

/**
 * Sai da organização, recusa um convite ou cancela um pedido (para o servidor
 * é a mesma operação: apagar o vínculo da própria pessoa). A mensagem do toast
 * depende do estado anterior, então quem chama a escolhe.
 */
export function useLeaveOrganization(userId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (organizationId: string) =>
      deleteJson(`/api/me/organizations?organizationId=${encodeURIComponent(organizationId)}`, responseSchema),
    onSuccess: () => runEffects(qc, orgEffects["org.membership.change"]({ userId: userId ?? "" })),
  })
}
