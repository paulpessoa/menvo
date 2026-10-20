"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/lib/auth"
import type { OwnProfile } from "@/lib/domain/profile/profile.entity"
import { effects, runEffects } from "@/lib/query/effects"
import { putJson } from "@/lib/query/http"
import { qk } from "@/lib/query/keys"
import { updatedProfileEnvelopeSchema } from "@/lib/schemas/profile"

/**
 * Salva o perfil (`PUT /api/profile`). Serve ao formulário completo e ao
 * "perfil público" (`{ is_public }`), que antes tinham cada um o seu `fetch`.
 *
 * - Nome e sobrenome vazios são recusados antes de qualquer pedido, como o
 *   hook antigo fazia.
 * - Atualização otimista no cache do perfil, desfeita se o servidor recusar.
 * - Ao salvar: o mapa de efeitos invalida perfil e catálogo, e o perfil do
 *   `AuthContext` (que não é uma query) é recarregado aqui, uma vez, para o
 *   componente não ter que lembrar disso.
 */
export function useUpdateProfile() {
  const qc = useQueryClient()
  const { user, refreshProfile } = useAuth()
  const ownKey = qk.profile.own(user?.id ?? "")

  return useMutation({
    mutationFn: async (updates: Partial<OwnProfile>) =>
      (await putJson("/api/profile", updates, updatedProfileEnvelopeSchema)).profile ?? null,

    onMutate: async (updates) => {
      if (updates.first_name !== undefined && !updates.first_name?.trim()) throw new Error("Nome é obrigatório")
      if (updates.last_name !== undefined && !updates.last_name?.trim()) throw new Error("Sobrenome é obrigatório")

      await qc.cancelQueries({ queryKey: ownKey })
      const previous = qc.getQueryData<OwnProfile>(ownKey)
      if (previous) qc.setQueryData<OwnProfile>(ownKey, { ...previous, ...updates })
      return { previous }
    },

    onError: (_error, _updates, context) => {
      if (context?.previous) qc.setQueryData(ownKey, context.previous)
    },

    onSuccess: async (saved) => {
      if (saved) qc.setQueryData<OwnProfile>(ownKey, saved)
      await Promise.all([runEffects(qc, effects["profile.update"]()), refreshProfile()])
    },
  })
}
