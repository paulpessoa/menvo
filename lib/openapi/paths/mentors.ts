/**
 * Camada 9 · Contrato OpenAPI (mentors)
 * Regra: descreve as rotas de mentors com os mesmos schemas que elas usam
 * para validar (lib/schemas/availability.ts, lib/schemas/mentors.ts). Os
 * status documentados são os que o código devolve hoje.
 * Não faz: registrar rotas de outro domínio. A busca do catálogo usa server
 * actions (app/actions/mentors.ts), que não são rotas HTTP públicas.
 */
import { z } from "zod"
import { registry } from "../registry"
import { apiErrorSchema } from "@/lib/schemas/api"
import {
  availabilityListResponseSchema,
  availabilityQuerySchema,
  availabilitySaveResponseSchema,
  setAvailabilitySchema,
} from "@/lib/schemas/availability"
import { mentorApproachResponseSchema, mentorSlugParamSchema } from "@/lib/schemas/mentors"

const json = <T extends z.ZodTypeAny>(schema: T) => ({ "application/json": { schema } })
const error = (description: string) => ({ description, content: json(apiErrorSchema) })

registry.registerPath({
  method: "get",
  path: "/api/mentors/availability",
  tags: ["mentors"],
  summary: "Agenda semanal de um mentor",
  description:
    "Sem `mentor_id`, devolve a agenda de quem está logado. Com `mentor_id`, o RLS só libera mentor aprovado e público (ou o próprio dono); para os outros, a lista volta vazia.",
  request: { query: availabilityQuerySchema },
  responses: {
    200: { description: "Horários, ordenados por dia e hora de início", content: json(availabilityListResponseSchema) },
    400: error("`mentor_id` não é um UUID"),
    401: error("Sem `mentor_id` e sem sessão"),
    500: error("Falha ao buscar"),
  },
})

registry.registerPath({
  method: "post",
  path: "/api/mentors/availability",
  tags: ["mentors"],
  summary: "Substitui a agenda semanal de quem está logado",
  description:
    "Troca todos os horários numa transação (RPC `set_mentor_availability`): se um slot for inválido, a agenda anterior fica intacta. Lista vazia limpa a agenda. `timezone` também atualiza o fuso do perfil.",
  request: { body: { content: json(setAvailabilitySchema) } },
  responses: {
    200: { description: "Horários gravados", content: json(availabilitySaveResponseSchema) },
    400: error("Body inválido (`details` do Zod) ou slot que termina antes de começar (`code`: `INVALID_RANGE`)"),
    401: error("Não autenticado"),
    500: error("Falha ao salvar"),
  },
})

registry.registerPath({
  method: "get",
  path: "/api/mentors/{slug}/approach",
  tags: ["mentors"],
  summary: "Textos de abordagem do mentor (só para logados)",
  description:
    "\"Abordagem de mentoria\" e \"O que esperar\". Ficam fora do perfil público para não aparecerem para anônimos nem crawlers. Aceita slug ou UUID.",
  request: { params: mentorSlugParamSchema },
  responses: {
    200: { description: "Textos (podem ser nulos)", content: json(mentorApproachResponseSchema) },
    401: error("Não autenticado"),
    404: error("Mentor não encontrado ou não listado no diretório"),
  },
})
