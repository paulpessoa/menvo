import { z } from "zod"

/**
 * Camada 4 · formato de erro comum das rotas. `code` só existe onde a rota o
 * devolve (limites do quiz, por exemplo); `details` é o `flatten()` do Zod.
 */
export const apiErrorSchema = z.object({
  error: z.string(),
  code: z.string().optional(),
  details: z.unknown().optional(),
})
export type ApiError = z.infer<typeof apiErrorSchema>
