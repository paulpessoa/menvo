/**
 * Camada 9 · Contrato OpenAPI (denuncias)
 * Regra: descreve criar denuncia e enviar evidencia com os schemas de
 * lib/schemas/reports.ts. Denuncias nao sao expostas a agentes (MCP).
 */
import { z } from "zod"
import { registry } from "../registry"
import { apiErrorSchema } from "@/lib/schemas/api"
import { evidenceUploadResponseSchema, reportCreateResponseSchema, reportCreateSchema } from "@/lib/schemas/reports"

const json = <T extends z.ZodTypeAny>(schema: T) => ({ "application/json": { schema } })
const error = (description: string) => ({ description, content: json(apiErrorSchema) })

registry.registerPath({
  method: "post",
  path: "/api/reports",
  tags: ["reports"],
  summary: "Registra uma denúncia do usuário logado",
  description:
    "Insere com o cliente da sessão (RLS). Cada `evidence_paths[i]` precisa estar na pasta do próprio usuário, senão 400.",
  request: { body: { content: json(reportCreateSchema), required: true } },
  responses: {
    200: { description: "Denúncia registrada", content: json(reportCreateResponseSchema) },
    400: error("Corpo inválido ou anexo de outra pessoa"),
    401: error("Não autenticado"),
    500: error("Falha ao registrar"),
  },
})

registry.registerPath({
  method: "post",
  path: "/api/reports/evidence",
  tags: ["reports"],
  summary: "Envia um anexo de evidência (imagem ou PDF, até 5 MB)",
  description: "Multipart, campo `file`. O caminho é gerado no servidor sob a pasta do usuário.",
  request: {
    body: {
      required: true,
      content: { "multipart/form-data": { schema: z.object({ file: z.string().openapi({ format: "binary" }) }) } },
    },
  },
  responses: {
    200: { description: "Caminho do anexo", content: json(evidenceUploadResponseSchema) },
    400: error("Arquivo ausente, tipo não permitido, vazio ou grande demais"),
    401: error("Não autenticado"),
    500: error("Falha no upload"),
  },
})
