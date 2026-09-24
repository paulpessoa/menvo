import { z } from "zod"

export const feedbackSubmissionSchema = z.object({
  rating: z.coerce.number().min(1, "Avaliação mínima é 1").max(5, "Avaliação máxima é 5"),
  comment: z.string().max(2000, "Comentário não pode exceder 2000 caracteres").optional().nullable(),
  email: z.string().email("Formato de e-mail inválido").optional().nullable(),
  source: z.enum(["assistant", "diagnostic", "session", "platform"]).default("platform"),
  context: z.record(z.unknown()).optional().default({})
})

export type FeedbackSubmissionInput = z.infer<typeof feedbackSubmissionSchema>

