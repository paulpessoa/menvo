import { z } from "zod"

export const aiMatchQuerySchema = z.object({
  query: z
    .string({ required_error: "O termo de busca é obrigatório" })
    .trim()
    .min(5, "Sua dúvida está muito curta. Descreva com pelo menos 5 caracteres o que você procura.")
    .max(500, "Sua busca não pode exceder 500 caracteres"),
  debug: z.boolean().optional().default(false)
})

export type AIMatchQueryInput = z.infer<typeof aiMatchQuerySchema>
