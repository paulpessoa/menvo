/**
 * Camada 9 · Documento OpenAPI
 * Regra: monta o documento a partir do registro. Importar um arquivo de
 * `paths/` é o que registra o domínio; domínio sem import aqui não aparece.
 * Não faz: servir HTTP (isso é `app/api/openapi/route.ts`).
 */
import { OpenApiGeneratorV31 } from "@asteasolutions/zod-to-openapi"
import { registry } from "./registry"
import "./paths/quiz"
import "./paths/mentors"
import "./paths/legal"
import "./paths/profile"
import "./paths/me"
import "./paths/org"
import "./paths/appointments"
import "./paths/chat"
import "./paths/community"
import "./paths/reports"

export function buildOpenApiDocument() {
  return new OpenApiGeneratorV31(registry.definitions).generateDocument({
    openapi: "3.1.0",
    info: {
      title: "Menvo API",
      version: "1.0.0",
      description:
        "Gerado dos schemas Zod. Domínios fora desta lista ainda não migraram para o padrão (ver `pendingDomains` em document.test.ts).",
    },
    tags: [
      { name: "quiz", description: "Diagnóstico de carreira (quiz) e análise por IA" },
      { name: "mentors", description: "Agenda e perfil público de mentores" },
      { name: "legal", description: "Aceite dos Termos de Uso" },
      { name: "profile", description: "Perfil e conta do próprio usuário (papel, onboarding, mentoria, exclusão)" },
      { name: "me", description: "Favoritos e notificações do próprio usuário" },
      { name: "org", description: "Organizações parceiras: dashboard do admin e vínculo de cada pessoa" },
      { name: "appointments", description: "Pedidos, confirmação, cancelamento, conclusão e avaliação de sessões de mentoria" },
      { name: "chat", description: "Caixa de entrada do chat: conversas e contagem de não lidas" },
      { name: "community", description: "Perfis do mural da comunidade" },
      { name: "reports", description: "Denúncias e anexos de evidência" },
    ],
  })
}
