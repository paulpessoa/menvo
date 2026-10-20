import { z } from "zod"
import { appointmentStatusSchema, mentorshipReasonSchema } from "./appointment"

/**
 * Camada 4 · saídas (e o corpo "flexível" do schedule) das rotas de appointments.
 * Regra: descrevem o que as rotas devolvem HOJE; a fonte do contrato OpenAPI
 * (`lib/openapi/paths/appointments.ts`). Não mudam nenhuma rota: o formato das
 * respostas é o que o app já consome.
 * Tradeoff: duas rotas (`schedule`, `[id]`) respondem `{ data, message }` e as
 * demais `{ success, ... }`. Os dois formatos estão aqui como são; unificar é uma
 * decisão de formato de resposta (ponto de parada), não deste arquivo.
 */

/** Resposta mínima de uma ação que só confirma que deu certo. */
export const appointmentSuccessSchema = z.object({ success: z.literal(true) })

/** Outra ponta de uma sessão (embed de `profiles`). */
export const appointmentPartySchema = z.object({
  id: z.string(),
  full_name: z.string().nullable(),
  email: z.string().nullable(),
  avatar_url: z.string().nullable(),
  linkedin_url: z.string().nullable(),
})

/** Uma sessão como `GET /api/appointments/list` devolve. Sem `action_token` nem notas. */
export const appointmentListItemSchema = z.object({
  id: z.string().uuid(),
  mentor_id: z.string().uuid(),
  mentee_id: z.string().uuid(),
  scheduled_at: z.string(),
  duration_minutes: z.number().int(),
  google_meet_link: z.string().nullable(),
  status: appointmentStatusSchema,
  created_at: z.string(),
  message: z.string().nullable(),
  topic: z.string().nullable(),
  cancellation_reason: z.string().nullable(),
  cancelled_by: z.string().nullable(),
  mentor: appointmentPartySchema.nullable(),
  mentee: appointmentPartySchema.nullable(),
  feedbacks: z.array(z.object({ id: z.string(), reviewer_id: z.string() })),
})

export const listAppointmentsResponseSchema = z.object({
  appointments: z.array(appointmentListItemSchema),
  count: z.number().int(),
})

export const availabilitySlotSchema = z.object({
  date: z.string(),
  time: z.string(),
  start_time: z.string(),
  end_time: z.string(),
  day_of_week: z.number().int(),
  datetime: z.string(),
})

export const availabilityResponseSchema = z.object({
  success: z.literal(true),
  availableSlots: z.array(availabilitySlotSchema),
  totalSlots: z.number().int(),
})

/** `POST /api/appointments/cancel`. */
export const cancelResponseSchema = z.object({ success: z.literal(true), message: z.string() })

/** `POST /api/appointments/confirm`: confirmou agora, ou já estava confirmado. */
export const confirmResponseSchema = z.union([
  z.object({
    success: z.literal(true),
    googleEventId: z.string().nullable(),
    googleMeetLink: z.string().nullable(),
    /** Por que o evento não foi criado; a sessão fica confirmada mesmo assim. */
    calendarError: z.string().nullable(),
    message: z.string(),
  }),
  z.object({ success: z.literal(true), message: z.string(), alreadyConfirmed: z.literal(true) }),
])

/** Avaliação como `GET /api/appointments/feedback` devolve. Nunca traz `private_notes`. */
export const feedbackItemSchema = z.object({
  id: z.string(),
  rating: z.number().nullable(),
  public_feedback: z.string().nullable(),
  status: z.string().nullable(),
  created_at: z.string(),
  rejection_reason: z.string().nullable(),
  mentee: z.object({ full_name: z.string().nullable(), email: z.string().nullable() }).nullable(),
  mentor: z.object({ full_name: z.string().nullable(), email: z.string().nullable() }).nullable(),
})

export const listFeedbacksQuerySchema = z.object({ type: z.enum(["sent", "received"]).optional() })

export const listFeedbacksResponseSchema = z.object({ feedbacks: z.array(feedbackItemSchema) })

/** Formato `{ data, message }` de `schedule`. */
export const appointmentDataResponseSchema = z.object({ data: z.unknown(), message: z.string().optional() })

/**
 * Corpo aceito por `POST /api/appointments/schedule`. A rota ainda lê as chaves
 * à mão, em snake_case e camelCase (o modal envia camelCase); este schema as
 * descreve para o contrato e é o que o service vai validar no grupo de `schedule`.
 * Obrigatório de fato: mentor, o horário (`scheduled_at`, ou data + hora) e o motivo.
 */
export const scheduleRequestSchema = z.object({
  mentor_id: z.string().optional(),
  mentorId: z.string().optional(),
  scheduled_at: z.string().optional(),
  scheduledAt: z.string().optional(),
  requested_date: z.string().optional(),
  requestedDate: z.string().optional(),
  requested_start_time: z.string().optional(),
  requestedStartTime: z.string().optional(),
  duration_minutes: z.number().optional(),
  durationMinutes: z.number().optional(),
  duration: z.number().optional(),
  mentorship_topics: z.array(z.string()).optional(),
  notes_mentee: mentorshipReasonSchema.optional(),
  message: mentorshipReasonSchema.optional(),
})


/** `POST /api/appointments/create`: o pedido criado (sem `action_token`). */
export const createResponseSchema = z.object({
  success: z.literal(true),
  appointment: z.object({ id: z.string() }).passthrough(),
})
