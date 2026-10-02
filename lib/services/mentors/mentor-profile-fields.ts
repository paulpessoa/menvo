import type { Database } from "@/lib/types/supabase"

type MentorProfileRow = Database["public"]["Tables"]["mentor_profiles"]["Row"]
type VerificationStatus = "pending" | "approved" | "rejected"

/**
 * Campos de mentor que o próprio mentor edita. Moraram em `profiles` até a
 * Fase 2 de docs/domains/profiles-schema.md; agora ficam em `mentor_profiles`.
 * O status de verificação NÃO está aqui: só muda por RPC
 * (`request_mentor_verification` / `withdraw_mentor_verification`) ou pelo
 * admin, para o usuário não conseguir se aprovar.
 */
export const MENTOR_EDITABLE_FIELDS = [
  "experience_years",
  "free_topics",
  "inclusive_tags",
  "mentorship_approach",
  "what_to_expect",
  "ideal_mentee",
  "is_volunteer",
  "chat_enabled",
  "availability_status",
] as const

type MentorEditableField = (typeof MENTOR_EDITABLE_FIELDS)[number]
export type MentorEditableFields = Partial<Pick<MentorProfileRow, MentorEditableField>>

/**
 * Embed do PostgREST para ler os campos de mentor junto com `profiles`.
 * Literal (não montado com join) para o supabase-js inferir o tipo do select.
 * Lista colunas explícitas: `verification_notes` não tem grant para usuários.
 */
export const MENTOR_PROFILE_EMBED =
  "mentor_profiles(experience_years, free_topics, inclusive_tags, mentorship_approach, what_to_expect, ideal_mentee, is_volunteer, chat_enabled, availability_status, verification_status, verified_at)" as const

type MentorEmbed = Partial<Pick<MentorProfileRow, MentorEditableField | "verification_status" | "verified_at">>

/** Campos de mentor achatados no perfil, no formato que as telas já usam. */
export interface FlattenedMentorFields extends MentorEditableFields {
  verification_status: VerificationStatus | null
  verified_at: string | null
  verified: boolean
  is_pending_mentor: boolean
}

/**
 * Separa um payload de edição de perfil em campos de `profiles` e de
 * `mentor_profiles`, para as rotas gravarem cada parte na sua tabela sem
 * mudar o formulário nem o contrato da API.
 */
export function splitMentorFields<T extends Record<string, unknown>>(
  data: T
): { profile: Omit<T, MentorEditableField>; mentor: MentorEditableFields } {
  const profile: Record<string, unknown> = {}
  const mentor: Record<string, unknown> = {}
  const mentorKeys = new Set<string>(MENTOR_EDITABLE_FIELDS)

  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue
    if (mentorKeys.has(key)) mentor[key] = value
    else profile[key] = value
  }

  return {
    profile: profile as Omit<T, MentorEditableField>,
    mentor: mentor as MentorEditableFields,
  }
}

/**
 * Junta o embed `mentor_profiles` de volta no perfil e calcula `verified` e
 * `is_pending_mentor` a partir de `verification_status` (única fonte da
 * verificação). Sem linha em `mentor_profiles` = não é candidato nem mentor.
 */
export function withMentorFields<T extends { mentor_profiles?: unknown }>(
  row: T
): Omit<T, "mentor_profiles"> & FlattenedMentorFields {
  const { mentor_profiles: embed, ...rest } = row
  // O PostgREST devolve objeto em relação 1:1, mas array se não detectar.
  const mentor = ((Array.isArray(embed) ? embed[0] : embed) ?? {}) as MentorEmbed
  const status = (mentor.verification_status ?? null) as VerificationStatus | null

  return {
    ...rest,
    experience_years: mentor.experience_years ?? null,
    free_topics: mentor.free_topics ?? null,
    inclusive_tags: mentor.inclusive_tags ?? null,
    mentorship_approach: mentor.mentorship_approach ?? null,
    what_to_expect: mentor.what_to_expect ?? null,
    ideal_mentee: mentor.ideal_mentee ?? null,
    is_volunteer: mentor.is_volunteer ?? false,
    chat_enabled: mentor.chat_enabled ?? false,
    availability_status: mentor.availability_status ?? "available",
    verification_status: status,
    verified_at: mentor.verified_at ?? null,
    verified: status === "approved",
    is_pending_mentor: status === "pending",
  }
}
