/**
 * Camada 3 · Entity (disponibilidade do mentor)
 * Regra: o formato de um horário semanal que o app usa, derivado da Row, e as
 * regras puras sobre ele (normalizar hora, validar intervalo).
 * Não faz: acesso a banco (camada 5) nem validar o body da request (camada 4).
 * Tradeoff: a Row inteira é a entity, porque nada nela é sensível e os
 * consumidores atuais (dashboard, agendamento) já usam esse formato. Manter
 * snake_case evita um mapper só de nomes.
 */
import type { Tables } from "@/lib/types/supabase"

export type AvailabilitySlot = Tables<"mentor_availability">

/** O que o mentor envia ao salvar a agenda; `mentor_id` vem sempre da sessão. */
export interface NewAvailabilitySlot {
  day_of_week: number
  start_time: string
  end_time: string
  timezone: string | null
}

export const DEFAULT_TIMEZONE = "America/Sao_Paulo"

/** "09:00" → "09:00:00": o banco guarda `time` com segundos; o formulário manda sem. */
export function toDbTime(value: string): string {
  return value.length === 5 ? `${value}:00` : value
}

/** Um horário só faz sentido se termina depois de começar (não há slot virando a meia-noite). */
export function isValidRange(slot: Pick<NewAvailabilitySlot, "start_time" | "end_time">): boolean {
  return toDbTime(slot.end_time) > toDbTime(slot.start_time)
}
