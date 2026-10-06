/**
 * Camada 7 · Composição do service de disponibilidade
 * Regra: o único lugar que escolhe a implementação real do repository. As
 * rotas só chamam `buildMentorAvailabilityService`.
 * Tradeoff: recebe o client do usuário e nunca cria `service_role`: o RLS da
 * migration 20261008000000 já cobre leitura pública e escrita do dono.
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"
import { createMentorAvailabilityRepository } from "@/lib/repositories/mentor-availability.repository"
import { createMentorAvailabilityService } from "./mentor-availability.service"

export function buildMentorAvailabilityService(supabase: SupabaseClient<Database>) {
  return createMentorAvailabilityService({ repo: createMentorAvailabilityRepository(supabase) })
}
