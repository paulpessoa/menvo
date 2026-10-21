/**
 * Camada 4 · Contrato da API da comunidade
 * Regra: entrada e saída de GET /api/community/profiles. Fonte do OpenAPI e do
 * tipo `CommunityProfile`. Os campos são exatamente os de COMMUNITY_COLUMNS
 * (nada de e-mail, telefone, idade ou endereço).
 */
import { z } from "zod"

export const MAX_COMMUNITY_IDS = 50

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * `ids=a,b,c`. Mais de 50 itens é erro (400). Ids que não são UUID são
 * descartados em vez de recusar a lista: um id alucinado pela IA não pode
 * zerar os válidos (mesma regra do match de mentores).
 */
export const communityIdsQuerySchema = z.object({
  ids: z
    .string()
    .max(MAX_COMMUNITY_IDS * 40)
    .transform((raw) => raw.split(",").map((id) => id.trim()).filter(Boolean))
    .refine((list) => list.length <= MAX_COMMUNITY_IDS, `no máximo ${MAX_COMMUNITY_IDS} ids`)
    .transform((list) => Array.from(new Set(list.filter((id) => UUID.test(id))))),
})

export const communityProfileSchema = z.object({
  id: z.string(),
  full_name: z.string().nullable(),
  avatar_url: z.string().nullable(),
  bio: z.string().nullable(),
  job_title: z.string().nullable(),
  company: z.string().nullable(),
  linkedin_url: z.string().nullable(),
  github_url: z.string().nullable(),
  cv_url: z.string().nullable(),
  languages: z.array(z.string()).nullable(),
  expertise_areas: z.array(z.string()).nullable(),
  mentorship_topics: z.array(z.string()).nullable(),
  learning_goals: z.string().nullable(),
  slug: z.string().nullable(),
  role: z.string(),
})
export type CommunityProfile = z.infer<typeof communityProfileSchema>

export const communityProfilesResponseSchema = z.object({
  profiles: z.array(communityProfileSchema),
})