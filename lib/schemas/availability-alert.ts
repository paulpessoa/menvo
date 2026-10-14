import { z } from "zod"

export const createAvailabilityAlertSchema = z.object({
  mentor_id: z.string().uuid({ message: "mentor_id deve ser um UUID válido" }),
  email: z.string().email({ message: "E-mail inválido" }).max(254).optional(),
})

export type CreateAvailabilityAlertInput = z.infer<typeof createAvailabilityAlertSchema>

export const queryAvailabilityAlertSchema = z.object({
  mentor_id: z.string().uuid({ message: "mentor_id deve ser um UUID válido" }),
})

export type QueryAvailabilityAlertInput = z.infer<typeof queryAvailabilityAlertSchema>
