import { createClient } from "@/lib/utils/supabase/client"

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
  slug: string | null
  role: string
}

interface RawProfileRow {
  id: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  job_title: string | null
  company: string | null
  linkedin_url: string | null
  github_url: string | null
  expertise_areas: string[] | null
  slug: string | null
}

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

export const communityService = {
  /**
   * Fetches public mentees for the Community wall.
   * Excludes active mentors from mentors_view so only mentees/learners are displayed.
   * Queries profiles directly to prevent RLS blockage on auxiliary role tables.
   */
  async getCommunityProfiles({
    search = "",
    page = 0,
    limit = 12,
  }: GetCommunityProfilesParams = {}): Promise<GetCommunityProfilesResult> {
    const supabase = createClient()
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
        `,
        { count: "exact" }
      )
      .eq("is_public", true)
      .not("bio", "is", null)

    // Exclude mentors at database query level
    if (mentorIds.length > 0) {
      query = query.not("id", "in", `(${mentorIds.join(",")})`)
    }

    // Search filter
    if (search.trim()) {
      const term = search.trim()
      query = query.or(
        `full_name.ilike.%${term}%,bio.ilike.%${term}%,job_title.ilike.%${term}%`
      )
    }

    query = query.order("created_at", { ascending: false }).range(from, to)

    const { data, error, count } = await query

    if (error) {
      console.error("[CommunityService] Error querying profiles:", error)
      throw error
    }

    const rawProfiles = (data as RawProfileRow[]) || []
    const profiles: CommunityProfile[] = rawProfiles.map((p) => ({
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

    const totalCount = count || 0
    const hasMore = totalCount > from + profiles.length

    return {
      profiles,
      totalCount,
      hasMore,
    }
  },
}
