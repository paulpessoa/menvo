import { createClient } from "@/lib/utils/supabase/server"
import { createServiceRoleClient } from "@/lib/utils/supabase/service-role"

/**
 * Everything the public mentor page may show. Never `*`: mentors_view also
 * carries email, phone, address and external_id, and this result is
 * serialized to the browser of anonymous visitors.
 */
const PUBLIC_MENTOR_COLUMNS =
  "id, slug, first_name, last_name, full_name, avatar_url, bio, job_title, company, city, state, country, location, timezone, languages, expertise_areas, mentor_skills, mentorship_topics, free_topics, inclusive_tags, experience_years, academic_level, institution, course, expected_graduation, linkedin_url, github_url, twitter_url, website_url, portfolio_url, cv_url, mentorship_approach, mentorship_guidelines, what_to_expect, ideal_mentee, availability, availability_status, average_rating, total_reviews, total_sessions, chat_enabled, is_public, is_volunteer, verified, verification_status, created_at, updated_at"

export interface PublicMentorData {
  mentor: any
  availability: any[]
}

/**
 * Server-side service for retrieving public mentor profiles and availability.
 */
export const mentorPublicService = {
  /**
   * Fetches a verified mentor by slug or UUID, along with their configured availability slots.
   */
  async getMentorBySlugOrId(slug: string): Promise<PublicMentorData | null> {
    if (!slug || slug === "undefined") {
      return null
    }

    try {
      const supabase = await createClient()

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug)
      // Same visibility gate as the /mentors directory (is_public), so a
      // profile page never exists for a mentor the directory hides.
      const query = supabase
        .from("mentors_view")
        .select(PUBLIC_MENTOR_COLUMNS)
        .eq("verified", true)
        .eq("is_public", true)

      const { data: mentor, error } = await (isUuid
        ? query.eq("id", slug)
        : query.eq("slug", slug)
      ).maybeSingle()

      if (error || !mentor) {
        return null
      }

      // Buscar disponibilidade configurada (usa Service Role para leitura pública irrestrita dos horários)
      let availability: any[] = []
      try {
        const adminSupabase = createServiceRoleClient()
        const { data: availData, error: availError } = await adminSupabase
          .from("mentor_availability")
          .select("*")
          .eq("mentor_id", mentor.id)
          .order("day_of_week")
          .order("start_time")

        if (!availError && availData) {
          availability = availData
        }
      } catch (err) {
        console.error("[mentorPublicService] Erro ao buscar disponibilidade:", err)
      }

      return {
        mentor,
        availability: availability || []
      }
    } catch (err) {
      console.error("[mentorPublicService] Falha ao consultar mentor por slug/id:", err)
      return null
    }
  }
}
