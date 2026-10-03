import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"
import { createClient } from "@/lib/utils/supabase/client"
import { MENTEE_PROFILE_EMBED, withMenteeFields } from "@/lib/services/mentees/mentee-profile-fields"

export interface CommunityProfile {
  id: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  job_title: string | null
  company: string | null
  linkedin_url: string | null
  github_url: string | null
  cv_url: string | null
  languages: string[] | null
  expertise_areas: string[] | null
  mentorship_topics: string[] | null
  learning_goals: string | null
  slug: string | null
  role: string
}

type RawProfileRow = Omit<CommunityProfile, "role">

export interface GetCommunityProfilesParams {
  search?: string
  page?: number
  limit?: number
  country?: string
  state?: string
  city?: string
  topics?: string[]
  sortBy?: "newest" | "oldest" | "name" | "name-desc"
  organization?: string
}

export interface GetCommunityProfilesResult {
  profiles: CommunityProfile[]
  totalCount: number
  hasMore: boolean
}

/**
 * Only non-sensitive columns. Never add email, phone, age, address or
 * original_data here: this list is what mentors receive about a mentee.
 * Learning goals come from the mentee_profiles embed. The résumé is not
 * listed: it is only readable by the mentee, admins and mentors who share a
 * mentorship (profile_cv_url), so `cv_url` is always null on the wall.
 */
const COMMUNITY_COLUMNS =
  `id, full_name, avatar_url, bio, job_title, company, linkedin_url, github_url, languages, expertise_areas, mentorship_topics, slug, ${MENTEE_PROFILE_EMBED}` as const

type CommunityRow = Omit<RawProfileRow, "learning_goals" | "cv_url"> & { mentee_profiles?: unknown }

/** Flattens the mentee_profiles embed into the shape the wall already uses. */
function toCommunityProfile(row: CommunityRow): CommunityProfile {
  const { learning_goals, cv_url, ...rest } = withMenteeFields(row)
  return { ...rest, learning_goals, cv_url, role: "mentee" }
}

/**
 * Ids of mentees whose `column` matches `term`. PostgREST cannot OR a column
 * of the embedded table with columns of `profiles`, so the match runs on
 * mentee_profiles and the ids are fed back into the profiles `or()`.
 */
async function menteeIdsMatching(
  supabase: SupabaseClient<Database>,
  column: "institution" | "learning_goals",
  term: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from("mentee_profiles")
    .select("user_id")
    .ilike(column, `%${term}%`)
    .limit(1000)

  if (error) {
    console.warn("[CommunityService] Warning matching mentee_profiles:", error.message)
    return []
  }
  return (data ?? []).map((r) => r.user_id)
}

