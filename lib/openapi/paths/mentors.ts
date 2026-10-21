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
import {
  mentorApproachResponseSchema,
  mentorDetailResponseSchema,
  mentorSlugParamSchema,
  mentorsByIdsQuerySchema,
  mentorsListResponseSchema,
} from "@/lib/schemas/mentors"
import { createAvailabilityAlertSchema, queryAvailabilityAlertSchema } from "@/lib/schemas/availability-alert"

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
  path: "/api/mentors",
  tags: ["mentors"],
  summary: "Perfis públicos de vários mentores por id",
  description:
    "`ids` é uma lista de UUIDs separada por vírgula (1 a 50). Pública: não exige login. Só devolve mentores que o diretório lista (verificados e públicos); ids desconhecidos ou ocultos são omitidos, sem erro.",
  request: { query: mentorsByIdsQuerySchema },
  responses: {
    200: { description: "Mentores encontrados (ordem não garantida)", content: json(mentorsListResponseSchema) },
    400: error("`ids` ausente, vazio, com mais de 50 itens ou com item que não é UUID"),
    500: error("Falha ao buscar"),
  },
})

registry.registerPath({
  method: "get",
  path: "/api/mentors/{slug}",
  tags: ["mentors"],
  summary: "Perfil público de um mentor",
  description: "Aceita slug ou UUID. Pública: não exige login.",
  request: { params: mentorSlugParamSchema },
  responses: {
    200: { description: "Perfil do mentor", content: json(mentorDetailResponseSchema) },
    404: error("Mentor não encontrado ou não listado no diretório"),
    500: error("Falha ao buscar"),
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

registry.registerPath({
  method: "get",
  path: "/api/mentors/availability-alerts",
  tags: ["mentors"],
  summary: "Verifica se o usuário logado possui alerta ativo para o mentor",
  description:
    "Sem sessão autenticada, devolve `hasActiveAlert: false`. Com sessão, verifica se há registro pendente em `mentor_availability_alerts`.",
  request: { query: queryAvailabilityAlertSchema },
  responses: {
    200: {
      description: "Status do alerta de disponibilidade",
      content: json(z.object({ success: z.boolean(), hasActiveAlert: z.boolean() })),
    },
    400: error("`mentor_id` não é um UUID válido"),
  },
})

registry.registerPath({
  method: "post",
  path: "/api/mentors/availability-alerts",
  tags: ["mentors"],
  summary: "Inscreve usuário ou e-mail para receber alerta quando o mentor abrir horários",
  description:
    "Grava interesse do mentorado (C-M3). Se logado, associa ao `auth.uid()`. Se visitante, requer e-mail no body.",
  request: { body: { content: json(createAvailabilityAlertSchema) } },
  responses: {
    200: {
      description: "Aviso registrado com sucesso",
      content: json(z.object({ success: z.boolean(), message: z.string() })),
    },
    400: error("E-mail inválido ou dados incorretos"),
    500: error("Falha ao salvar alerta"),
  },
})

