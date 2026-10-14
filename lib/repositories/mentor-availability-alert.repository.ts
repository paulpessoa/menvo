/**
 * Camada 5 · Repository (alerta de disponibilidade de mentor)
 * Regra: único ponto que fala com o banco para `mentor_availability_alerts`.
 * Recebe o client do Supabase respeitando RLS.
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"
import type { AvailabilityAlert, NewAvailabilityAlert } from "@/lib/domain/mentors/availability-alert.entity"
import { RepositoryError } from "./repository-error"

export interface MentorAvailabilityAlertRepository {
  subscribe(alert: NewAvailabilityAlert): Promise<AvailabilityAlert>
  hasActiveAlert(mentorId: string, menteeId: string): Promise<boolean>
  listPendingByMentor(mentorId: string): Promise<AvailabilityAlert[]>
  markNotified(alertIds: string[]): Promise<void>
}

const COLUMNS = "id, mentor_id, mentee_id, email, created_at, notified_at"

export function createMentorAvailabilityAlertRepository(
  db: SupabaseClient<Database>
): MentorAvailabilityAlertRepository {
  return {
    async subscribe(alert) {
      const { data, error } = await db
        .from("mentor_availability_alerts")
        .insert({
          mentor_id: alert.mentor_id,
          mentee_id: alert.mentee_id ?? null,
          email: alert.email.toLowerCase().trim(),
        })
        .select(COLUMNS)
        .single()

      if (error) {
        // Se já existe alerta pendente idêntico (código Postgres 23505), buscar o existente
        if (error.code === "23505") {
          const { data: existing } = await db
            .from("mentor_availability_alerts")
            .select(COLUMNS)
            .eq("mentor_id", alert.mentor_id)
            .eq("email", alert.email.toLowerCase().trim())
            .is("notified_at", null)
            .maybeSingle()

          if (existing) return existing
        }
        throw new RepositoryError("mentorAvailabilityAlert.subscribe", error)
      }
      return data
    },

    async hasActiveAlert(mentorId, menteeId) {
      const { data, error } = await db
        .from("mentor_availability_alerts")
        .select("id")
        .eq("mentor_id", mentorId)
        .eq("mentee_id", menteeId)
        .is("notified_at", null)
        .maybeSingle()

      if (error) throw new RepositoryError("mentorAvailabilityAlert.hasActiveAlert", error)
      return Boolean(data)
    },

    async listPendingByMentor(mentorId) {
      const { data, error } = await db
        .from("mentor_availability_alerts")
        .select(COLUMNS)
        .eq("mentor_id", mentorId)
        .is("notified_at", null)

      if (error) throw new RepositoryError("mentorAvailabilityAlert.listPendingByMentor", error)
      return data ?? []
    },

    async markNotified(alertIds) {
      if (alertIds.length === 0) return
      const { error } = await db
        .from("mentor_availability_alerts")
        .update({ notified_at: new Date().toISOString() })
        .in("id", alertIds)

      if (error) throw new RepositoryError("mentorAvailabilityAlert.markNotified", error)
    },
  }
}
