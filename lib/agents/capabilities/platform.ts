/**
 * Camada 14 · Capabilities (platform)
 * Regra: perguntas sobre o funcionamento da Menvo (texto fixo e base de
 * conhecimento). Somente leitura.
 * Não faz: acesso ao banco.
 */
import { defineCapability } from "../define"
import {
  explainHowItWorks,
  explainHowItWorksInput,
  searchKnowledgeBase,
  searchKnowledgeBaseInput
} from "@/lib/services/assistant/tools"

export const explainPlatformCapability = defineCapability({
  name: "platform.explain",
  toolName: "explainHowItWorks",
  title: "Explicar como funciona a Menvo",
  description: "Responde dúvidas sobre o funcionamento da plataforma Menvo",
  input: explainHowItWorksInput,
  audience: ["anonymous"],
  effect: "read",
  confirmation: "none",
  handler: (input) => explainHowItWorks(input)
})

export const searchKnowledgeBaseCapability = defineCapability({
  name: "kb.search",
  toolName: "searchKnowledgeBase",
  title: "Consultar base de conhecimento",
  description:
    "Consulta a base de conhecimento oficial da Menvo para responder dúvidas sobre regras, agendamentos, cancelamentos, faltas, certificados, conduta e funcionamento geral",
  input: searchKnowledgeBaseInput,
  audience: ["anonymous"],
  effect: "read",
  confirmation: "none",
  // Sem ator, o papel padrão é mentee (mesmo comportamento do assistente antigo).
  handler: (input, ctx) => searchKnowledgeBase(input, ctx.actor?.role ?? "mentee")
})
