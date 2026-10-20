/**
 * Camada 4 · Zod do painel admin (linha L2)
 * Regra: valida o que entra nas rotas `/api/admin/*` da L2. Cada grupo soma os
 * seus schemas aqui; a L1 (usuários) tem o próprio `admin-users.ts`.
 * Não faz: checar permissão (é do `requireAdmin` + `assertAdmin`).
 */
import { z } from "zod"

/** Body de `POST /api/admin/retention/exempt`: quem sai da fila LGPD. */
export const retentionExemptBodySchema = z.object({
  userId: z.string().uuid()
})

export type RetentionExemptBody = z.infer<typeof retentionExemptBodySchema>

/** Body de `POST /api/admin/feature-flags`: nasce sempre desligada. */
export const featureFlagCreateBodySchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório").max(100),
  description: z.string().trim().max(500).nullish(),
  tags: z.array(z.string().trim().min(1).max(50)).max(20).optional()
})

/** Body de `PUT /api/admin/feature-flags`: liga ou desliga uma flag. */
export const featureFlagToggleBodySchema = z.object({
  id: z.number().int().positive(),
  enabled: z.boolean()
})

/** Query de `DELETE /api/admin/feature-flags?id=`: chega como texto. */
export const featureFlagDeleteQuerySchema = z.object({
  id: z.coerce.number().int().positive()
})

export type FeatureFlagCreateBody = z.infer<typeof featureFlagCreateBodySchema>
