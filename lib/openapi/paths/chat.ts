/**
 * Camada 9 · Contrato OpenAPI (chat, leitura)
 * Regra: descreve só as duas rotas de leitura novas, com os schemas que elas
 * usam (lib/schemas/chat.ts). `send`, `mark-read` e `messages/[mentorId]` ainda
 * não estão documentadas; por isso `chat` segue em `pendingDomains` do teste de
 * drift até uma onda cobri-las.
 */
import { z } from "zod"
import { registry } from "../registry"
import { apiErrorSchema } from "@/lib/schemas/api"
import { chatConversationsResponseSchema, chatUnreadCountResponseSchema } from "@/lib/schemas/chat"

const json = <T extends z.ZodTypeAny>(schema: T) => ({ "application/json": { schema } })
const error = (description: string) => ({ description, content: json(apiErrorSchema) })

registry.registerPath({
  method: "get",
  path: "/api/chat/conversations",
  tags: ["chat"],
  summary: "Conversas de quem está logado",
  description:
    "Cada conversa traz o outro participante (nome, avatar, papel principal) e o número de mensagens não lidas. O usuário vem da sessão. Número fixo de queries, independente de quantas conversas.",
  responses: {
    200: { description: "Conversas, da mais recente para a mais antiga", content: json(chatConversationsResponseSchema) },
    401: error("Sem sessão"),
    500: error("Falha ao carregar"),
  },
})

registry.registerPath({
  method: "get",
  path: "/api/chat/unread-count",
  tags: ["chat"],
  summary: "Total de mensagens não lidas",
  description: "Soma as mensagens não lidas enviadas por outras pessoas em todas as conversas do usuário da sessão.",
  responses: {
    200: { description: "Total", content: json(chatUnreadCountResponseSchema) },
    401: error("Sem sessão"),
    500: error("Falha ao contar"),
  },
})
