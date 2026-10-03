/**
 * Camada 14 · Adapter MCP
 * Regra: registra no servidor MCP as capabilities que `exposure.mcp` libera,
 * chamando o handler com o client que a rota passar (anônimo, sujeito ao RLS).
 * Não faz: decidir o que é exposto (exposure.ts) nem rate limit (fica na rota,
 * porque depende do request HTTP).
 * Tradeoff: o SDK do MCP tipa `inputSchema` para outra versão do Zod, daí o
 * único cast deste arquivo; antes havia um `@ts-ignore` + `input: any` por tool.
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import type { createMcpHandler } from "mcp-handler"
import { capabilitiesFor } from "../exposure"
import { runCapability } from "../run"

type McpServer = Parameters<Parameters<typeof createMcpHandler>[0]>[0]

export function registerMcpCapabilities(server: McpServer, supabase: SupabaseClient): void {
  const register = server.registerTool.bind(server) as unknown as (
    name: string,
    config: { title: string; description: string; inputSchema: unknown },
    cb: (input: unknown) => Promise<unknown>
  ) => unknown

  for (const capability of capabilitiesFor("mcp", null)) {
    register(
      capability.toolName,
      {
        title: capability.title,
        description: capability.description,
        inputSchema: capability.input
      },
      async (input: unknown) => {
        const output = await runCapability(capability, input, { supabase, actor: null, surface: "mcp" })
        const payload = capability.present?.mcp ? capability.present.mcp(output) : output
        return { content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }] }
      }
    )
  }
}
