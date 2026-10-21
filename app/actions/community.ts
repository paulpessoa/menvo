"use server"

import { createClient } from "@/lib/utils/supabase/server"
import type { GetCommunityProfilesParams, GetCommunityProfilesResult } from "@/lib/services/community/community.service"
import { buildCommunityService } from "@/lib/services/community/community.composition"

/**
 * Busca do mural para mentor/admin. Usa o client de servidor (cookie) via
 * service: antes o service usava o client anônimo do browser e o RLS devolvia
 * o mural vazio.
 */
export async function searchCommunityAction(
  params: GetCommunityProfilesParams
): Promise<GetCommunityProfilesResult> {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new Error("Unauthorized")
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("user_roles(roles(name))")
      .eq("id", user.id)
      .maybeSingle()

    const roleNames = ((profile as any)?.user_roles || []).map((ur: any) => ur.roles?.name).filter(Boolean)
    const isMentor = roleNames.includes("mentor")
    const isAdmin = roleNames.includes("admin")

    if (!isMentor && !isAdmin) {
      throw new Error("Forbidden")
    }

    return await buildCommunityService(supabase).getCommunityProfiles(params)
  } catch (error: any) {
    console.error("[searchCommunityAction Error]:", error)
    throw new Error("Failed to fetch community profiles")
  }
}