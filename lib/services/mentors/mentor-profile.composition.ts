/**
 * Camada 7 · Composição do service de perfil de mentor
 * Regra: escolhe as implementações reais dos repositories. Página, rota,
 * server action e tool do agente chamam `buildMentorProfileService` com o
 * client de quem está pedindo; nada aqui usa `service_role`.
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"
import { createMentorAvailabilityRepository } from "@/lib/repositories/mentor-availability.repository"
import { createMentorsRepository } from "@/lib/repositories/mentors.repository"
import { createMentorProfileService } from "./mentor-profile.service"

export function buildMentorProfileService(supabase: SupabaseClient<Database>) {
  return createMentorProfileService({
    mentors: createMentorsRepository(supabase),
    availability: createMentorAvailabilityRepository(supabase),
  })
}
