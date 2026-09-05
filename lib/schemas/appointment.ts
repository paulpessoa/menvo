import { z } from "zod"

export const createAppointmentSchema = z.object({
  mentor_id: z.string().uuid("ID do mentor inválido"),
  scheduled_at: z.string().datetime({ message: "Data/hora de agendamento em formato ISO inválido" }),
  duration_minutes: z.coerce.number().int().min(15).max(180).default(60),
  mentorship_topics: z.array(z.string()).default([]),
  notes_mentee: z.string().max(1000, "Notas não podem exceder 1000 caracteres").optional().default("")
})

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>
