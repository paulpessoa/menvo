/**
 * Camada 7 · Service (disponibilidade do mentor)
 * Regra: casos de uso da agenda semanal. Recebe o repository por parâmetro,
 * então roda em teste com um fake em memória, sem banco.
 * Não faz: HTTP nem autenticação (camada 8). Quem pode ler ou escrever cada
 * agenda é decidido pelo RLS; o service aplica as regras de negócio.
 * Tradeoff: devolve uma união (`kind`) em vez de lançar, como o service do
 * quiz, para a rota mapear cada caso para um status sem `try/catch` por regra.
 */
import {
  DEFAULT_TIMEZONE,
  isValidRange,
  toDbTime,
  type AvailabilitySlot,
  type NewAvailabilitySlot,
} from "@/lib/domain/mentors/availability.entity"
import type { MentorAvailabilityRepository } from "@/lib/repositories/mentor-availability.repository"
import type { SetAvailabilityInput } from "@/lib/schemas/availability"

export interface MentorAvailabilityServiceDeps {
  repo: MentorAvailabilityRepository
}

export type ListOutcome = { kind: "ok"; slots: AvailabilitySlot[] } | { kind: "failed" }

export type SaveOutcome =
  | { kind: "saved"; slots: AvailabilitySlot[] }
  | { kind: "invalid_range"; dayOfWeek: number }
  | { kind: "failed" }

export function createMentorAvailabilityService({ repo }: MentorAvailabilityServiceDeps) {
  return {
    async list(mentorId: string): Promise<ListOutcome> {
      try {
        return { kind: "ok", slots: await repo.listByMentor(mentorId) }
      } catch (error) {
        console.error("[mentorAvailability.list]", (error as Error).message)
        return { kind: "failed" }
      }
    },

    async saveOwn(input: SetAvailabilityInput): Promise<SaveOutcome> {
      const invalid = input.slots.find((slot) => !isValidRange(slot))
      if (invalid) return { kind: "invalid_range", dayOfWeek: invalid.day_of_week }

      const slots: NewAvailabilitySlot[] = input.slots.map((slot) => ({
        day_of_week: slot.day_of_week,
        start_time: toDbTime(slot.start_time),
        end_time: toDbTime(slot.end_time),
        timezone: slot.timezone || input.timezone || DEFAULT_TIMEZONE,
      }))

      try {
        return { kind: "saved", slots: await repo.replaceOwn(slots, input.timezone ?? null) }
      } catch (error) {
        console.error("[mentorAvailability.saveOwn]", (error as Error).message)
        return { kind: "failed" }
      }
    },
  }
}

export type MentorAvailabilityService = ReturnType<typeof createMentorAvailabilityService>
