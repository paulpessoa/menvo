/**
 * Camada 5 · Repository (comunidade)
 * Regra: único ponto que lê `profiles`, `mentee_profiles` e `mentors_view` para
 * o mural da comunidade. Recebe o client de quem pede (cookie, nunca
 * service_role): a policy "Public profiles visibility restricted" é quem
 * decide se o mentorado aparece para este usuário.
 * Não faz: regra de quem pode ver o mural (service/rota) nem filtro de texto.
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"
import { MENTEE_PROFILE_EMBED, withMenteeFields } from "@/lib/services/mentees/mentee-profile-fields"
import type { CommunityProfile } from "@/lib/schemas/community"
import { RepositoryError } from "./repository-error"

/**
 * Only non-sensitive columns. Never add email, phone, age, address or
 * original_data here: this list is what mentors receive about a mentee.
 * Learning goals come from the mentee_profiles embed. The résumé is not
 * listed: it is only readable by the mentee, admins and mentors who share a
 * mentorship (profile_cv_url), so `cv_url` is always null on the wall.
 */
export const COMMUNITY_COLUMNS =
  `id, full_name, avatar_url, bio, job_title, company, linkedin_url, github_url, languages, expertise_areas, mentorship_topics, slug, ${MENTEE_PROFILE_EMBED}` as const

type CommunityRow = Omit<CommunityProfile, "role" | "learning_goals" | "cv_url"> & { mentee_profiles?: unknown }

export type CommunitySort = "newest" | "oldest" | "name" | "name-desc"

export interface CommunitySearchQuery {
  from: number
  to: number
  sortBy: CommunitySort
  country?: string
  state?: string
  city?: string
  topics?: string[]
  /** Já sanitizado pelo service. */
  organization?: string
  /** Já sanitizado pelo service. */
  search?: string
}

export interface CommunityRepository {
  listMentorIds(): Promise<string[]>
  searchMentees(query: CommunitySearchQuery, excludeIds: string[]): Promise<{ profiles: CommunityProfile[]; totalCount: number }>
  findByIds(ids: string[]): Promise<CommunityProfile[]>
  listFilterSources(): Promise<Array<{ company: string | null; mentorship_topics: string[] | null; mentee_profiles: unknown }>>
}

/** Flattens the mentee_profiles embed into the shape the wall already uses. */
function toCommunityProfile(row: CommunityRow): CommunityProfile {
  const { learning_goals, cv_url, ...rest } = withMenteeFields(row)
  return { ...rest, learning_goals, cv_url, role: "mentee" }
}

export function createCommunityRepository(db: SupabaseClient<Database>): CommunityRepository {
  /**
   * Ids de mentorados cuja coluna bate com o termo. O PostgREST não faz OR
   * entre coluna da tabela embutida e colunas de `profiles`, então o match
   * roda em mentee_profiles e os ids voltam para o `or()` de profiles.
   */
  async function menteeIdsMatching(column: "institution" | "learning_goals", term: string): Promise<string[]> {
    const { data, error } = await db.from("mentee_profiles").select("user_id").ilike(column, `%${term}%`).limit(1000)
    if (error) {
      console.warn("[CommunityRepository] mentee_profiles match failed:", error.message)
      return []
    }
    return (data ?? []).map((r) => r.user_id)
  }

  return {
    async listMentorIds() {
      const { data, error } = await db.from("mentors_view").select("id")
      if (error) {
        // A falha não derruba o mural: sem a exclusão ele só mostra mais gente.
        console.warn("[CommunityRepository] mentors_view failed:", error.message)
        return []
      }
      return (data ?? []).map((m) => m.id).filter((id): id is string => Boolean(id))
    },

    async searchMentees(q, excludeIds) {
      // O select dinâmico (colunas + embed) sai do tipo inferido; o retorno é re-tipado abaixo.
      let query = db
        .from("profiles")
        .select(COMMUNITY_COLUMNS, { count: "exact" })
        .eq("is_public", true)
        .not("bio", "is", null)
        .neq("bio", "")

      if (excludeIds.length > 0) query = query.not("id", "in", `(${excludeIds.join(",")})`)
      if (q.country && q.country !== "all") query = query.eq("country", q.country)
      if (q.state && q.state !== "all") query = query.eq("state", q.state)
      if (q.city && q.city !== "all") query = query.eq("city", q.city)
      if (q.topics && q.topics.length > 0) query = query.overlaps("mentorship_topics", q.topics)

      if (q.organization) {
        const institutionIds = await menteeIdsMatching("institution", q.organization)
        const clauses = [`company.ilike.%${q.organization}%`]
        if (institutionIds.length > 0) clauses.push(`id.in.(${institutionIds.join(",")})`)
        query = query.or(clauses.join(","))
      }

      if (q.search) {
        const goalIds = await menteeIdsMatching("learning_goals", q.search)
        const clauses = [`full_name.ilike.%${q.search}%`, `bio.ilike.%${q.search}%`, `job_title.ilike.%${q.search}%`]
        if (goalIds.length > 0) clauses.push(`id.in.(${goalIds.join(",")})`)
        query = query.or(clauses.join(","))
      }

      if (q.sortBy === "name") query = query.order("full_name", { ascending: true })
      else if (q.sortBy === "name-desc") query = query.order("full_name", { ascending: false })
      else if (q.sortBy === "oldest") query = query.order("created_at", { ascending: true })
      else query = query.order("created_at", { ascending: false })

      const { data, error, count } = await query.range(q.from, q.to)
      if (error) throw new RepositoryError("community.searchMentees", error)
      return { profiles: ((data ?? []) as unknown as CommunityRow[]).map(toCommunityProfile), totalCount: count ?? 0 }
    },

    async findByIds(ids) {
      if (ids.length === 0) return []
      const { data, error } = await db.from("profiles").select(COMMUNITY_COLUMNS).in("id", ids)
      if (error) throw new RepositoryError("community.findByIds", error)
      return ((data ?? []) as unknown as CommunityRow[]).map(toCommunityProfile)
    },

    async listFilterSources() {
      const { data, error } = await db
        .from("profiles")
        .select("company, mentorship_topics, mentee_profiles(institution)")
        .eq("community_ready", true)
      if (error) throw new RepositoryError("community.listFilterSources", error)
      return data ?? []
    },
  }
}