import { z } from "zod"

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
  bio: z.string().max(3000, "Bio muito longa").optional().nullable(),
  job_title: z.string().max(150).optional().nullable(),
  company: z.string().max(150).optional().nullable(),
  location: z.string().max(150).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
  linkedin_url: profileUrl("URL do LinkedIn inválida"),
  github_url: profileUrl("URL do GitHub inválida"),
  website_url: profileUrl("URL do site inválida"),
  twitter_url: profileUrl("URL do Twitter inválida"),
  phone: z.string().max(30).optional().nullable(),
  avatar_url: z.string().url().or(z.literal("")).optional().nullable(),
  academic_level: z.string().optional().nullable(),
  experience_years: z.coerce.number().min(0).max(60).optional().nullable(),
  languages: z.array(z.string()).optional().nullable(),
  inclusive_tags: z.array(z.string()).optional().nullable(),
  availability_status: z.enum(["available", "busy", "unavailable"]).optional().nullable(),
  chat_enabled: z.boolean().optional().nullable(),
  timezone: z.string().optional().nullable(),
  // An empty slug means "keep the current one" — the DB trigger always assigns
  // one at signup, and `slug` is what the public profile URL is built from.
  slug: z.preprocess(
    (value) => (typeof value === "string" && !value.trim() ? undefined : value),
    z.string().trim().toLowerCase()
      .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug: use apenas letras minúsculas, números e hífen")
      .min(3, "Slug deve ter ao menos 3 caracteres").max(60).optional()
  ),
  state: z.string().max(100).optional().nullable(),
  address: z.string().max(255).optional().nullable(),
  portfolio_url: profileUrl("URL do portfólio inválida"),
  institution: z.string().max(150).optional().nullable(),
  course: z.string().max(150).optional().nullable(),
  expected_graduation: z.string().max(20).optional().nullable(),
  expertise_areas: z.array(z.string()).optional().nullable(),
  mentorship_topics: z.array(z.string()).optional().nullable(),
  mentorship_approach: z.string().max(2000).optional().nullable(),
  what_to_expect: z.string().max(2000).optional().nullable(),
  ideal_mentee: z.string().max(2000).optional().nullable(),
  cv_url: z.string().url().or(z.literal("")).optional().nullable(),
  is_public: z.boolean().optional(),
  learning_goals: z.string().max(2000).optional().nullable(),
})
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>

export const updateUserRoleSchema = z.object({
  role: z.enum(["mentor", "mentee"], {
    errorMap: () => ({ message: "Role inválida" })
  }),
  profileData: z.record(z.any()).optional()
})

export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>
