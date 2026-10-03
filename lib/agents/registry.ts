/**
 * Camada 14 · Registro de capabilities
 * Regra: junta todas as capabilities num só lugar e garante nomes únicos.
 * Estar aqui NÃO expõe nada a ninguém: quem decide é `exposure.ts`.
 * Tradeoff: a ordem da lista é a ordem das tools entregues ao modelo; foi
 * mantida igual à do assistente antigo para não mudar o comportamento dele.
 */
import type { AnyCapability } from "./define"
import {
  searchMentorsCapability,
  mentorAvailabilityCapability
} from "./capabilities/mentors"
import { explainPlatformCapability, searchKnowledgeBaseCapability } from "./capabilities/platform"
import { saveFeedbackCapability } from "./capabilities/feedback"
import {
  myAppointmentsCapability,
  pendingEvaluationsCapability,
  evaluateSessionCapability,
  mentorRequestsCapability
} from "./capabilities/appointments"

export const capabilities: readonly AnyCapability[] = [
  searchMentorsCapability,
  mentorAvailabilityCapability,
  explainPlatformCapability,
  searchKnowledgeBaseCapability,
  saveFeedbackCapability,
  myAppointmentsCapability,
  pendingEvaluationsCapability,
  evaluateSessionCapability,
  mentorRequestsCapability
]

/** Falha cedo (no import) se dois `name` ou `toolName` colidirem. */
function assertUnique(values: string[], label: string) {
  const dup = values.find((v, i) => values.indexOf(v) !== i)
  if (dup) throw new Error(`Capability duplicada (${label}): ${dup}`)
}
assertUnique(capabilities.map((c) => c.name), "name")
assertUnique(capabilities.map((c) => c.toolName), "toolName")
