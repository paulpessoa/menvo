/**
 * Camada 9 · Contrato OpenAPI (appointments)
 * Regra: descreve as 11 operações de `app/api/appointments/**` com os mesmos
 * schemas Zod da camada 4 (`lib/schemas/appointment.ts` e
 * `appointment-responses.ts`). Os status documentados são os que o código devolve
 * hoje; o teste de drift (`document.test.ts`) garante que cada rota exista aqui.
 * Não faz: registrar rotas de outro domínio. Nenhuma rota mudou para isto.
 * As rotas sem chamador (`[id]`, `schedule` GET, `action`) foram apagadas.
 */
import { registry } from "../registry"
import { apiErrorSchema } from "@/lib/schemas/api"
import {
  availabilityQuerySchema,
  cancelAppointmentSchema,
  completeAppointmentSchema,
  confirmAppointmentSchema,
  createAppointmentSchema,
  listAppointmentsQuerySchema,
  markCompletedAppointmentSchema,
  noShowAppointmentSchema,
  updateFeedbackSchema,
} from "@/lib/schemas/appointment"
import {
  appointmentDataResponseSchema,
  appointmentSuccessSchema,
  availabilityResponseSchema,
  cancelResponseSchema,
  confirmResponseSchema,
  listAppointmentsResponseSchema,
  listFeedbacksQuerySchema,
  listFeedbacksResponseSchema,
  scheduleRequestSchema,
} from "@/lib/schemas/appointment-responses"
import { z } from "zod"

const json = <T extends z.ZodTypeAny>(schema: T) => ({ "application/json": { schema } })
const error = (description: string) => ({ description, content: json(apiErrorSchema) })

const unauthenticated = error("Não autenticado")
const notFound = error("Agendamento não encontrado")
const statusConflict = error(
  "O status mudou no meio (`code`: `status_changed`) ou o par de status não é permitido (`code`: `invalid_transition`)"
)
const serverError = error("Erro interno")

registry.registerPath({
  method: "get",
  path: "/api/appointments/list",
  tags: ["appointments"],
  summary: "Sessões do usuário logado",
  description:
    "Sempre filtra por `mentor_id` ou `mentee_id` do usuário da sessão. Traz nome, avatar, LinkedIn e e-mail da outra parte (leitura privilegiada, ADR 0008 E3).",
  request: { query: listAppointmentsQuerySchema },
  responses: {
    200: { description: "Sessões, mais recentes primeiro", content: json(listAppointmentsResponseSchema) },
    400: error("`role`, `status` ou `limit` inválido (limite máximo 100)"),
    401: unauthenticated,
    500: serverError,
  },
})

registry.registerPath({
  method: "get",
  path: "/api/appointments/availability",
  tags: ["appointments"],
  summary: "Horários livres de um mentor",
  description:
    "Pública (visitante vê a agenda no perfil do mentor). Projeta a agenda semanal, tira horários passados, pedidos pendentes/confirmados e, se o mentor conectou, ocupados no Google Calendar. Padrão: próximos 7 dias.",
  request: { query: availabilityQuerySchema },
  responses: {
    200: { description: "Horários de 45 minutos", content: json(availabilityResponseSchema) },
    400: error("`mentor_id` ausente"),
    500: serverError,
  },
})

registry.registerPath({
  method: "post",
  path: "/api/appointments/schedule",
  tags: ["appointments"],
  summary: "Pede uma mentoria (fluxo do modal de agendamento)",
  description:
    "Cria o pedido `pending` e avisa o mentor por e-mail. Aceita chaves em snake_case e camelCase. Falha com 409 `pending_checkin` se a última sessão do mentorado não teve o \"aconteceu?\" respondido (`details` traz o id da sessão), e com 409 se o horário já está reservado.",
  request: { body: { content: json(scheduleRequestSchema) } },
  responses: {
    200: { description: "Pedido criado (`data` é a sessão)", content: json(appointmentDataResponseSchema) },
    400: error("Campos obrigatórios ausentes, motivo curto ou auto-agendamento"),
    401: unauthenticated,
    403: error("Mentor não verificado"),
    404: error("Mentor não encontrado"),
    409: error("Horário reservado, ou check-in da última sessão pendente (`details.reason`: `pending_checkin`)"),
    500: serverError,
  },
})

registry.registerPath({
  method: "post",
  path: "/api/appointments/create",
  tags: ["appointments"],
  summary: "Pede uma mentoria (formulário de /appointments/book/{mentorId})",
  description:
    "Mesmo caso de uso de `schedule`, com outro formato de resposta e menos checagens (não confere mentor verificado nem horário ocupado). Aceita `message` como apelido de `notes_mentee`.",
  request: { body: { content: json(createAppointmentSchema) } },
  responses: {
    201: { description: "Pedido criado (`appointment`)", content: json(z.object({ success: z.literal(true), appointment: z.unknown() })) },
    400: error("Dados inválidos"),
    401: unauthenticated,
    409: error("Check-in da última sessão pendente (`details.reason`: `pending_checkin`)"),
    500: serverError,
  },
})

