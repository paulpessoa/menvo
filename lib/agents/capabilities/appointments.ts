/**
 * Camada 14 · Capabilities (appointments)
 * Regra: ações do usuário logado sobre as próprias mentorias. A permissão por
 * papel mora em `audience` (antes eram `if (role === ...)` no agent.ts).
 * Não faz: regra de negócio; delega a `lib/services/assistant/tools`.
 * Tradeoff: o handler recebe só o client com RLS do usuário. A avaliação já
 * funciona assim porque as policies de appointment_feedbacks, appointments e
 * feedback deixam o participante inserir/atualizar o que é dele.
 */
import { defineCapability, type CapabilityContext } from "../define"
import {
  getMyAppointments,
  getMyAppointmentsInput,
  getPendingEvaluations,
  getPendingEvaluationsInput,
  getMentorRequests,
  getMentorRequestsInput,
  evaluateMentorshipSession,
  evaluateMentorshipSessionInput
} from "@/lib/services/assistant/tools"

/** A `audience` já barra anônimos; isto é a rede de segurança para o tipo. */
function requireActor(ctx: CapabilityContext) {
  if (!ctx.actor) throw new Error("Capability exige usuário autenticado")
  return ctx.actor
}

export const myAppointmentsCapability = defineCapability({
  name: "appointments.mine",
  toolName: "getMyAppointments",
  title: "Minhas mentorias",
  description: "Consulta as mentorias agendadas do usuário atual (próximas e recentes)",
  input: getMyAppointmentsInput,
  audience: ["authenticated"],
  effect: "read",
  confirmation: "none",
  handler: (input, ctx) => getMyAppointments(ctx.supabase, requireActor(ctx).id, input)
})

export const pendingEvaluationsCapability = defineCapability({
  name: "appointments.pendingEvaluations",
  toolName: "getPendingEvaluations",
  title: "Mentorias aguardando avaliação",
  description: "Consulta mentorias concluídas que ainda aguardam avaliação pelo mentorado",
  input: getPendingEvaluationsInput,
  // Invariante #2: só mentorado avalia mentor.
  audience: ["mentee", "admin"],
  effect: "read",
  confirmation: "none",
  handler: (_input, ctx) => {
    const actor = requireActor(ctx)
    return getPendingEvaluations(ctx.supabase, actor.id, actor.role)
  }
})

export const mentorRequestsCapability = defineCapability({
  name: "appointments.mentorRequests",
  toolName: "getMentorRequests",
  title: "Solicitações de mentoria pendentes",
  description: "Consulta solicitações de mentoria pendentes de confirmação pelo mentor",
  input: getMentorRequestsInput,
  audience: ["mentor", "admin"],
  effect: "read",
  confirmation: "none",
  handler: (_input, ctx) => {
    const actor = requireActor(ctx)
    return getMentorRequests(ctx.supabase, actor.id, actor.role)
  }
})

export const evaluateSessionCapability = defineCapability({
  name: "appointments.evaluate",
  toolName: "evaluateMentorshipSession",
  title: "Avaliar mentoria",
  description:
    "Registra a avaliação do mentorado para uma mentoria realizada (nota de 1 a 5 e feedback opcional)",
  input: evaluateMentorshipSessionInput,
  audience: ["mentee", "admin"],
  effect: "write",
  // Dívida: o assistente hoje executa direto (o system prompt manda pedir a
  // nota antes). Mudar para "user" exige UI de confirmação; ver STATUS.md.
  confirmation: "none",
  handler: (input, ctx) => evaluateMentorshipSession(ctx.supabase, requireActor(ctx).id, input)
})
