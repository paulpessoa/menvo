/**
 * Camada 10 · Efeitos de mutação (appointments)
 * Regra: só ações do domínio appointments, com o prefixo `appointments.`.
 * Toda mudança de estado de uma sessão deixa velhas as listas e o que depende
 * delas (disponibilidade inclusive), todas sob `["appointments"]`.
 */
import { appointmentsKeys } from "../keys/appointments"
import type { Keys } from "./types"

const stale = (): Keys => [appointmentsKeys.all]

export const appointmentsEffects = {
  "appointments.request": stale,
  "appointments.confirm": stale,
  "appointments.cancel": stale,
  "appointments.complete": stale,
  "appointments.evaluate": stale,
  "appointments.no-show": stale,
} satisfies Record<`appointments.${string}`, (ctx: never) => Keys>
