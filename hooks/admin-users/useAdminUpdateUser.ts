"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { adminUsersEffects } from "@/lib/query/effects/admin-users"
import { runEffects } from "@/lib/query/effects"
import { patchJson } from "@/lib/query/http"
import type { AdminUserPatchBody } from "@/lib/schemas/admin-users"
import { adminUpdateUserResponseSchema } from "@/lib/schemas/admin-users-responses"

/**
 * Edita dados e papéis de um usuário no modal do admin. Ao concluir, a lista é
 * rebuscada antes de a mutation resolver, então o modal fecha já com a linha
 * nova. Erro é `ApiClientError` (400 ao retirar o próprio papel de admin).
 */
export function useAdminUpdateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, ...body }: { userId: string } & Partial<AdminUserPatchBody>) =>
      patchJson(`/api/admin/users/${encodeURIComponent(userId)}`, body, adminUpdateUserResponseSchema),
    onSuccess: () => runEffects(qc, adminUsersEffects["adminUsers.update"]()),
  })
}
