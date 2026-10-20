/**
 * Camada 4 · Zod (rotas /api/me)
 * Regra: entrada das rotas do próprio usuário que não pertencem a outro
 * domínio. O id do usuário NUNCA entra aqui: vem sempre da sessão.
 */
import { z } from "zod"
import type { NotificationType } from "@/lib/domain/profile/notification.entity"

/** POST /api/me/favorites: favoritar ou desfavoritar um mentor. */
export const toggleFavoriteSchema = z.object({
  mentorId: z.string().uuid(),
  action: z.enum(["add", "remove"]),
})
export type ToggleFavoriteInput = z.infer<typeof toggleFavoriteSchema>

// ---------------------------------------------------------------------------
// Saída (contrato OpenAPI). Só documentação e teste, não validam a resposta.
// ---------------------------------------------------------------------------

export const favoritesResponseSchema = z.object({ favorites: z.array(z.string().uuid()) })
export const toggleFavoriteResponseSchema = z.object({ ok: z.literal(true) })

/** Tipos de notificação derivados dos agendamentos; ver lib/domain/profile/notification.entity.ts. */
export const notificationTypes = [
  "booking_request",
  "booking_confirmed",
  "booking_cancelled",
  "pending_evaluation",
  "session_starting_soon",
] as const satisfies readonly NotificationType[]

export const notificationSchema = z.object({
  id: z.string(),
  type: z.enum(notificationTypes),
  title: z.string(),
  message: z.string(),
  timestamp: z.string(),
  actionUrl: z.string(),
})

/** `role` é só uma dica: valor diferente de mentor/mentee (ex.: admin) devolve lista vazia. */
export const notificationsQuerySchema = z.object({ role: z.string().optional() })
export const notificationsResponseSchema = z.object({ notifications: z.array(notificationSchema) })
