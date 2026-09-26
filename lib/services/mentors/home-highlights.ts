import { createClient } from "@supabase/supabase-js"
import { unstable_cache } from "next/cache"
import type { Database } from "@/lib/types/supabase"

/**
 * Dados reais exibidos na home: mentores em destaque e números de impacto.
 *
 * Usa o client anônimo (sem cookies) porque só lê dados públicos de
 * `mentors_view` — isso permite cachear o resultado entre requisições.
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

export interface HomeHighlights {
  featuredMentors: HomeMentor[]
  stats: {
    mentors: number
    sessions: number
    topics: number
  }
}

const EMPTY: HomeHighlights = {
  featuredMentors: [],
  stats: { mentors: 0, sessions: 0, topics: 0 },
}

const FEATURED_LIMIT = 4

async function fetchHomeHighlights(): Promise<HomeHighlights> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return EMPTY

  try {
    const supabase = createClient<Database>(url, key)
    const { data, error } = await (supabase.from("mentors_view") as any)
      .select(CARD_FIELDS)
      .eq("is_public", true)
      .not("slug", "is", null)

    if (error || !data) {
      console.error("[home] Failed to load mentor highlights:", error)
      return EMPTY
    }

    const mentors = data as HomeMentor[]

    const sessions = mentors.reduce((sum, m) => sum + (m.total_sessions ?? 0), 0)
    const topics = new Set(
      mentors.flatMap((m) => m.mentorship_topics ?? []).map((t) => t.trim().toLowerCase())
    )

    // Destaque: mentores com foto, priorizando quem mais atendeu e melhor avaliado
    const featuredMentors = mentors
      .filter((m) => Boolean(m.avatar_url) && Boolean(m.full_name))
      .sort(
        (a, b) =>
          (b.total_sessions ?? 0) - (a.total_sessions ?? 0) ||
          (b.average_rating ?? 0) - (a.average_rating ?? 0)
      )
      .slice(0, FEATURED_LIMIT)

    return {
      featuredMentors,
      stats: { mentors: mentors.length, sessions, topics: topics.size },
    }
  } catch (error) {
    // A home sem destaques ainda funciona; nunca derrubar a página por isso.
    console.error("[home] Failed to load mentor highlights:", error)
    return EMPTY
  }
}

export const getHomeHighlights = unstable_cache(fetchHomeHighlights, ["home-highlights"], {
  revalidate: 3600,
})