/** Strips characters that would break out of a PostgREST `or()` filter. */
function sanitizeSearchTerm(term: string): string {
  return term.replace(/[,()*%\\:"']/g, " ").replace(/\s+/g, " ").trim().slice(0, 80)
}

export const communityService = {
  /**
   * Fetches public mentees for the Community wall.
   * Excludes active mentors from mentors_view so only mentees/learners are displayed.
   *
   * Must receive the request-scoped server client: the "Public profiles visibility
   * restricted" RLS policy only returns mentees when auth.uid() is a mentor/admin,
   * so an anonymous client silently returns an empty wall.
   */
  async getCommunityProfiles(
    supabase: SupabaseClient<Database>,
    {
      search = "",
      page = 0,
      limit = 12,
      country,
      state,
      city,
      topics,
      sortBy = "newest",
      organization,
    }: GetCommunityProfilesParams = {}
  ): Promise<GetCommunityProfilesResult> {
    const from = page * limit
    const to = from + limit - 1

    // 1. Fetch active mentor IDs to exclude them from the mentee wall
    const { data: mentorRows, error: mentorError } = await (supabase
      .from("mentors_view") as any)
      .select("id")

    if (mentorError) {
      console.warn("[CommunityService] Warning fetching mentors_view:", mentorError.message)
    }

    const mentorIds = ((mentorRows as Array<{ id: string | null }>) || [])
      .map((m) => m.id)
      .filter((id): id is string => Boolean(id))

    // 2. Query public profiles with a bio
    let query = (supabase.from("profiles") as any)
      .select(COMMUNITY_COLUMNS, { count: "exact" })
      .eq("is_public", true)
      .not("bio", "is", null)
      .neq("bio", "")

    // Exclude mentors at database query level
    if (mentorIds.length > 0) {
      query = query.not("id", "in", `(${mentorIds.join(",")})`)
    }

    // Exact Match Filters
    if (country && country !== "all") query = query.eq("country", country)
    if (state && state !== "all") query = query.eq("state", state)
    if (city && city !== "all") query = query.eq("city", city)
    if (topics && topics.length > 0) query = query.overlaps("mentorship_topics", topics)
    
    // Organization filter (search in company or institution)
    if (organization && organization !== "all") {
      const org = sanitizeSearchTerm(organization)
      const institutionIds = await menteeIdsMatching(supabase, "institution", org)
      const clauses = [`company.ilike.%${org}%`]
      if (institutionIds.length > 0) clauses.push(`id.in.(${institutionIds.join(",")})`)
      query = query.or(clauses.join(","))
    }

    // Search filter
    const term = sanitizeSearchTerm(search)
    if (term) {
      const goalIds = await menteeIdsMatching(supabase, "learning_goals", term)
      const clauses = [`full_name.ilike.%${term}%`, `bio.ilike.%${term}%`, `job_title.ilike.%${term}%`]
      if (goalIds.length > 0) clauses.push(`id.in.(${goalIds.join(",")})`)
      query = query.or(clauses.join(","))
    }

    // Sort
    if (sortBy === "name") {
      query = query.order("full_name", { ascending: true })
    } else if (sortBy === "name-desc") {
      query = query.order("full_name", { ascending: false })
    } else if (sortBy === "oldest") {
      query = query.order("created_at", { ascending: true })
    } else {
      query = query.order("created_at", { ascending: false })
    }
    
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      console.error("[CommunityService] Error querying profiles:", error)
      throw error
    }

    const profiles: CommunityProfile[] = ((data as CommunityRow[]) || []).map(toCommunityProfile)

    const totalCount = count || 0
    const hasMore = totalCount > from + profiles.length

    return {
      profiles,
      totalCount,
      hasMore,
    }
  },

  /**
   * Fetches specific community profiles by id, used to render the AI match
   * modal's recommendations. Same UUID guard as `mentorService.getMentorsByIds`:
   * a single hallucinated id from the model must not zero out the valid ones.
   */
  async getProfilesByIds(ids: string[]): Promise<CommunityProfile[]> {
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    const validIds = (ids || []).filter((id) => uuidPattern.test(id))
    if (validIds.length === 0) return []

    const supabase = createClient()
    const { data, error } = await (supabase.from("profiles") as any)
      .select(COMMUNITY_COLUMNS)
      .in("id", validIds)

    if (error) {
      console.error("[CommunityService] Error fetching profiles by ids:", error)
      return []
    }

    return ((data as CommunityRow[]) || []).map(toCommunityProfile)
  },

  /**
   * Obtém opções de filtros baseados nos perfis da comunidade (mentorados).
   */
  async getCommunityFilterOptions(
    supabase: any
  ): Promise<{
    organizations: string[]
    topics: string[]
  }> {
    const { data, error } = await supabase
      .from("profiles")
      .select("company, mentorship_topics, mentee_profiles(institution)")
      .eq("community_ready", true)

    if (error) {
      console.error("[CommunityService] Erro ao buscar opções de filtro:", error)
      return { organizations: [], topics: [] }
    }

    const orgs = new Set<string>()
    const topics = new Set<string>()

    ;(data || []).forEach((profile: any) => {
      if (profile.company) orgs.add(profile.company)
      const institution = (Array.isArray(profile.mentee_profiles) ? profile.mentee_profiles[0] : profile.mentee_profiles)?.institution
      if (institution) orgs.add(institution)
      
      if (profile.mentorship_topics && Array.isArray(profile.mentorship_topics)) {
        profile.mentorship_topics.forEach((t: string) => topics.add(t))
      }
    })

    return {
      organizations: Array.from(orgs).sort(),
      topics: Array.from(topics).sort(),
    }
  },
}
