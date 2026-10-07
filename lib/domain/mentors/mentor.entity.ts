/**
 * Camada 3 · Entity (perfil público do mentor)
 * Regra: o que o app pode mostrar de um mentor a qualquer visitante, derivado
 * de `mentors_view`. A lista de campos é explícita porque a view também carrega
 * e-mail, telefone e external_id, e este dado vai para o navegador de anônimos.
 * Não faz: acesso a banco (camada 5).
 * Tradeoff: `Pick` da view em vez de uma interface escrita à mão; se uma coluna
 * mudar no banco, o `npm run db:types` quebra a compilação aqui, e não na tela.
 */
import type { Tables } from "@/lib/types/supabase"

type MentorViewRow = Tables<"mentors_view">

export const PUBLIC_MENTOR_FIELDS = [
  "id", "slug", "first_name", "last_name", "full_name", "avatar_url", "bio", "job_title", "company",
  "city", "state", "country", "location", "timezone", "languages", "expertise_areas", "mentor_skills",
  "mentorship_topics", "free_topics", "inclusive_tags", "experience_years", "academic_level",
  "institution", "course", "linkedin_url", "github_url", "website_url", "portfolio_url",
  "mentorship_approach", "what_to_expect", "ideal_mentee", "availability", "availability_status",
  "average_rating", "total_reviews", "total_sessions", "chat_enabled", "is_public", "is_volunteer",
  "verified", "verification_status", "created_at", "updated_at",
] as const satisfies readonly (keyof MentorViewRow)[]

export type PublicMentor = Pick<MentorViewRow, (typeof PUBLIC_MENTOR_FIELDS)[number]>

/** Textos que só quem está logado vê (não entram no HTML público nem para crawlers). */
export type MentorApproach = {
  mentorship_approach: string | null
  what_to_expect: string | null
}

export type MentorSlugMatch = { id: string | null; full_name: string | null; slug: string | null }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** O perfil aceita slug ou UUID na URL; links antigos usam o id. */
export function isMentorId(slugOrId: string): boolean {
  return UUID.test(slugOrId)
}

/** Nome para exibir: `full_name` quando existe, senão nome + sobrenome. */
export function displayName(mentor: Pick<PublicMentor, "full_name" | "first_name" | "last_name">): string {
  return mentor.full_name || `${mentor.first_name ?? ""} ${mentor.last_name ?? ""}`.trim()
}
