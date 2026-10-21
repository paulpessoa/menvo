/**
 * Camada 7 · Service (comunidade)
 * Regra: regra do mural de mentorados, sem saber de Supabase. Quem monta o
 * repository com o client de cookie é `community.composition.ts`; assim a
 * busca roda com a sessão de quem pede (o RLS só mostra mentorados a
 * mentor/admin) e nunca com o client anônimo do browser.
 */
import type { CommunityRepository, CommunitySort } from "@/lib/repositories/community.repository"
import type { CommunityProfile } from "@/lib/schemas/community"

export interface GetCommunityProfilesParams {
  search?: string
  page?: number
  limit?: number
  country?: string
  state?: string
  city?: string
  topics?: string[]
  sortBy?: CommunitySort
  organization?: string
}

export interface GetCommunityProfilesResult {
  profiles: CommunityProfile[]
  totalCount: number
  hasMore: boolean
}

/** Strips characters that would break out of a PostgREST `or()` filter. */
export function sanitizeSearchTerm(term: string): string {
  return term.replace(/[,()*%\\:"']/g, " ").replace(/\s+/g, " ").trim().slice(0, 80)
}

export function createCommunityService(deps: { community: CommunityRepository }) {
  const { community } = deps

  return {
    /** Mentorados públicos do mural; mentores ativos ficam de fora. */
    async getCommunityProfiles({
      search = "",
      page = 0,
      limit = 12,
      country,
      state,
      city,
      topics,
      sortBy = "newest",
      organization,
    }: GetCommunityProfilesParams = {}): Promise<GetCommunityProfilesResult> {
      const from = page * limit
      const mentorIds = await community.listMentorIds()
      const org = organization && organization !== "all" ? sanitizeSearchTerm(organization) : ""

      const { profiles, totalCount } = await community.searchMentees(
        {
          from,
          to: from + limit - 1,
          sortBy,
          country,
          state,
          city,
          topics,
          organization: org || undefined,
          search: sanitizeSearchTerm(search) || undefined,
        },
        mentorIds
      )

      return { profiles, totalCount, hasMore: totalCount > from + profiles.length }
    },

    /** Perfis por id (recomendações do match por IA). Os ids já chegam validados pela rota. */
    async getProfilesByIds(ids: string[]): Promise<CommunityProfile[]> {
      return community.findByIds(ids)
    },

    /** Opções de filtro (organizações e tópicos) a partir dos perfis prontos para a comunidade. */
    async getFilterOptions(): Promise<{ organizations: string[]; topics: string[] }> {
      const rows = await community.listFilterSources()
      const orgs = new Set<string>()
      const topics = new Set<string>()
      for (const row of rows) {
        if (row.company) orgs.add(row.company)
        const embed = Array.isArray(row.mentee_profiles) ? row.mentee_profiles[0] : row.mentee_profiles
        const institution = (embed as { institution?: string | null } | null | undefined)?.institution
        if (institution) orgs.add(institution)
        for (const t of row.mentorship_topics ?? []) topics.add(t)
      }
      return { organizations: Array.from(orgs).sort(), topics: Array.from(topics).sort() }
    },
  }
}

export type CommunityService = ReturnType<typeof createCommunityService>