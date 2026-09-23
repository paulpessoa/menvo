import { z } from "zod"

export const createAppointmentSchema = z.object({
  mentor_id: z.string().uuid("ID do mentor inválido"),
  scheduled_at: z.string().datetime({ message: "Data/hora de agendamento em formato ISO inválido" }),
  duration_minutes: z.coerce.number().int().min(15).max(180).default(60),
  mentorship_topics: z.array(z.string()).default([]),
  notes_mentee: z.string().max(1000, "Notas não podem exceder 1000 caracteres").optional().default("")
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
