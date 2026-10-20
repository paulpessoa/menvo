"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { adminUsersEffects } from "@/lib/query/effects/admin-users"
import { runEffects } from "@/lib/query/effects"
import { postJson } from "@/lib/query/http"
import type { AdminVerifyBody } from "@/lib/schemas/admin-users"
import { adminVerifyResponseSchema } from "@/lib/schemas/admin-users-responses"

/**
 * Decide uma candidatura (aprovar, recusar, pedir mudanças ou voltar para
 * pendente). Único caminho para as duas telas do admin, como a rota. Devolve o
 * que foi enviado (`chatSent`, `emailSent`) para o toast. Ao concluir, filas,
 * lista de usuários e catálogo de mentores são rebuscados. Erro é
 * `ApiClientError` (404 quando o perfil não existe).
 */
export function useDecideVerification() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: AdminVerifyBody) => postJson("/api/admin/verify", body, adminVerifyResponseSchema),
    onSuccess: () => runEffects(qc, adminUsersEffects["adminUsers.verification.decide"]()),
  })
}
