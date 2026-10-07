/**
 * Camada 4 · Contrato da API de perfil de mentor
 * Regra: entrada e saída de /api/mentors/[slug]/approach. Fonte do OpenAPI.
 */
import { z } from "zod"

/** Slug ou UUID. "undefined" chega quando um link foi montado sem o slug. */
export const mentorSlugParamSchema = z.object({
  slug: z.string().trim().min(1).max(200).refine((value) => value !== "undefined", "slug ausente"),
})

export const mentorApproachSchema = z.object({
  mentorship_approach: z.string().nullable(),
  what_to_expect: z.string().nullable(),
})

/** Formato de `successResponse` (lib/api/error-handler.ts), que esta rota já usava. */
export const mentorApproachResponseSchema = z.object({
  data: mentorApproachSchema,
  message: z.string().optional(),
})
