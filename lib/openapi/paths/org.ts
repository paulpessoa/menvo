/**
 * Camada 9 · Contrato OpenAPI (org)
 * Regra: descreve as rotas de organização do dia a dia: as 3 de `/api/org`
 * (admin da org) e as 3 de `/api/me/organizations` (a pessoa e o próprio
 * vínculo), com os schemas de `lib/schemas/organizations.ts`. Os status são os
 * que o código devolve hoje; sucesso vem sempre como `{ data, message? }`.
 * Não faz: documentar `/api/admin/organizations` nem `/api/contact/organization`
 * (outras linhas) e não valida request (isso é a rota).
 * Tradeoff: o schema de saída aqui não é aplicado na rota (ela monta o objeto
 * à mão); ele é o contrato que o cliente tipado (camada 10) usa para recusar
 * resposta fora do formato.
 */
import { z } from "zod"
import { registry } from "../registry"
import { apiErrorSchema } from "@/lib/schemas/api"
import {
  inviteMemberSchema,
  joinOrganizationSchema,
  leaveOrganizationQuerySchema,
  leftOrganizationSchema,
  membershipResultSchema,
  memberUserIdSchema,
  myMembershipSchema,
  myOrgOptionSchema,
  orgDashboardSchema,
  orgEnvelope,
  orgPathParamsSchema,
  orgPeriodQuerySchema,
  orgRowSchema,
  removedMemberSchema,
  updateOrgSettingsSchema,
} from "@/lib/schemas/organizations"

const json = <T extends z.ZodTypeAny>(schema: T) => ({ "application/json": { schema } })
const error = (description: string) => ({ description, content: json(apiErrorSchema) })

const unauthenticated = error("Não autenticado")
const forbidden = error("Sem acesso: a pessoa não é admin ativa desta organização nem admin da plataforma")
const invalidId = error("`id` não é um UUID")
const failed = error("Falha inesperada")

registry.registerPath({
  method: "get",
  path: "/api/org/mine",
  tags: ["org"],
  summary: "Organizações que a pessoa administra",
  description: "Só vínculos com `role = admin` e `status = active`. Alimenta o seletor de /dashboard/org.",
  responses: {
    200: { description: "Lista (pode ser vazia)", content: json(orgEnvelope(z.array(myOrgOptionSchema))) },
    401: unauthenticated,
    500: failed,
  },
})

registry.registerPath({
  method: "get",
  path: "/api/org/{id}",
  tags: ["org"],
  summary: "Dashboard da organização",
  description:
    "Org, membros com o papel de plataforma derivado (mentor ou mentorado, nunca um campo do vínculo), resumo e relatório de impacto. `period` desconhecido vale `all`.",
  request: { params: orgPathParamsSchema, query: orgPeriodQuerySchema },
  responses: {
    200: { description: "Dashboard", content: json(orgEnvelope(orgDashboardSchema)) },
    400: invalidId,
    401: unauthenticated,
    403: forbidden,
    404: error("Organização não encontrada"),
    500: failed,
  },
})

registry.registerPath({
  method: "patch",
  path: "/api/org/{id}",
  tags: ["org"],
  summary: "Muda a política de entrada da organização",
  description: "`open`: qualquer pessoa logada pode pedir para entrar. `invite_only`: só quem for convidada.",
  request: { params: orgPathParamsSchema, body: { content: json(updateOrgSettingsSchema) } },
  responses: {
    200: { description: "Organização atualizada", content: json(orgEnvelope(orgRowSchema)) },
    400: error("`join_policy` inválido"),
    401: unauthenticated,
    403: forbidden,
    500: failed,
  },
})

registry.registerPath({
  method: "post",
  path: "/api/org/{id}/members",
  tags: ["org"],
  summary: "Convida uma conta existente por e-mail",
  description:
    "Se a pessoa já tinha pedido para entrar, aprova o pedido. Reenviar convite a quem já foi convidado só reenvia o e-mail. Busca a conta por e-mail com `service_role` (a RLS não deixa o admin ver quem ainda não é membro; ADR 0008, E4). A resposta 404 revela se o e-mail tem conta: risco aceito.",
  request: { params: orgPathParamsSchema, body: { content: json(inviteMemberSchema) } },
  responses: {
    200: { description: "Estado final do vínculo", content: json(orgEnvelope(membershipResultSchema)) },
    400: error("E-mail inválido"),
    401: unauthenticated,
    403: forbidden,
    404: error("Essa pessoa ainda não tem conta na Menvo"),
    500: failed,
  },
})

registry.registerPath({
  method: "patch",
  path: "/api/org/{id}/members",
  tags: ["org"],
  summary: "Aprova um pedido para entrar",
  request: { params: orgPathParamsSchema, body: { content: json(memberUserIdSchema) } },
  responses: {
    200: { description: "Participação aprovada", content: json(orgEnvelope(membershipResultSchema)) },
    400: error("`userId` inválido"),
    401: unauthenticated,
    403: forbidden,
    404: error("Solicitação não encontrada"),
    500: failed,
  },
})

registry.registerPath({
  method: "delete",
  path: "/api/org/{id}/members",
  tags: ["org"],
  summary: "Remove um membro, recusa um pedido ou cancela um convite",
  description: "Quem chama não pode remover a si mesma (usa a aba Organizações do perfil).",
  request: { params: orgPathParamsSchema, query: memberUserIdSchema },
  responses: {
    200: { description: "Removido", content: json(orgEnvelope(removedMemberSchema)) },
    400: error("`userId` ausente ou é o da própria pessoa"),
    401: unauthenticated,
    403: forbidden,
    500: failed,
  },
})

registry.registerPath({
  method: "get",
  path: "/api/me/organizations",
  tags: ["org"],
  summary: "Vínculos da própria pessoa",
  description: "Convites, pedidos e participações ativas, com a organização embutida.",
  responses: {
    200: { description: "Lista (pode ser vazia)", content: json(orgEnvelope(z.array(myMembershipSchema))) },
    401: unauthenticated,
    500: failed,
  },
})

registry.registerPath({
  method: "post",
  path: "/api/me/organizations",
  tags: ["org"],
  summary: "Pede para entrar numa organização ou aceita um convite",
  description:
    "Idempotente: já ativa ou já solicitada devolve o estado atual. Convite vira ativo. Org `invite_only` sem convite dá 403. Ao pedir, avisa os admins por e-mail (lê os e-mails deles com `service_role`, ADR 0008 E3; o e-mail nunca volta na resposta).",
  request: { body: { content: json(joinOrganizationSchema) } },
  responses: {
    200: { description: "Estado final do vínculo", content: json(orgEnvelope(membershipResultSchema)) },
    400: error("Slug inválido"),
    401: unauthenticated,
    403: error("A organização entra apenas por convite"),
    404: error("Organização não encontrada ou suspensa"),
    500: failed,
  },
})

registry.registerPath({
  method: "delete",
  path: "/api/me/organizations",
  tags: ["org"],
  summary: "Sai da organização, recusa convite ou cancela o pedido",
  request: { query: leaveOrganizationQuerySchema },
  responses: {
    200: { description: "Vínculo removido", content: json(orgEnvelope(leftOrganizationSchema)) },
    400: error("`organizationId` ausente"),
    401: unauthenticated,
    500: failed,
  },
})
