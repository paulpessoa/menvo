/**
 * Camada 5 · Repository (mentor alvo de um pedido de mentoria)
 * Regra: lê de `profiles` + `mentor_profiles` só o que o pedido precisa saber do
 * mentor: se existe, se está verificado e para onde vai o e-mail. Recebe o
 * client por parâmetro (a sessão do mentorado: a RLS vale).
 * Não faz: decidir se o pedido pode seguir (camada 7) nem listar mentores
 * (isso é de `mentors.repository`, que devolve o perfil público).
 * Tradeoff: fica fora de `appointments.repository` porque a tabela é outra, com
 * outra RLS; o e-mail do mentor é a única coluna privada que sai daqui.
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"
import { withMentorFields } from "@/lib/services/mentors/mentor-profile-fields"
import { RepositoryError } from "./repository-error"

/** O mentor como o pedido o enxerga. */
export interface RequestableMentor {
  id: string
  full_name: string | null
  email: string | null
  /** `mentor_profiles.verification_status = 'approved'` (única fonte da verificação). */
  verified: boolean
}

export interface AppointmentMentorRepository {
  /** `null` se não há perfil com esse id (ou o id não é um UUID). */
  findRequestable(mentorId: string): Promise<RequestableMentor | null>
}

/** PGRST116: nenhuma linha. 22P02: texto que não é UUID. Para o app, "não achei". */
const NOT_FOUND_CODES = new Set(["PGRST116", "22P02"])

export function createAppointmentMentorRepository(db: SupabaseClient<Database>): AppointmentMentorRepository {
  return {
    async findRequestable(mentorId) {
      const { data, error } = await db
        .from("profiles")
        .select("id, full_name, email, mentor_profiles(verification_status)")
        .eq("id", mentorId)
        .single()
      // Só um erro com código que não seja "não achei" é falha técnica; o resto é ausência.
      if (error && error.code && !NOT_FOUND_CODES.has(error.code)) {
        throw new RepositoryError("appointmentMentor.findRequestable", error)
      }
      if (error || !data) return null

      const row = data as unknown as { id: string; full_name: string | null; email: string | null; mentor_profiles?: unknown }
      return { id: row.id, full_name: row.full_name, email: row.email, verified: withMentorFields(row).verified }
    },
  }
}
