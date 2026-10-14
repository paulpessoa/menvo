/**
 * Camada 3 · Entity (alerta de disponibilidade de mentor)
 * Regra: registro de interesse quando um mentor não tem horários disponíveis (C-M3).
 * A Row do banco é a entity, preservando compatibilidade com Supabase.
 */
import type { Tables } from "@/lib/types/supabase"

export type AvailabilityAlert = Tables<"mentor_availability_alerts">

export interface NewAvailabilityAlert {
  mentor_id: string
  mentee_id?: string | null
  email: string
}

/** Valida formato de e-mail básico para a entity */
export function isValidAlertEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}
