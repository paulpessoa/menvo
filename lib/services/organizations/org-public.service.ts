import { createClient } from "@/lib/utils/supabase/server"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"

export interface MentorOrganizationChip {
  name: string
  slug: string
}

export const orgPublicService = {
  async getOrganizationBySlug(slug: string, db?: SupabaseClient<Database>) {
    const supabase = db ?? (await createClient())
    const { data, error } = await supabase
      .from("organizations")
      .select("slug, name, type, join_policy")
      .eq("slug", slug)
      .eq("status", "active")
      .maybeSingle()

    if (error) {
      console.error("[orgPublicService] Error fetching organization:", error)
      return null
    }

    return data
  },

  /**
   * Retorna um mapa de mentorId -> { name, slug } para mentores vinculados a
   * organizações parceiras ativas com política aberta (join_policy: 'open').
   * Usado em MentorCard e MentorProfileClient (C-O4).
   *
   * Realiza uma única query em lote (.in('user_id', mentorIds)) para evitar N+1.
   */
  async getOpenOrganizationsForMentors(
    mentorIds: string[],
    db?: SupabaseClient<Database>
  ): Promise<Map<string, MentorOrganizationChip>> {
    const validIds = mentorIds.filter(Boolean)
    if (validIds.length === 0) return new Map()

    const supabase = db ?? (await createClient())
    const { data, error } = await (supabase.from("organization_members") as any)
      .select("user_id, organizations!inner(name, slug, status, join_policy)")
      .in("user_id", validIds)
      .eq("status", "active")
      .eq("organizations.status", "active")
      .eq("organizations.join_policy", "open")

    if (error) {
      console.warn("[orgPublicService.getOpenOrganizationsForMentors]", error.message)
      return new Map()
    }

    const map = new Map<string, MentorOrganizationChip>()
    for (const row of (data as any[]) ?? []) {
      const org = Array.isArray(row.organizations) ? row.organizations[0] : row.organizations
      if (org?.name && org?.slug && !map.has(row.user_id)) {
        map.set(row.user_id, { name: org.name, slug: org.slug })
      }
    }
    return map
  }
}
