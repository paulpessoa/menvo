/**
 * Camada 5 · Repository (fontes das notificações do sino)
 * Regra: único ponto que lê `appointments` e `appointment_feedbacks` para as
 * notificações de quem está logado. Recebe o client DA SESSÃO: o RLS limita
 * às linhas do usuário, e o filtro por `userId` aqui é a segunda trava.
 * Não faz: regra de notificação (entity) nem decidir erro HTTP.
 * Tradeoff: nome `me-notifications` e não `appointments`, de propósito: o
 * repository de appointments é de outra linha. Quando existir, estas duas
 * consultas devem migrar para lá.
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"
import type { NotificationAppointment } from "@/lib/domain/profile/notification.entity"
import { RepositoryError } from "./repository-error"

export interface MeNotificationsRepository {
  /** Os 20 agendamentos mais recentemente alterados em que o usuário é mentor ou mentorado. */
  listRecentAppointments(userId: string): Promise<NotificationAppointment[]>
  /** Ids dos agendamentos que o usuário já avaliou. */
  listReviewedAppointmentIds(userId: string): Promise<string[]>
}

const RECENT_LIMIT = 20

const APPOINTMENT_COLUMNS = `
  id,
  mentor_id,
  mentee_id,
  scheduled_at,
  status,
  notes_mentor,
  created_at,
  updated_at,
  mentor:profiles!mentor_id(full_name),
  mentee:profiles!mentee_id(full_name)
` as const

export function createMeNotificationsRepository(db: SupabaseClient<Database>): MeNotificationsRepository {
  return {
    async listRecentAppointments(userId) {
      const { data, error } = await db
        .from("appointments")
        .select(APPOINTMENT_COLUMNS)
        .or(`mentor_id.eq.${userId},mentee_id.eq.${userId}`)
        .order("updated_at", { ascending: false })
        .limit(RECENT_LIMIT)
      if (error) throw new RepositoryError("meNotifications.listRecentAppointments", error)
      return (data ?? []) as unknown as NotificationAppointment[]
    },

    async listReviewedAppointmentIds(userId) {
      const { data, error } = await db
        .from("appointment_feedbacks")
        .select("appointment_id")
        .eq("reviewer_id", userId)
      if (error) throw new RepositoryError("meNotifications.listReviewedAppointmentIds", error)
      return (data ?? []).map((row) => String(row.appointment_id))
    },
  }
}
