import type { Database } from "@/lib/types/supabase"

type MenteeProfileRow = Database["public"]["Tables"]["mentee_profiles"]["Row"]

/**
 * Campos acadêmicos e currículo que o próprio usuário edita. Moraram em
 * `profiles` até a Fase 3 de docs/domains/profiles-schema.md; agora ficam em
 * `mentee_profiles` (qualquer papel pode ter: mentor também filtra por nível).
 */
export const MENTEE_EDITABLE_FIELDS = [
  "institution",
  "course",
  "academic_level",
  "expected_graduation",
  "learning_goals",
  "cv_url",
] as const

type MenteeEditableField = (typeof MENTEE_EDITABLE_FIELDS)[number]
export type MenteeEditableFields = Partial<Pick<MenteeProfileRow, MenteeEditableField>>

/**
 * Embed do PostgREST para clientes de usuário. Sem `cv_url`: o currículo não
 * tem grant de leitura para `authenticated` e só sai por `profile_cv_url()`
 * (próprio, admin ou quem divide mentoria). Literal para o supabase-js inferir
 * o tipo do select.
 */
export const MENTEE_PROFILE_EMBED =
  "mentee_profiles(institution, course, academic_level, expected_graduation, learning_goals)" as const

/** Embed completo, só para rotas que leem com service role e já autorizaram o acesso. */
export const MENTEE_PROFILE_EMBED_WITH_CV =
  "mentee_profiles(institution, course, academic_level, expected_graduation, learning_goals, cv_url)" as const

type MenteeEmbed = Partial<Pick<MenteeProfileRow, MenteeEditableField>>

/** Campos de mentorado achatados no perfil, no formato que as telas já usam. */
export interface FlattenedMenteeFields {
  institution: string | null
  course: string | null
  academic_level: string | null
  expected_graduation: string | null
  learning_goals: string | null
  cv_url: string | null
}

/**
 * Separa um payload de edição de perfil em campos de `profiles` e de
 * `mentee_profiles`, para as rotas gravarem cada parte na sua tabela sem
 * mudar o formulário nem o contrato da API.
 */
export function splitMenteeFields<T extends Record<string, unknown>>(
  data: T
): { profile: Omit<T, MenteeEditableField>; mentee: MenteeEditableFields } {
  const profile: Record<string, unknown> = {}
  const mentee: Record<string, unknown> = {}
  const menteeKeys = new Set<string>(MENTEE_EDITABLE_FIELDS)

  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue
    if (menteeKeys.has(key)) mentee[key] = value === "" && key === "cv_url" ? null : value
    else profile[key] = value
  }

  return {
    profile: profile as Omit<T, MenteeEditableField>,
    mentee: mentee as MenteeEditableFields,
  }
}

/**
 * Junta o embed `mentee_profiles` de volta no perfil. Sem linha = campos
 * nulos (quem nunca preencheu nada não tem linha).
 */
export function withMenteeFields<T extends object>(
  row: T
): Omit<T, "mentee_profiles"> & FlattenedMenteeFields {
  const { mentee_profiles: embed, ...rest } = row as T & { mentee_profiles?: unknown }
  // O PostgREST devolve objeto em relação 1:1, mas array se não detectar.
  const mentee = ((Array.isArray(embed) ? embed[0] : embed) ?? {}) as MenteeEmbed

  return {
    ...rest,
    institution: mentee.institution ?? null,
    course: mentee.course ?? null,
    academic_level: mentee.academic_level ?? null,
    expected_graduation: mentee.expected_graduation ?? null,
    learning_goals: mentee.learning_goals ?? null,
    cv_url: mentee.cv_url ?? null,
  }
}
