import { z } from "zod"

/** As três respostas possíveis do check-in pós-sessão (docs/domains/session-checkin.md §2). */
export const checkinOutcomeSchema = z.enum(["happened", "not_happened", "rescheduled"])
export type CheckinOutcome = z.infer<typeof checkinOutcomeSchema>

/** Erros que as funções do banco devolvem em `{ error }` em vez de lançar. */
export const checkinRpcErrorSchema = z.object({
  error: z.enum(["invalid_token", "invalid_outcome", "not_allowed", "invalid_rating", "unauthenticated", "not_found", "not_yet"])
})

/** Resumo devolvido por get_session_checkin / answer_session_checkin. */
export const checkinSummarySchema = z.object({
  appointment_id: z.string().uuid(),
  role: z.enum(["mentor", "mentee"]),
  outcome: checkinOutcomeSchema.nullable(),
  scheduled_at: z.string(),
  other_first_name: z.string(),
  mentor_slug: z.string().nullable(),
  can_add_details: z.boolean().nullable().transform(v => v === true)
})
export type CheckinSummary = z.infer<typeof checkinSummarySchema>

export const checkinOkSchema = z.object({ ok: z.literal(true) })

/** Formulário opcional depois do "aconteceu" (nota só é exigida do mentorado, no banco). */
export const checkinDetailsSchema = z.object({
  rating: z.number().int().min(1).max(5).nullable(),
  publicFeedback: z.string().trim().max(1000),
  privateNote: z.string().trim().max(1000),
  nextStep: z.string().trim().max(500)
})
export type CheckinDetails = z.infer<typeof checkinDetailsSchema>

/** O token do e-mail: 32 bytes em base64url. Recusar antes de chamar o banco. */
export const checkinTokenSchema = z.string().regex(/^[A-Za-z0-9_-]{40,64}$/)
