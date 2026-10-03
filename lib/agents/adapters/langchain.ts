/**
 * Camada 14 · Adapter LangChain
 * Regra: transforma as capabilities que a superfície `assistant` libera para
 * este ator em `tool()` do LangChain. O papel é filtrado por `capabilitiesFor`,
 * não por `if (role === ...)` no agente.
 * Não faz: montar prompt nem escolher modelo (isso é `lib/services/assistant/agent.ts`).
 * Tradeoff: o schema vai como está (Zod); o modelo só vê `description` e os
 * campos `.describe()` dele.
 */
import { tool } from "@langchain/core/tools"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Actor } from "../define"
import { capabilitiesFor } from "../exposure"
import { runCapability } from "../run"

export function toLangChainTools(supabase: SupabaseClient, actor: Actor | null) {
  return capabilitiesFor("assistant", actor).map((capability) => {
    const run = (input: unknown) =>
      runCapability(capability, input, { supabase, actor, surface: "assistant" })

    // Escrita: o agente só propõe. O handler NÃO roda aqui; o artifact vira o
    // evento SSE `confirm_action` e a execução fica com o clique do usuário
    // (POST /api/assistant/confirm -> lib/agents/confirm.ts). O texto abaixo
    // impede o modelo de afirmar que já foi salvo.
    if (capability.confirmation === "user") {
      return tool(
        async (input: unknown) => [
          "PROPOSTA ENVIADA. Nada foi registrado ainda: o usuário precisa tocar em Confirmar no cartão que apareceu na tela. Diga isso em uma frase curta, NÃO afirme que foi salvo e NÃO chame esta ferramenta de novo.",
          {
            capability: capability.name,
            title: capability.title,
            summary: capability.summarize ? capability.summarize(input) : capability.title,
            input
          }
        ],
        {
          name: capability.toolName,
          description: capability.description,
          schema: capability.input,
          responseFormat: "content_and_artifact"
        }
      )
    }

    if (capability.present?.assistant) {
      const present = capability.present.assistant
      return tool(
        async (input: unknown) => {
          const { content, artifact } = present(await run(input))
          return [content, artifact]
        },
        {
          name: capability.toolName,
          description: capability.description,
          schema: capability.input,
          responseFormat: "content_and_artifact"
        }
      )
    }

    return tool(async (input: unknown) => JSON.stringify(await run(input)), {
      name: capability.toolName,
      description: capability.description,
      schema: capability.input
    })
  })
}
