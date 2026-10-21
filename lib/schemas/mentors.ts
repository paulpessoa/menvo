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

/** Máximo de ids por chamada de GET /api/mentors: cobre favoritos e a recomendação da IA com folga. */
export const MENTORS_BY_IDS_MAX = 50

/** `?ids=a,b,c`: lista separada por vírgula, cada item um UUID. */
export const mentorsByIdsQuerySchema = z.object({
  ids: z
    .string()
    .transform((value) => value.split(",").map((id) => id.trim()).filter(Boolean))
    .pipe(z.array(z.string().uuid()).min(1).max(MENTORS_BY_IDS_MAX)),
})

/**
 * Mentor público como as telas o leem. Só os campos que o navegador usa são
 * tipados; `passthrough` deixa o resto de `PUBLIC_MENTOR_FIELDS` passar sem
 * duplicar a entity (camada 3) aqui.
 */
export const publicMentorSchema = z
  .object({
    id: z.string().nullable(),
    slug: z.string().nullable(),
    full_name: z.string().nullable(),
    first_name: z.string().nullable(),
    last_name: z.string().nullable(),
    avatar_url: z.string().nullable(),
    job_title: z.string().nullable(),
    company: z.string().nullable(),
    average_rating: z.number().nullable(),
  })
  .passthrough()
export type PublicMentorDto = z.infer<typeof publicMentorSchema>

export const mentorsListResponseSchema = z.object({ mentors: z.array(publicMentorSchema) })
export const mentorDetailResponseSchema = z.object({ mentor: publicMentorSchema })
