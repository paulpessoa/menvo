import { z } from "zod"

export const availabilitySlotSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  day_of_week: z.coerce.number().int().min(0, "Dia da semana deve ser entre 0 e 6").max(6, "Dia da semana deve ser entre 0 e 6"),
  start_time: z.string().min(4, "Horário de início obrigatório"),
  end_time: z.string().min(4, "Horário de término obrigatório"),
  timezone: z.string().nullable().optional().default("America/Sao_Paulo"),
  is_active: z.boolean().optional().default(true)
})

export const setAvailabilitySchema = z.object({
  slots: z.array(availabilitySlotSchema),
  timezone: z.string().optional()
})

export type AvailabilitySlotInput = z.infer<typeof availabilitySlotSchema>
export type SetAvailabilityInput = z.infer<typeof setAvailabilitySchema>
