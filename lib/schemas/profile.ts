import { z } from "zod"

export const updateProfileSchema = z.object({
  first_name: z.string().trim().min(1, "Nome é obrigatório").optional(),
  last_name: z.string().trim().min(1, "Sobrenome é obrigatório").optional(),
  bio: z.string().max(3000, "Bio muito longa").optional().nullable(),
  job_title: z.string().max(150).optional().nullable(),
  company: z.string().max(150).optional().nullable(),
  location: z.string().max(150).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
  linkedin_url: z.string().url("URL do LinkedIn inválida").or(z.literal("")).optional().nullable(),
  github_url: z.string().url("URL do GitHub inválida").or(z.literal("")).optional().nullable(),
  website_url: z.string().url("URL do site inválida").or(z.literal("")).optional().nullable(),
  twitter_url: z.string().url("URL do Twitter inválida").or(z.literal("")).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  avatar_url: z.string().url().or(z.literal("")).optional().nullable(),
  academic_level: z.string().optional().nullable(),
  experience_years: z.coerce.number().min(0).max(60).optional().nullable(),
  mentor_skills: z.array(z.string()).optional().nullable(),
  languages: z.array(z.string()).optional().nullable(),
  inclusion_tags: z.array(z.string()).optional().nullable(),
  inclusive_tags: z.array(z.string()).optional().nullable(),
  availability_status: z.enum(["available", "busy", "unavailable"]).optional().nullable(),
  chat_enabled: z.boolean().optional().nullable()
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
