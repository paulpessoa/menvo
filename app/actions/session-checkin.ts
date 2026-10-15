"use server"

import { createClient } from "@/lib/utils/supabase/server"
import { checkinDetailsSchema, checkinOutcomeSchema, type CheckinSummary } from "@/lib/schemas/session-checkin"
import {
  answerCheckin,
  answerMyCheckin,
  findPendingMenteeCheckin,
  submitCheckinDetails,
  type CheckinResult,
  type PendingCheckin
} from "@/lib/services/appointments/checkin-responses.service"

/**
 * Resposta pela página /checkin/[token] (sem login). É uma action disparada
 * por clique, nunca pelo carregamento da página: scanners de e-mail abrem
 * todos os links, e um GET não pode gravar resposta.
 */
export async function answerCheckinAction(token: string, outcome: unknown): Promise<CheckinResult<CheckinSummary>> {
  const parsed = checkinOutcomeSchema.safeParse(outcome)
  if (!parsed.success) return { ok: false, error: "invalid_outcome" }
  return answerCheckin(await createClient(), token, parsed.data)
}

/** Avaliação/nota opcional depois do "aconteceu", também por token. */
export async function submitCheckinDetailsAction(token: string, details: unknown): Promise<CheckinResult<true>> {
  const parsed = checkinDetailsSchema.safeParse(details)
  if (!parsed.success) return { ok: false, error: "invalid_input" }
  return submitCheckinDetails(await createClient(), token, parsed.data)
}

/**
 * Resposta de dentro da plataforma (logado), usada pelo bloqueio de
 * agendamento. O banco confere se o usuário participa da sessão.
 */
export async function answerMyCheckinAction(appointmentId: unknown, outcome: unknown): Promise<CheckinResult<true>> {
  const id = typeof appointmentId === "string" ? appointmentId : ""
  const parsed = checkinOutcomeSchema.safeParse(outcome)
  if (!parsed.success || !/^[0-9a-f-]{36}$/i.test(id)) return { ok: false, error: "invalid_input" }
  return answerMyCheckin(await createClient(), id, parsed.data)
}

/**
 * Sessão do usuário logado que bloqueia um novo agendamento (§4 do doc), ou
 * null. O modal chama isto ao abrir; a API de agendamento aplica a mesma regra.
 */
export async function getMyPendingCheckinAction(): Promise<PendingCheckin | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  return findPendingMenteeCheckin(supabase, user.id)
}
