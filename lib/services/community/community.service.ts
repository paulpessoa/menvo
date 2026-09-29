import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"

export interface CommunityProfile {
  id: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  job_title: string | null
  company: string | null
  linkedin_url: string | null
  github_url: string | null
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
}

export interface GetCommunityProfilesResult {
  profiles: CommunityProfile[]
  totalCount: number
  hasMore: boolean
}

/**
 * Only non-sensitive columns. Never add email, phone, age, address or
 * original_data here: this list is what mentors receive about a mentee.
 */
const COMMUNITY_COLUMNS =
  "id, full_name, avatar_url, bio, job_title, company, linkedin_url, github_url, expertise_areas, mentorship_topics, learning_goals, slug"

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
    { search = "", page = 0, limit = 12 }: GetCommunityProfilesParams = {}
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

    // Search filter
    const term = sanitizeSearchTerm(search)
    if (term) {
      query = query.or(
        `full_name.ilike.%${term}%,bio.ilike.%${term}%,job_title.ilike.%${term}%,learning_goals.ilike.%${term}%`
      )
    }

    query = query.order("updated_at", { ascending: false }).range(from, to)

    const { data, error, count } = await query

    if (error) {
      console.error("[CommunityService] Error querying profiles:", error)
      throw error
    }

    const profiles: CommunityProfile[] = ((data as RawProfileRow[]) || []).map((p) => ({
      ...p,
      role: "mentee",
    }))

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
      .select(
        `
          id,
          full_name,
          avatar_url,
          bio,
          job_title,
          company,
          linkedin_url,
          github_url,
          expertise_areas,
          slug
        `
      )
      .in("id", validIds)

    if (error) {
      console.error("[CommunityService] Error fetching profiles by ids:", error)
      return []
    }

    return ((data as RawProfileRow[]) || []).map((p) => ({
      id: p.id,
      full_name: p.full_name,
      avatar_url: p.avatar_url,
      bio: p.bio,
      job_title: p.job_title,
      company: p.company,
      linkedin_url: p.linkedin_url,
      github_url: p.github_url,
      expertise_areas: p.expertise_areas,
      slug: p.slug,
      role: "mentee",
    }))
  },
}
