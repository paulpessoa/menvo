/**
 * Camada 7 · Composição do service da comunidade
 * Regra: liga o repository real ao client de quem pede. Rota e server action
 * passam o client de servidor (cookie); nada aqui usa `service_role`.
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"
import { createCommunityRepository } from "@/lib/repositories/community.repository"
import { createCommunityService } from "./community.service"

export function buildCommunityService(supabase: SupabaseClient<Database>) {
  return createCommunityService({ community: createCommunityRepository(supabase) })
}