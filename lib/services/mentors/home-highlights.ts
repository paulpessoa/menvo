import { createClient } from "@supabase/supabase-js"
import { unstable_cache } from "next/cache"
import type { Database } from "@/lib/types/supabase"

/**
 * Mentores em destaque exibidos na home, a partir de dados reais.
 *
 * Usa o client anônimo (sem cookies) porque só lê dados públicos de
 * `mentors_view` - isso permite cachear o resultado entre requisições.
 */

const CARD_FIELDS = `
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
  slug
`

export interface HomeMentor {
  id: string | null
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  job_title: string | null
  company: string | null
  city: string | null
  state: string | null
  country: string | null
  languages: string[] | null
  mentorship_topics: string[] | null
  inclusive_tags: string[] | null
  expertise_areas: string[] | null
  availability_status: string | null
  average_rating: number | null
  total_reviews: number | null
  total_sessions: number | null
  experience_years: number | null
  slug: string | null
}

const FEATURED_LIMIT = 4

async function fetchFeaturedMentors(): Promise<HomeMentor[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return []

  try {
    const supabase = createClient<Database>(url, key)
    // Destaque: mentores com foto, priorizando quem mais atendeu e melhor avaliado
    const { data, error } = await (supabase.from("mentors_view") as any)
      .select(CARD_FIELDS)
      .eq("is_public", true)
      .not("slug", "is", null)
      .not("avatar_url", "is", null)
      .not("full_name", "is", null)
      .order("total_sessions", { ascending: false, nullsFirst: false })
      .order("average_rating", { ascending: false, nullsFirst: false })
      .limit(FEATURED_LIMIT)

    if (error || !data) {
      console.error("[home] Failed to load featured mentors:", error)
      return []
    }

    return data as HomeMentor[]
  } catch (error) {
    // A home sem destaques ainda funciona; nunca derrubar a página por isso.
    console.error("[home] Failed to load featured mentors:", error)
    return []
  }
}

export const getFeaturedMentors = unstable_cache(fetchFeaturedMentors, ["home-featured-mentors"], {
  revalidate: 3600,
})
