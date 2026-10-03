/**
 * Camada 9 · Documento OpenAPI
 * Regra: monta o documento a partir do registro. Importar um arquivo de
 * `paths/` é o que registra o domínio; domínio sem import aqui não aparece.
 * Não faz: servir HTTP (isso é `app/api/openapi/route.ts`).
 */
import { OpenApiGeneratorV31 } from "@asteasolutions/zod-to-openapi"
import { registry } from "./registry"
import "./paths/quiz"

export function buildOpenApiDocument() {
  return new OpenApiGeneratorV31(registry.definitions).generateDocument({
    openapi: "3.1.0",
    info: {
      title: "Menvo API",
      version: "1.0.0",
      description:
        "Gerado dos schemas Zod. Domínios fora desta lista ainda não migraram para o padrão (ver `pendingDomains` em document.test.ts).",
    },
    tags: [{ name: "quiz", description: "Diagnóstico de carreira (quiz) e análise por IA" }],
  })
}