registry.registerPath({
  method: "post",
  path: "/api/appointments/confirm",
  tags: ["appointments"],
  summary: "Mentor confirma um pedido",
  description:
    "Dois caminhos. Com `token` (link do e-mail): sem sessão, o segredo é a credencial (ADR 0008 E5). Só com `appointmentId`: exige sessão e que seja o mentor da sessão. Troca o status primeiro, depois cria o evento no Google Calendar com Meet e envia o e-mail; calendário e e-mail são best effort (`calendarError`).",
  request: { body: { content: json(confirmAppointmentSchema) } },
  responses: {
    200: { description: "Confirmada, ou já estava", content: json(confirmResponseSchema) },
    400: error("Corpo inválido, ou o status atual não é `pending`"),
    403: error("`appointmentId` sem sessão ou por quem não é o mentor"),
    404: error("Agendamento não encontrado ou token inválido"),
    409: statusConflict,
    410: error("O link do e-mail passou de 7 dias (`code`: `token_expired`); o botão do painel continua valendo"),
    500: serverError,
  },
})

registry.registerPath({
  method: "post",
  path: "/api/appointments/cancel",
  tags: ["appointments"],
  summary: "Mentor ou mentorado cancela uma sessão",
  description:
    "Só quem participa cancela; quem não participa recebe 404, igual a um id inexistente. Remove o evento do Google Calendar e avisa a outra parte por e-mail (best effort). Mentorado não desfaz uma sessão já concluída (403).",
  request: { body: { content: json(cancelAppointmentSchema) } },
  responses: {
    200: { description: "Cancelada", content: json(cancelResponseSchema) },
    400: error("Corpo inválido, ou a sessão já estava cancelada"),
    401: unauthenticated,
    403: error("Apenas o mentor pode cancelar uma sessão já concluída"),
    404: notFound,
    409: statusConflict,
    500: serverError,
  },
})

registry.registerPath({
  method: "post",
  path: "/api/appointments/mark-completed",
  tags: ["appointments"],
  summary: "Mentor marca a sessão como concluída",
  description: "Só `confirmed -> completed`, só pelo mentor; não pede avaliação (o mentorado avalia depois).",
  request: { body: { content: json(markCompletedAppointmentSchema) } },
  responses: {
    200: { description: "Concluída", content: json(appointmentSuccessSchema) },
    400: error("Id inválido, ou a sessão não está `confirmed`"),
    401: unauthenticated,
    403: error("Apenas o mentor"),
    404: notFound,
    409: statusConflict,
    500: serverError,
  },
})

registry.registerPath({
  method: "post",
  path: "/api/appointments/complete",
  tags: ["appointments"],
  summary: "Mentorado avalia e conclui a sessão",
  description:
    "Só o mentorado avalia, uma vez, em sessão `confirmed` ou `completed`. Conclui a sessão e grava nota e comentários (o comentário público vai para moderação).",
  request: { body: { content: json(completeAppointmentSchema) } },
  responses: {
    200: { description: "Avaliada", content: json(appointmentSuccessSchema) },
    400: error("Dados inválidos, ou a sessão não está `confirmed`/`completed`"),
    401: unauthenticated,
    403: error("Apenas o mentorado"),
    404: notFound,
    409: error("Já avaliada, ou o status mudou no meio (`code`: `status_changed`)"),
    500: error("Erro ao gravar a avaliação ou concluir"),
  },
})

registry.registerPath({
  method: "post",
  path: "/api/appointments/no-show",
  tags: ["appointments"],
  summary: "Mentor registra a ausência do mentorado",
  description:
    "Só depois do horário da sessão, em sessão `confirmed` ou `completed`. Cancela por ausência, apaga as avaliações da sessão e avisa o mentorado por e-mail (best effort).",
  request: { body: { content: json(noShowAppointmentSchema) } },
  responses: {
    200: { description: "Registrada", content: json(appointmentSuccessSchema) },
    400: error("Dados inválidos, sessão ainda no futuro ou em outro status"),
    401: unauthenticated,
    403: error("Apenas o mentor"),
    404: notFound,
    409: statusConflict,
    500: serverError,
  },
})

registry.registerPath({
  method: "get",
  path: "/api/appointments/feedback",
  tags: ["appointments"],
  summary: "Avaliações recebidas ou enviadas pelo usuário",
  description: "`type=sent` (como mentorado) ou `received` (padrão, como mentor). Nunca traz as notas privadas.",
  request: { query: listFeedbacksQuerySchema },
  responses: {
    200: { description: "Avaliações", content: json(listFeedbacksResponseSchema) },
    401: unauthenticated,
    500: serverError,
  },
})

registry.registerPath({
  method: "patch",
  path: "/api/appointments/feedback",
  tags: ["appointments"],
  summary: "Autor edita o próprio comentário público",
  description: "O comentário volta para moderação (`pending`).",
  request: { body: { content: json(updateFeedbackSchema) } },
  responses: {
    200: { description: "Atualizado", content: json(appointmentSuccessSchema) },
    400: error("Comentário vazio ou longo demais"),
    401: unauthenticated,
    403: error("Só o autor edita"),
    404: error("Avaliação não encontrada"),
    500: serverError,
  },
})
