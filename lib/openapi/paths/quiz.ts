/**
 * Camada 9 · Contrato OpenAPI (quiz)
 * Regra: descreve as 7 operações do quiz com os mesmos schemas que as rotas
 * usam (lib/schemas/quiz.ts). Os status documentados são os que o código
 * devolve hoje; se uma rota mudar, o teste de drift (`document.test.ts`) cobre
 * a existência da rota, e o schema compartilhado cobre o formato.
 * Não faz: registrar rotas de outro domínio.
 */
import { z } from "zod"
import { registry } from "../registry"
import { apiErrorSchema } from "@/lib/schemas/api"
import {
  quizAccountBodySchema,
  quizAccountCreatedSchema,
  quizAccountExistsSchema,
  quizAccountLinkQuerySchema,
  quizAccountStatusSchema,
  quizAnalyzeResponseSchema,
  quizIdParamSchema,
  quizLatestResponseSchema,
  quizResultViewSchema,
  quizSendEmailResponseSchema,
  quizSubmitResponseSchema,
  quizSubmitSchema,
} from "@/lib/schemas/quiz"

const json = <T extends z.ZodTypeAny>(schema: T) => ({ "application/json": { schema } })
const error = (description: string) => ({ description, content: json(apiErrorSchema) })

const invalidId = error("`id` não é um UUID")
const tooMany = error("Muitas tentativas (limite por IP, por quiz ou por e-mail)")

registry.registerPath({
  method: "post",
  path: "/api/quiz",
  tags: ["quiz"],
  summary: "Envia um quiz e agenda a análise por IA",
  description:
    "Anônimo por desenho. Se houver sessão, o e-mail da conta vale no lugar do digitado. 429 também cobre o limite de análises por e-mail em 30 dias (`code`: `email_limit` | `ip_limit`).",
  request: { body: { content: json(quizSubmitSchema) } },
  responses: {
    200: { description: "Criado; use o `id` em /quiz/results/{id}", content: json(quizSubmitResponseSchema) },
    400: error("Dados inválidos (`details` traz o `flatten()` do Zod)"),
    429: tooMany,
    500: error("Não foi possível salvar"),
    503: error("Orçamento mensal de IA esgotado (`code`: `budget`)"),
  },
})

registry.registerPath({
  method: "get",
  path: "/api/quiz/latest",
  tags: ["quiz"],
  summary: "Último quiz do usuário logado",
  description: "O e-mail vem da sessão, nunca de parâmetro.",
  responses: {
    200: { description: "Resumo, ou `summary: null` se nunca fez", content: json(quizLatestResponseSchema) },
    401: error("Não autenticado"),
    500: error("Falha ao carregar"),
  },
})

registry.registerPath({
  method: "get",
  path: "/api/quiz/{id}",
  tags: ["quiz"],
  summary: "Resultado público de um quiz",
  description:
    "Sem sessão. Nunca traz nome, e-mail nem respostas: o link é compartilhado em redes. `is_owner` só é verdadeiro para quem fez o quiz.",
  request: { params: quizIdParamSchema },
  responses: {
    200: { description: "Resultado", content: json(quizResultViewSchema) },
    400: invalidId,
    404: error("Resultado não encontrado"),
    500: error("Falha ao carregar"),
  },
})

registry.registerPath({
  method: "post",
  path: "/api/quiz/{id}/analyze",
  tags: ["quiz"],
  summary: "Roda a análise de IA (uma vez por quiz)",
  description:
    "Anônimo. O claim é atômico: chamar de novo não reprocessa nem cobra IA. `claimed: false` significa que já foi processado, está em andamento ou o orçamento do mês acabou.",
  request: { params: quizIdParamSchema },
  responses: {
    200: { description: "Processado ou nada a fazer", content: json(quizAnalyzeResponseSchema) },
    400: invalidId,
    500: error("Falha ao reivindicar a análise"),
    503: error("Análise indisponível (chave de métrica ausente)"),
  },
})

registry.registerPath({
  method: "post",
  path: "/api/quiz/{id}/send-email",
  tags: ["quiz"],
  summary: "Reenvia o e-mail de resultado",
  description:
    "O e-mail só vai para o endereço da própria linha. O `id` é a única credencial (risco aceito, ADR 0007 §3); limite de 3 envios por 10 minutos por quiz.",
  request: { params: quizIdParamSchema },
  responses: {
    200: { description: "Enviado", content: json(quizSendEmailResponseSchema) },
    400: invalidId,
    404: error("Resultado não encontrado"),
    409: error("A análise ainda não está pronta"),
    429: tooMany,
    500: error("Falha ao enviar"),
  },
})

registry.registerPath({
  method: "get",
  path: "/api/quiz/{id}/account",
  tags: ["quiz"],
  summary: "O link do e-mail ainda serve para criar conta?",
  request: { params: quizIdParamSchema, query: quizAccountLinkQuerySchema },
  responses: {
    200: { description: "`claimable` ou `exists`", content: json(quizAccountStatusSchema) },
    403: error("Link inválido ou expirado"),
  },
})

registry.registerPath({
  method: "post",
  path: "/api/quiz/{id}/account",
  tags: ["quiz"],
  summary: "Cria a conta a partir do quiz anônimo",
  description:
    "Só com o token `k` assinado do e-mail. Nada é criado até a pessoa enviar a senha. Usa `service_role` por exceção documentada (ADR 0007).",
  request: { params: quizIdParamSchema, body: { content: json(quizAccountBodySchema) } },
  responses: {
    200: { description: "Conta criada e quiz vinculado", content: json(quizAccountCreatedSchema) },
    400: error("Senha inválida ou recusada pela política de autenticação"),
    403: error("Link inválido ou expirado"),
    409: { description: "O e-mail já tem conta", content: json(quizAccountExistsSchema) },
    429: tooMany,
    500: error("Não foi possível criar a conta"),
  },
})
