import { z } from "zod"

/**
 * Camada 4 · Zod (chat, leitura da caixa de entrada)
 * Regra: contrato das rotas `GET /api/chat/conversations` e
 * `GET /api/chat/unread-count`. O tipo da UI é `z.infer`, nunca uma interface
 * paralela. As rotas de envio (`send`, `mark-read`, `messages`) ficam como estão
 * e não entram aqui nesta onda.
 */
export const chatConversationItemSchema = z.object({
  id: z.string(),
  mentor_id: z.string(),
  mentee_id: z.string(),
  last_message_at: z.string().nullable(),
  created_at: z.string(),
  unread_count: z.number().int().nonnegative(),
  other_user: z.object({
    id: z.string(),
    full_name: z.string(),
    avatar_url: z.string().nullable(),
    role_name: z.string(),
  }),
})
export type ChatConversationItem = z.infer<typeof chatConversationItemSchema>

export const chatConversationsResponseSchema = z.object({
  conversations: z.array(chatConversationItemSchema),
})

export const chatUnreadCountResponseSchema = z.object({
  count: z.number().int().nonnegative(),
})
