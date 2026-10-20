import { z } from "zod"
import { toPlainText } from "./plain-text"

/**
 * Optional profile URL. People routinely paste `linkedin.com/in/fulano`
 * without the scheme; rejecting that made the whole profile save fail with a
 * message the UI never showed, so we prepend `https://` before validating.
 */
const profileUrl = (message: string) =>
  z.preprocess(
    (value) => {
      if (typeof value !== "string") return value
      const trimmed = value.trim()
      if (!trimmed) return ""
      return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
    },
    z.string().url(message).or(z.literal("")).optional().nullable()
  )

export const updateProfileSchema = z.object({
  first_name: z.string().trim().min(1, "Nome é obrigatório").optional(),
  last_name: z.string().trim().min(1, "Sobrenome é obrigatório").optional(),
  bio: z.string().max(3000, "Bio muito longa").transform(toPlainText).optional().nullable(),
  job_title: z.string().max(150).optional().nullable(),
  company: z.string().max(150).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
  linkedin_url: profileUrl("URL do LinkedIn inválida"),
  github_url: profileUrl("URL do GitHub inválida"),
  website_url: profileUrl("URL do site inválida"),
  phone: z.string().max(30).optional().nullable(),
  avatar_url: z.string().url().or(z.literal("")).optional().nullable(),
  academic_level: z.string().optional().nullable(),
  experience_years: z.coerce.number().min(0).max(60).optional().nullable(),
  languages: z.array(z.string()).optional().nullable(),
  inclusive_tags: z.array(z.string()).optional().nullable(),
  availability_status: z.enum(["available", "busy", "unavailable"]).optional().nullable(),
  chat_enabled: z.boolean().optional().nullable(),
  timezone: z.string().optional().nullable(),
  // An empty slug means "keep the current one" - the DB trigger always assigns
  // one at signup, and `slug` is what the public profile URL is built from.
  slug: z.preprocess(
    (value) => (typeof value === "string" && !value.trim() ? undefined : value),
    z.string().trim().toLowerCase()
      .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug: use apenas letras minúsculas, números e hífen")
      .min(3, "Slug deve ter ao menos 3 caracteres").max(60).optional()
  ),
  state: z.string().max(100).optional().nullable(),
  portfolio_url: profileUrl("URL do portfólio inválida"),
  institution: z.string().max(150).optional().nullable(),
  course: z.string().max(150).optional().nullable(),
  expected_graduation: z.string().max(20).optional().nullable(),
  expertise_areas: z.array(z.string()).optional().nullable(),
  mentorship_topics: z.array(z.string()).optional().nullable(),
  mentorship_approach: z.string().max(2000).optional().nullable(),
  what_to_expect: z.string().max(2000).optional().nullable(),
  ideal_mentee: z.string().max(2000).optional().nullable(),
  // cv_url não entra: só /api/upload/cv grava (o caminho do arquivo). A URL
  // que o formulário tem é assinada e expira; regravá-la quebraria o link.
  is_public: z.boolean().optional(),
  learning_goals: z.string().max(2000).optional().nullable(),
})
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>

/**
 * Campo opcional que ignora o que não serve em vez de rejeitar o pedido: tipo
 * errado ou `null` viram `undefined` ("não mexe"). É o comportamento antigo do
 * POST /api/profile/role (`typeof x === "string"`): o onboarding envia
 * `job_title: null` quando o campo está vazio, e isso não pode apagar nada nem
 * dar 400.
 */
const ignoreIfInvalid = <T extends z.ZodTypeAny>(schema: T) => schema.optional().catch(undefined)

/** Dados de perfil que o onboarding envia junto com o papel escolhido. */
export const roleProfileDataSchema = z.object({
  bio: ignoreIfInvalid(z.string()),
  job_title: ignoreIfInvalid(z.string()),
  company: ignoreIfInvalid(z.string()),
  linkedin_url: ignoreIfInvalid(z.string()),
  city: ignoreIfInvalid(z.string()),
  state: ignoreIfInvalid(z.string()),
  country: ignoreIfInvalid(z.string()),
  expertise_areas: ignoreIfInvalid(z.array(z.string())),
  mentorship_topics: ignoreIfInvalid(z.array(z.string())),
  learning_goals: ignoreIfInvalid(z.string()),
  inclusive_tags: ignoreIfInvalid(z.array(z.string())),
})
export type RoleProfileData = z.infer<typeof roleProfileDataSchema>

export const updateUserRoleSchema = z.object({
  role: z.enum(["mentor", "mentee"], {
    errorMap: () => ({ message: "Role inválida" })
  }),
  profileData: roleProfileDataSchema.optional()
})

export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>

/**
 * POST /api/profile/onboarding. A chave é o id de um tour (`ob_m1`,
 * `tour-assistant-v1`) e o valor, a data em que foi concluído. Sem limite, a
 * coluna `onboarding_flags` aceitaria qualquer JSON de qualquer tamanho.
 */
export const onboardingFlagSchema = z.object({
  flag: z.string().regex(/^[A-Za-z0-9_-]{1,64}$/),
  value: z.union([z.string().max(64), z.boolean()]),
})
export type OnboardingFlagInput = z.infer<typeof onboardingFlagSchema>

const trimmedOrEmpty = (value: unknown) => (typeof value === "string" ? value.trim() : "")

/** POST /api/profile/request-mentor: a abordagem é obrigatória, o resto é opcional. */
export const requestMentorSchema = z.object({
  mentorship_approach: z.preprocess(
    trimmedOrEmpty,
    z.string().min(1, "Conte como você pretende conduzir suas mentorias antes de enviar a solicitação")
  ),
  what_to_expect: z.preprocess(trimmedOrEmpty, z.string()),
})
export type RequestMentorInput = z.infer<typeof requestMentorSchema>
