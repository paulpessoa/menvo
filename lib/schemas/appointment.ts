import { z } from "zod"
import { APPOINTMENT_STATUSES } from "@/lib/domain/appointments/appointment-status.entity"

/**
 * Status de um agendamento. A lista mora na entity (camada 3) e este enum só a
 * reusa, então o contrato da API e o CHECK do banco não divergem em silêncio.
 */
export const appointmentStatusSchema = z.enum(APPOINTMENT_STATUSES)

/**
 * UUID de agendamento vindo de URL ou corpo. Ainda NÃO aplicado às rotas: hoje
 * um id inválido vira 404 (o erro do PostgREST é tratado como "não achei") e
 * passar a dar 400 é mudança de comportamento, decidida no grupo da rota.
 */
export const appointmentIdSchema = z.string().uuid("ID do agendamento inválido")

/**
 * Query de `GET /api/appointments/list`. `limit` ganha teto (hoje `parseInt` sem
 * validar: `?limit=abc` vira `NaN` e `?limit=100000` lê tudo).
 */
export const listAppointmentsQuerySchema = z.object({
  role: z.enum(["mentor", "mentee"]).optional(),
  status: appointmentStatusSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(10)
})

export type ListAppointmentsQuery = z.infer<typeof listAppointmentsQuerySchema>

/** Query de `GET /api/appointments/availability` (datas `YYYY-MM-DD`, ambas opcionais). */
export const availabilityQuerySchema = z.object({
  mentor_id: z.string().min(1, "mentor_id is required"),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "start_date deve ser YYYY-MM-DD").optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "end_date deve ser YYYY-MM-DD").optional()
})

export type AvailabilityQuery = z.infer<typeof availabilityQuerySchema>

/** Corpo de `POST /api/appointments/mark-completed` (o mentor conclui a sessão). */
export const markCompletedAppointmentSchema = z.object({
  appointmentId: z.union([z.string(), z.number()]).transform(val => String(val))
})

export type MarkCompletedAppointmentInput = z.infer<typeof markCompletedAppointmentSchema>

/**
 * Motivo do pedido de mentoria: é o que o mentor lê no e-mail de confirmação e
 * no convite do calendário, então sem ele o mentor recebe um pedido sem contexto.
 */
export const MENTORSHIP_REASON_MIN_LENGTH = 20
export const MENTORSHIP_REASON_MAX_LENGTH = 1000

export const MENTORSHIP_REASON_REQUIRED_MESSAGE = `Informe o motivo da mentoria (mínimo de ${MENTORSHIP_REASON_MIN_LENGTH} caracteres)`

export const mentorshipReasonSchema = z
  .string({ required_error: MENTORSHIP_REASON_REQUIRED_MESSAGE })
  .trim()
  .min(MENTORSHIP_REASON_MIN_LENGTH, MENTORSHIP_REASON_REQUIRED_MESSAGE)
  .max(MENTORSHIP_REASON_MAX_LENGTH, `O motivo não pode exceder ${MENTORSHIP_REASON_MAX_LENGTH} caracteres`)

export const createAppointmentSchema = z.object({
  mentor_id: z.string().uuid("ID do mentor inválido"),
  scheduled_at: z.string().datetime({ message: "Data/hora de agendamento em formato ISO inválido" }),
  duration_minutes: z.coerce.number().int().min(15).max(180).default(60),
  mentorship_topics: z.array(z.string()).default([]),
  notes_mentee: mentorshipReasonSchema
})

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>

export const cancelAppointmentSchema = z.object({
  appointmentId: z.union([z.string(), z.number()]).transform(val => String(val)),
  reason: z.string().min(3, "Motivo do cancelamento deve ter pelo menos 3 caracteres").max(1000, "Motivo não pode exceder 1000 caracteres")
})

export type CancelAppointmentInput = z.infer<typeof cancelAppointmentSchema>

export const confirmAppointmentSchema = z.object({
  appointmentId: z.union([z.string(), z.number()]).optional().transform(val => val !== undefined ? String(val) : undefined),
  token: z.string().optional(),
  mentorNotes: z.string().max(1000).optional()
}).refine(data => Boolean(data.appointmentId || data.token), {
  message: "Informe o ID do agendamento ou o token de confirmação"
})

export type ConfirmAppointmentInput = z.infer<typeof confirmAppointmentSchema>

export const scheduleAppointmentSchema = z.object({
  mentorId: z.string().min(1, "ID do mentor é obrigatório"),
  date: z.string().min(1, "Data é obrigatória"),
  slot: z.string().min(1, "Horário é obrigatório"),
  topic: z.string().optional().default(""),
  notes: z.string().max(1000).optional().default(""),
  timezone: z.string().optional().default("America/Sao_Paulo")
})

export type ScheduleAppointmentInput = z.infer<typeof scheduleAppointmentSchema>

export const completeAppointmentSchema = z.object({
  appointmentId: z.union([z.string(), z.number()]).transform(val => String(val)),
  rating: z.coerce.number().int().min(1, "Selecione uma avaliação de 1 a 5").max(5),
  privateNotes: z.string().max(2000, "Notas não podem exceder 2000 caracteres").optional().nullable(),
  publicFeedback: z.string().max(2000, "Feedback não pode exceder 2000 caracteres").optional().nullable()
})

export type CompleteAppointmentInput = z.infer<typeof completeAppointmentSchema>

export const updateFeedbackSchema = z.object({
  feedbackId: z.union([z.string(), z.number()]).transform(val => String(val)),
  publicFeedback: z.string().min(1, "O comentário não pode ficar vazio").max(2000, "Feedback não pode exceder 2000 caracteres")
})

export type UpdateFeedbackInput = z.infer<typeof updateFeedbackSchema>

export const noShowAppointmentSchema = z.object({
  appointmentId: z.union([z.string(), z.number()]).transform(val => String(val)),
  notes: z.string().max(1000, "Comentário não pode exceder 1000 caracteres").optional().nullable()
})

export type NoShowAppointmentInput = z.infer<typeof noShowAppointmentSchema>

// ---------------------------------------------------------------------------
// Admin: gestão de sessões (/dashboard/admin/appointments)
// ---------------------------------------------------------------------------

export const ADMIN_CANCEL_REASON_MIN_LENGTH = 10

/** Motivo do cancelamento feito pela equipe: vai por e-mail para mentor e mentorado. */
export const adminCancelAppointmentSchema = z.object({
  reason: z
    .string({ required_error: "Informe o motivo do cancelamento" })
    .trim()
    .min(
      ADMIN_CANCEL_REASON_MIN_LENGTH,
      `Informe o motivo do cancelamento (mínimo de ${ADMIN_CANCEL_REASON_MIN_LENGTH} caracteres)`
    )
    .max(1000, "Motivo não pode exceder 1000 caracteres")
})

export type AdminCancelAppointmentInput = z.infer<typeof adminCancelAppointmentSchema>

export const ADMIN_RESEND_TARGETS = ["mentor_request", "confirmation"] as const

export const adminResendAppointmentSchema = z.object({
  target: z.enum(ADMIN_RESEND_TARGETS, {
    errorMap: () => ({ message: "Tipo de reenvio inválido" })
  })
})

export type AdminResendTarget = (typeof ADMIN_RESEND_TARGETS)[number]
