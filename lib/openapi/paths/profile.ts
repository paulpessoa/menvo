/**
 * Camada 9 · Contrato OpenAPI (profile)
 * Regra: descreve as rotas de `/api/profile/**` com os mesmos schemas que elas
 * usam para validar (lib/schemas/profile.ts). Os status são os que o código
 * devolve hoje, inclusive `details` com a mensagem crua do banco em
 * `/api/profile` (decisão D4 pendente do Paul).
 * Não faz: registrar rotas de outro domínio. Todas exigem sessão (cookie); o
 * `Authorization: Bearer` deixou de ser aceito (decisão D1) e `/api/profile/update`
 * foi removida.
 */
import { z } from "zod"
import { registry } from "../registry"
import { apiErrorSchema } from "@/lib/schemas/api"
import {
  deleteAccountResponseSchema,
  getProfileResponseSchema,
  onboardingFlagSchema,
  onboardingFlagsResponseSchema,
  profileErrorSchema,
  requestMentorResponseSchema,
  requestMentorSchema,
  roleResponseSchema,
  stopMentorResponseSchema,
  updateProfileResponseSchema,
  updateProfileSchema,
  updateUserRoleSchema,
} from "@/lib/schemas/profile"

const json = <T extends z.ZodTypeAny>(schema: T) => ({ "application/json": { schema } })
const error = (description: string) => ({ description, content: json(apiErrorSchema) })
const profileError = (description: string) => ({ description, content: json(profileErrorSchema) })

registry.registerPath({
  method: "get",
  path: "/api/profile",
  tags: ["profile"],
  summary: "Perfil de quem está logado",
  description:
    "Achata `profiles`, `mentor_profiles` e `mentee_profiles`. `cv_url` volta como link da Menvo (`/api/cv/...`). Se a conta ainda não tem linha em `profiles`, ela é criada com o nome do provedor de login.",
  responses: {
    200: { description: "Perfil", content: json(getProfileResponseSchema) },
    401: profileError("Sem sessão"),
    500: profileError("Erro ao buscar ou criar o perfil (`details` traz a mensagem do banco)"),
  },
})

registry.registerPath({
  method: "put",
  path: "/api/profile",
  tags: ["profile"],
  summary: "Salva o perfil de quem está logado",
  description:
    "Grava `profiles` primeiro e depois `mentor_profiles` e `mentee_profiles`, e devolve o perfil já atualizado. Campos ausentes não são alterados. Não é atômico entre as três tabelas.",
  request: { body: { content: json(updateProfileSchema) } },
  responses: {
    200: { description: "Perfil atualizado", content: json(updateProfileResponseSchema) },
    400: profileError("Dados inválidos (mensagem do primeiro erro do Zod)"),
    401: profileError("Sem sessão"),
    409: profileError("Slug já em uso"),
    500: profileError("Erro ao atualizar (`details` traz a mensagem do banco)"),
  },
})

registry.registerPath({
  method: "post",
  path: "/api/profile/onboarding",
  tags: ["profile"],
  summary: "Marca um tour guiado como concluído",
  description: "Soma a flag às que já existem em `profiles.onboarding_flags`.",
  request: { body: { content: json(onboardingFlagSchema) } },
  responses: {
    200: { description: "Todas as flags depois da gravação", content: json(onboardingFlagsResponseSchema) },
    400: error("Falta `flag` ou `value`, ou o formato é inválido"),
    401: error("Não autenticado"),
    500: error("Falha ao gravar"),
  },
})

registry.registerPath({
  method: "delete",
  path: "/api/profile/onboarding",
  tags: ["profile"],
  summary: "Reinicia todos os tours guiados",
  responses: {
    200: { description: "Flags zeradas", content: json(onboardingFlagsResponseSchema) },
    401: error("Não autenticado"),
    500: error("Falha ao gravar"),
  },
})

registry.registerPath({
  method: "post",
  path: "/api/profile/role",
  tags: ["profile"],
  summary: "Escolhe o papel (mentor ou mentorado) no onboarding",
  description:
    "Quem escolhe `mentor` entra na fila de verificação e continua como mentorado até o admin aprovar. `mentor` e `mentee` são exclusivos: o papel oposto é removido. Campos de `profileData` com tipo errado ou `null` são ignorados.",
  request: { body: { content: json(updateUserRoleSchema) } },
  responses: {
    200: { description: "Papel gravado", content: json(roleResponseSchema) },
    400: error("Role inválida ou `profileData` que não é objeto"),
    401: error("Não autorizado"),
    500: error("Falha ao salvar"),
  },
})

registry.registerPath({
  method: "post",
  path: "/api/profile/request-mentor",
  tags: ["profile"],
  summary: "Pede para ser mentor",
  description:
    "Entra na fila de verificação (RPC `request_mentor_verification`), salva a abordagem em `mentor_profiles` e avisa o admin por e-mail. Quem já está aprovado continua aprovado.",
  request: { body: { content: json(requestMentorSchema) } },
  responses: {
    200: { description: "Solicitação registrada", content: json(requestMentorResponseSchema) },
    400: error("`mentorship_approach` ausente (`code`: `VALIDATION_ERROR`)"),
    401: error("Não autenticado"),
    500: error("Falha ao registrar"),
  },
})

registry.registerPath({
  method: "post",
  path: "/api/profile/stop-mentor",
  tags: ["profile"],
  summary: "Deixa de ser mentor",
  description:
    "Remove o papel de mentor, garante o de mentorado, retira a verificação (RPC `withdraw_mentor_verification`) e esconde o perfil do catálogo. Os textos de mentor ficam, caso volte.",
  responses: {
    200: { description: "Não é mais mentor", content: json(stopMentorResponseSchema) },
    401: error("Não autenticado"),
    500: error("Falha ao atualizar"),
  },
})

registry.registerPath({
  method: "delete",
  path: "/api/profile/delete",
  tags: ["profile"],
  summary: "Apaga a própria conta",
  description:
    "Definitivo: apaga a conta, os arquivos (CV, avatar) e registra a exclusão para LGPD. Só apaga a conta da sessão.",
  responses: {
    200: { description: "Conta apagada", content: json(deleteAccountResponseSchema) },
    401: error("Não autenticado"),
    500: error("Falha ao apagar"),
  },
})
