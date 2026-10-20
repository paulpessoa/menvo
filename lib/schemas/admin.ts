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
