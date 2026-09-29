import { createClient } from "@/lib/utils/supabase/server"

export const orgPublicService = {
  async getOrganizationBySlug(slug: string) {
    const supabase = await createClient()
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
  }
}
