import { createClient } from "@/lib/utils/supabase/server"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"
import { createOrganizationsRepository } from "@/lib/repositories/organizations.repository"

export interface MentorOrganizationChip {
  name: string
  slug: string
}

/**
 * Leituras públicas de organização (página `/o/[slug]` e chip nos cards de
 * mentor). Falha de banco degrada para "não achei" (`null` / mapa vazio) em
 * vez de quebrar a página: uma org some do chip, o catálogo continua.
 */
export const orgPublicService = {
  async getOrganizationBySlug(slug: string, db?: SupabaseClient<Database>) {
    const supabase = db ?? (await createClient())
    try {
      return await createOrganizationsRepository(supabase).findActiveBySlug(slug)
    } catch (error) {
      console.error("[orgPublicService] Error fetching organization:", error)
      return null
    }
  },

  /**
   * Retorna um mapa de mentorId -> { name, slug } para mentores vinculados a
   * organizações parceiras ativas com política aberta (join_policy: 'open').
   * Usado em MentorCard e MentorProfileClient (C-O4).
   *
   * Uma única query em lote (repository, `.in('user_id', mentorIds)`) para
   * evitar N+1. Se o mentor está em mais de uma org, vale a primeira.
   */
  async getOpenOrganizationsForMentors(
    mentorIds: string[],
    db?: SupabaseClient<Database>
  ): Promise<Map<string, MentorOrganizationChip>> {
    const validIds = mentorIds.filter(Boolean)
    if (validIds.length === 0) return new Map()

    const supabase = db ?? (await createClient())
    try {
      const links = await createOrganizationsRepository(supabase).listOpenOrganizationLinks(validIds)
      const map = new Map<string, MentorOrganizationChip>()
      for (const link of links) {
        if (!map.has(link.user_id)) map.set(link.user_id, { name: link.name, slug: link.slug })
      }
      return map
    } catch (error) {
      console.warn("[orgPublicService.getOpenOrganizationsForMentors]", error instanceof Error ? error.message : error)
      return new Map()
    }
  }
}
