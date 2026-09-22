import { z } from "zod"

export const mentorSuggestionSchema = z.object({
  topic: z.string().min(3, "O tema deve ter pelo menos 3 caracteres.").max(100, "O tema não pode ter mais de 100 caracteres."),
  description: z.string().max(500, "A descrição não pode passar de 500 caracteres.").optional().nullable(),
  email: z.string().email("E-mail inválido").optional().nullable().or(z.literal("")),
})

export type MentorSuggestionInput = z.infer<typeof mentorSuggestionSchema>
