/**
 * Camada 4 · Zod (rotas /api/me)
 * Regra: entrada das rotas do próprio usuário que não pertencem a outro
 * domínio. O id do usuário NUNCA entra aqui: vem sempre da sessão.
 */
import { z } from "zod"

/** POST /api/me/favorites: favoritar ou desfavoritar um mentor. */
export const toggleFavoriteSchema = z.object({
  mentorId: z.string().uuid(),
  action: z.enum(["add", "remove"]),
})
export type ToggleFavoriteInput = z.infer<typeof toggleFavoriteSchema>
