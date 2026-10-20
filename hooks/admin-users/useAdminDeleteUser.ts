"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { adminUsersEffects } from "@/lib/query/effects/admin-users"
import { runEffects } from "@/lib/query/effects"
import { deleteJson } from "@/lib/query/http"
import { adminDeleteUserResponseSchema } from "@/lib/schemas/admin-users-responses"

/**
 * Apaga a conta de um usuário (irreversível: a tela deve confirmar antes).
 * Invalida lista, filas e catálogo de mentores, porque a pessoa pode estar em
 * qualquer um. Erro é `ApiClientError` (400 ao apagar a própria conta).
 */
export function useAdminDeleteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) =>
      deleteJson(`/api/admin/users/${encodeURIComponent(userId)}`, adminDeleteUserResponseSchema),
    onSuccess: () => runEffects(qc, adminUsersEffects["adminUsers.delete"]()),
  })
}
