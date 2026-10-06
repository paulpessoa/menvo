import { createClient } from "@/lib/utils/supabase/server"
import { createMentorAvailabilityRepository } from "@/lib/repositories/mentor-availability.repository"
import type { AvailabilitySlot } from "@/lib/domain/mentors/availability.entity"

/**
 * Everything the public mentor page may show. Never `*`: mentors_view also
 * carries email, phone and external_id, and this result is
 * serialized to the browser of anonymous visitors.
 */
const PUBLIC_MENTOR_COLUMNS =
  "id, slug, first_name, last_name, full_name, avatar_url, bio, job_title, company, city, state, country, location, timezone, languages, expertise_areas, mentor_skills, mentorship_topics, free_topics, inclusive_tags, experience_years, academic_level, institution, course, linkedin_url, github_url, website_url, portfolio_url, mentorship_approach, what_to_expect, ideal_mentee, availability, availability_status, average_rating, total_reviews, total_sessions, chat_enabled, is_public, is_volunteer, verified, verification_status, created_at, updated_at"

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

      // Mentor já filtrado como aprovado e público acima, então o RLS de
      // mentor_availability (migration 20261008000000) libera a leitura com o
      // client do visitante. Antes isto usava service_role.
      let availability: AvailabilitySlot[] = []
      try {
        // mentors_view tipa id como nullable (toda coluna de view é); na prática nunca é.
        if (mentor.id) availability = await createMentorAvailabilityRepository(supabase).listByMentor(mentor.id)
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
