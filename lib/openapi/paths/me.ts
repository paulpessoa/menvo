/**
 * Camada 9 · Contrato OpenAPI (me)
 * Regra: descreve as rotas do próprio usuário em `/api/me/**` que esta linha
 * possui: favoritos e notificações. O id do usuário nunca é parâmetro: vem da
 * sessão. `/api/me/organizations` é da linha org e será documentado por ela.
 * Não faz: registrar rotas de outro domínio.
 */
import { z } from "zod"
import { registry } from "../registry"
import { apiErrorSchema } from "@/lib/schemas/api"
import {
  favoritesResponseSchema,
  notificationsQuerySchema,
  notificationsResponseSchema,
  toggleFavoriteResponseSchema,
  toggleFavoriteSchema,
} from "@/lib/schemas/me"

const json = <T extends z.ZodTypeAny>(schema: T) => ({ "application/json": { schema } })
const error = (description: string) => ({ description, content: json(apiErrorSchema) })

registry.registerPath({
  method: "get",
  path: "/api/me/favorites",
  tags: ["me"],
  summary: "Ids dos mentores favoritados por quem está logado",
  responses: {
    200: { description: "Ids dos mentores", content: json(favoritesResponseSchema) },
    401: error("Não autenticado"),
    500: error("Não foi possível carregar os favoritos"),
  },
})

registry.registerPath({
  method: "post",
  path: "/api/me/favorites",
  tags: ["me"],
  summary: "Favorita ou desfavorita um mentor",
  description: "Favoritar duas vezes o mesmo mentor falha (500), porque a tabela impede a linha duplicada.",
  request: { body: { content: json(toggleFavoriteSchema) } },
  responses: {
    200: { description: "Feito", content: json(toggleFavoriteResponseSchema) },
    400: error("`mentorId` não é UUID ou `action` inválida"),
    401: error("Não autenticado"),
    500: error("Não foi possível atualizar os favoritos"),
  },
})

registry.registerPath({
  method: "get",
  path: "/api/me/notifications",
  tags: ["me"],
  summary: "Notificações do sino, derivadas dos agendamentos",
  description:
    "Calculadas na hora a partir dos 20 agendamentos mais recentes e das avaliações do usuário; não há tabela de notificações. `role` é só uma dica de quais categorias calcular: `mentor`, `mentee`, ausente (as duas) ou qualquer outro valor (lista vazia). Falha de banco devolve lista vazia com 200.",
  request: { query: notificationsQuerySchema },
  responses: {
    200: { description: "Notificações, a mais recente primeiro", content: json(notificationsResponseSchema) },
    401: error("Não autenticado"),
  },
})
