/**
 * Camada 5 · Repository (disponibilidade do mentor)
 * Regra: único ponto que fala com o banco para `mentor_availability`. Recebe o
 * client do usuário: quem pode ler ou escrever é decidido pelo RLS da
 * migration 20261008000000, nunca por `service_role`.
 * Não faz: regra de negócio (camada 7) nem criar client.
 * Tradeoff: a escrita passa pela RPC `set_mentor_availability` em vez de
 * delete + insert daqui. Custa uma função SQL, mas a troca da agenda vira uma
 * transação: se um slot falhar, a agenda antiga fica intacta.
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"
import type { AvailabilitySlot, NewAvailabilitySlot } from "@/lib/domain/mentors/availability.entity"
import { RepositoryError } from "./repository-error"

export interface MentorAvailabilityRepository {
  listByMentor(mentorId: string): Promise<AvailabilitySlot[]>
  /** Substitui a agenda de quem está logado (o banco usa `auth.uid()`). */
  replaceOwn(slots: NewAvailabilitySlot[], timezone: string | null): Promise<AvailabilitySlot[]>
}

const COLUMNS = "id, mentor_id, day_of_week, start_time, end_time, timezone, created_at, updated_at"

export function createMentorAvailabilityRepository(db: SupabaseClient<Database>): MentorAvailabilityRepository {
  return {
    async listByMentor(mentorId) {
      const { data, error } = await db
        .from("mentor_availability")
        .select(COLUMNS)
        .eq("mentor_id", mentorId)
        .order("day_of_week", { ascending: true })
        .order("start_time", { ascending: true })
      if (error) throw new RepositoryError("mentorAvailability.listByMentor", error)
      return data ?? []
    },

    async replaceOwn(slots, timezone) {
      const { data, error } = await db.rpc("set_mentor_availability", {
        // Spread: o tipo Json do gerador não aceita interfaces (sem index signature).
        p_slots: slots.map((slot) => ({ ...slot })),
        p_timezone: timezone ?? undefined,
      })
      if (error) throw new RepositoryError("mentorAvailability.replaceOwn", error)
      return data ?? []
    },
  }
}
