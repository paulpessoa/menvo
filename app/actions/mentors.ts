"use server"

import { createClient } from "@/lib/utils/supabase/server"
import { buildMentorProfileService } from "@/lib/services/mentors/mentor-profile.composition"

export async function searchCatalogAction(params: {
  filters: {
    search?: string
    country?: string
    state?: string
    city?: string
    languages?: string[]
    topics?: string[]
    inclusiveTags?: string[]
    availabilityStatus?: string
    experienceYears?: string
    sortBy?: "relevance" | "experience" | "newest" | "name"
  }
  page: number
  limit: number
}) {
  const supabase = await createClient()
  const { filters, page, limit } = params
  
  let query = (supabase.from("mentors_view") as any).select(
    `
      id,
      full_name,
      avatar_url,
      bio,
      job_title,
      company,
      city,
      state,
      country,
      languages,
      mentorship_topics,
      inclusive_tags,
      expertise_areas,
      availability_status,
      average_rating,
      total_reviews,
      total_sessions,
      experience_years,
      slug,
      created_at
    `,
    { count: "exact" }
  ).eq("is_public", true)

  if (filters.search && filters.search.trim() !== "") {
    const sanitized = filters.search.trim().replace(/[,()]/g, " ")
    const searchTerm = `%${sanitized}%`
    query = query.or(
      `full_name.ilike.${searchTerm},job_title.ilike.${searchTerm},company.ilike.${searchTerm},bio.ilike.${searchTerm}`
    )
  }

  if (filters.country && filters.country !== "all") {
    query = query.eq("country", filters.country)
  }

  if (filters.state && filters.state !== "all") {
    query = query.eq("state", filters.state)
  }

  if (filters.city && filters.city.trim() !== "") {
    query = query.ilike("city", `%${filters.city.trim()}%`)
  }

  if (filters.languages && filters.languages.length > 0) {
    query = query.overlaps("languages", filters.languages)
  }

  if (filters.topics && filters.topics.length > 0) {
    query = query.overlaps("mentorship_topics", filters.topics)
  }

  if (filters.inclusiveTags && filters.inclusiveTags.length > 0) {
    query = query.overlaps("inclusive_tags", filters.inclusiveTags)
  }

  if (filters.availabilityStatus && filters.availabilityStatus !== "all") {
    query = query.eq("availability_status", filters.availabilityStatus)
  }

  if (filters.experienceYears && filters.experienceYears !== "all") {
    const parts = filters.experienceYears.split("-")
    const min = parseInt(parts[0])
    const max = parts[1] ? parseInt(parts[1]) : null

    if (!isNaN(min)) {
      query = query.gte("experience_years", min)
    }
    if (max && !isNaN(max)) {
      query = query.lte("experience_years", max)
    }
  }

  const from = page * limit
  const to = from + limit - 1

  if (filters.sortBy === "experience") {
    query = query.order("experience_years", { ascending: false })
  } else if (filters.sortBy === "newest") {
    query = query.order("created_at", { ascending: false })
  } else if (filters.sortBy === "name") {
    query = query.order("full_name", { ascending: true })
  } else {
    query = query.order("average_rating", { ascending: false })
  }

  query = query.range(from, to)

  const { data, error, count } = await query
  if (error) throw error

  return { data: data || [], count: count || 0 }
}

export async function getCatalogFilterOptionsAction() {
  const supabase = await createClient()
  const { data, error } = await (supabase.from("mentors_view") as any)
    .select(
      "country, state, city, languages, mentorship_topics, inclusive_tags"
    )
    .eq("is_public", true)

  if (error) throw error

  const countries = new Set<string>()
  const states = new Set<string>()
  const cities = new Set<string>()
  const languages = new Set<string>()
  const topics = new Set<string>()
  const inclusiveTags = new Set<string>()

  ;(data as any[])?.forEach((mentor) => {
    if (mentor.country) countries.add(mentor.country)
    if (mentor.state) states.add(mentor.state)
    if (mentor.city) cities.add(mentor.city)
    mentor.languages?.forEach((l: string) => languages.add(l))
    mentor.mentorship_topics?.forEach((t: string) => topics.add(t))
    mentor.inclusive_tags?.forEach((t: string) => inclusiveTags.add(t))
  })

  return {
    countries: Array.from(countries).sort(),
    states: Array.from(states).sort(),
    cities: Array.from(cities).sort(),
    languages: Array.from(languages).sort(),
    topics: Array.from(topics).sort(),
    inclusiveTags: Array.from(inclusiveTags).sort()
  }
}

export async function getMentorReviewsAction(mentorId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("appointment_feedbacks")
    .select(`
      id,
      rating,
      public_feedback,
      created_at,
      mentee:profiles!reviewer_id(first_name, last_name, avatar_url)
    `)
    .eq("reviewed_id", mentorId)
    .eq("status", "approved")
    .order("created_at", { ascending: false })

  if (error) throw error
  return (data as any) || []
}

export async function resolveMentorSlugsAction(names: string[]) {
  if (!names || names.length === 0) return []
  return buildMentorProfileService(await createClient()).resolveSlugs(names)
}
