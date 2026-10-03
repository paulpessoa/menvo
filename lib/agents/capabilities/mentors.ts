/**
 * Camada 14 · Capabilities (mentors)
 * Regra: descreve as ações de catálogo de mentores para agentes e delega a
 * `lib/services/assistant/tools` (que usa os services de mentores).
 * Não faz: regra de negócio nem acesso direto ao banco.
 */
import { defineCapability } from "../define"
import {
  searchMentors,
  searchMentorsInput,
  getMentorAvailability,
  getMentorAvailabilityInput
} from "@/lib/services/assistant/tools"

export const searchMentorsCapability = defineCapability({
  name: "mentors.search",
  toolName: "searchMentors",
  title: "Buscar Mentores",
  description: "Busca mentores no catálogo usando filtro por relevância e pesquisa (IA/semântico)",
  input: searchMentorsInput,
  audience: ["anonymous"],
  effect: "read",
  confirmation: "none",
  handler: (input, ctx) => searchMentors(ctx.supabase, input),
  present: {
    // MCP sempre devolveu o resultado inteiro (forLlm + forCard).
    mcp: (output) => output,
    // Assistente: só `forLlm` chega ao modelo; `forCard` vira o evento SSE
    // `mentors_found` e o modelo nunca o vê. Vazio => aviso anti-loop.
    assistant: (output) =>
      output.forLlm.length === 0
        ? {
            content:
              "RESULTADO VAZIO. AVISO DO SISTEMA: Não tente buscar novamente. Informe imediatamente ao usuário, em poucas palavras, que você não encontrou mentores para esse tema e sugira outras áreas da plataforma.",
            artifact: []
          }
        : { content: JSON.stringify(output.forLlm), artifact: output.forCard }
  }
})

export const mentorAvailabilityCapability = defineCapability({
  name: "mentors.availability",
  toolName: "getMentorAvailability",
  title: "Ver Disponibilidade do Mentor",
  description: "Retorna a agenda do mentor nos próximos dias usando o seu slug público",
  input: getMentorAvailabilityInput,
  audience: ["anonymous"],
  effect: "read",
  confirmation: "none",
  handler: (input, ctx) => getMentorAvailability(ctx.supabase, input),
  present: {
    mcp: (output) => output || { error: "Mentor not found" }
  }
})
