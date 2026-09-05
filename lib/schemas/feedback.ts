import { z } from "zod"

export const feedbackSubmissionSchema = z.object({
  rating: z.coerce.number().min(1, "Avaliação mínima é 1").max(5, "Avaliação máxima é 5"),
  comment: z.string().max(2000, "Comentário não pode exceder 2000 caracteres").optional().nullable(),
  email: z.string().email("Formato de e-mail inválido").optional().nullable(),
  page_url: z.string().url("URL inválida").optional().nullable(),
  user_agent: z.string().optional().nullable()
})

export type FeedbackSubmissionInput = z.infer<typeof feedbackSubmissionSchema>
