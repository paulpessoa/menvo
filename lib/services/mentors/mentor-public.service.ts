import { createClient } from "@/lib/utils/supabase/server"
import { createServiceRoleClient } from "@/lib/utils/supabase/service-role"

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
    const supabase = await createClient()

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug)
    const query = supabase
      .from("mentors_view")
      .select("*")
      .eq("verified", true)

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
  }
}
