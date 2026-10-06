/**
 * Camada 4 · Contrato da API de disponibilidade (mentors)
 * Regra: entrada e saída de /api/mentors/availability. Os tipos de DTO saem
 * daqui (`z.infer`) e o OpenAPI é gerado destes mesmos schemas.
 * Não faz: regra de negócio. "Termina depois de começar" é regra do domínio
 * (`isValidRange`, camada 3), aplicada pelo service.
 */
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

/** `?mentor_id=` é opcional: sem ele, a rota devolve a agenda de quem está logado. */
export const availabilityQuerySchema = z.object({
  mentor_id: z.string().uuid().optional()
})

export const storedAvailabilitySlotSchema = z.object({
  id: z.string(),
  mentor_id: z.string(),
  day_of_week: z.number().int(),
  start_time: z.string(),
  end_time: z.string(),
  timezone: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string()
})

export const availabilityListResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(storedAvailabilitySlotSchema)
})

export const availabilitySaveResponseSchema = availabilityListResponseSchema.extend({
  message: z.string()
})

export type AvailabilitySlotInput = z.infer<typeof availabilitySlotSchema>
export type SetAvailabilityInput = z.infer<typeof setAvailabilitySchema>
