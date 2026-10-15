/**
 * Camada 9 · Contrato OpenAPI (legal)
 * Regra: descreve o aceite dos Termos de Uso com os mesmos schemas que o
 * cliente usa para ler a resposta (lib/schemas/legal.ts). Os status
 * documentados são os que o código devolve hoje.
 * Não faz: registrar rotas de outro domínio.
 */
import { z } from "zod"
import { registry } from "../registry"
import { apiErrorSchema } from "@/lib/schemas/api"
import { termsAcceptResponseSchema, termsStatusResponseSchema } from "@/lib/schemas/legal"

const json = <T extends z.ZodTypeAny>(schema: T) => ({ "application/json": { schema } })
const error = (description: string) => ({ description, content: json(apiErrorSchema) })

registry.registerPath({
  method: "get",
  path: "/api/legal/accept-terms",
  tags: ["legal"],
  summary: "Se o usuário logado aceitou a versão corrente dos Termos de Uso",
  description:
    "Lê `terms_acceptances` com o cliente do próprio usuário (RLS). Erro de consulta devolve 500 em vez de `accepted: false`, para uma queda não ser confundida com \"não aceitou\".",
  responses: {
    200: { description: "Estado do aceite", content: json(termsStatusResponseSchema) },
    401: error("Não autenticado"),
    500: error("Falha ao verificar o aceite"),
  },
})

registry.registerPath({
  method: "post",
  path: "/api/legal/accept-terms",
  tags: ["legal"],
  summary: "Registra o aceite da versão corrente dos Termos de Uso",
  description:
    "Só insere, nunca atualiza: `accepted_at` vem do banco e o usuário vem da sessão. Aceite repetido da mesma versão conta como sucesso e mantém a data original.",
  responses: {
    200: { description: "Aceite registrado (ou já existente)", content: json(termsAcceptResponseSchema) },
    401: error("Não autenticado"),
    500: error("Falha ao registrar o aceite"),
  },
})
