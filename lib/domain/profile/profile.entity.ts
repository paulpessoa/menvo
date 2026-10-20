/**
 * Camada 3 · Entity (perfil próprio)
 * Regra: o perfil como o app o enxerga: a linha de `profiles` mais os campos de
 * `mentor_profiles` e `mentee_profiles` achatados (docs/domains/profiles-schema.md).
 * TypeScript puro: sem Supabase, React ou Next.
 * Não faz: validar dado externo (camada 4) nem acessar o banco (camada 5).
 * Tradeoff: o tipo vem de `Tables<"profiles">` + os tipos `Flattened*` que já
 * moram ao lado das funções que achatam (mentors/mentees); são `import type`, sem
 * dependência em runtime. Não existe aqui uma lista de colunas editáveis: ela
 * seria a 7a cópia (ver docs/blueprint/profile-audit.md); o guarda contra
 * divergência é `profile-fields.contract.test.ts`.
 */
import type { Tables } from "@/lib/types/supabase"
import type { FlattenedMentorFields } from "@/lib/services/mentors/mentor-profile-fields"
import type { FlattenedMenteeFields } from "@/lib/services/mentees/mentee-profile-fields"

/** Perfil do próprio usuário, no formato que `/api/profile` e `/api/auth/me` devolvem. */
export type OwnProfile = Tables<"profiles"> & FlattenedMentorFields & FlattenedMenteeFields

/**
 * Quem pediu para ser mentor e ainda não foi decidido ou aprovado: tem linha em
 * `mentor_profiles`. Mentorado comum não tem linha.
 */
export function isMentorCandidate(profile: Pick<OwnProfile, "verification_status">): boolean {
  return profile.verification_status !== null
}

/**
 * Aparece no catálogo público: verificado E com a chave "perfil público" ligada.
 * As duas condições existem porque o mentor pode pausar sem perder a aprovação
 * (`is_public=false`); foi essa chave que sumiu em 2026-10-15 (f95c9da5).
 */
export function hasPublicListing(profile: Pick<OwnProfile, "verified" | "is_public">): boolean {
  return profile.verified === true && profile.is_public === true
}
