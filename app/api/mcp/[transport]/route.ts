import { NextRequest, NextResponse } from "next/server"
import { createMcpHandler } from "mcp-handler"
import { createClient } from "@supabase/supabase-js"
import { checkRateLimit } from "@/lib/rate-limit"
import { 
  assistantTools, 
  searchMentorsInput, 
  getMentorAvailabilityInput, 
  explainHowItWorksInput 
} from "@/lib/services/assistant/tools"

const mcpHandler = createMcpHandler((server) => {
  // Inicialização do cliente Supabase para acesso às tools que precisam de BD.
  // Chave anônima para que o RLS controle os dados (só dados públicos).
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  server.registerTool(
    "searchMentors",
    {
      title: "Buscar Mentores",
      description: "Busca mentores no catálogo usando filtro por relevância e pesquisa (IA/semântico)",
      // @ts-ignore: Zod and StandardSchema conflict
      inputSchema: searchMentorsInput
    },
    async (input: any) => {
      const mentors = await assistantTools.searchMentors(supabase, input)
      return { content: [{ type: "text", text: JSON.stringify(mentors, null, 2) }] }
    }
  )

  server.registerTool(
    "getMentorAvailability",
    {
      title: "Ver Disponibilidade do Mentor",
      description: "Retorna a agenda do mentor nos próximos dias usando o seu slug público",
      // @ts-ignore: Zod and StandardSchema conflict
      inputSchema: getMentorAvailabilityInput
    },
    async (input: any) => {
      const slots = await assistantTools.getMentorAvailability(supabase, input)
      return { content: [{ type: "text", text: JSON.stringify(slots || { error: "Mentor not found" }, null, 2) }] }
    }
  )

  server.registerTool(
    "explainHowItWorks",
    {
      title: "Explicar como funciona a Menvo",
      description: "Responde dúvidas sobre o funcionamento da plataforma Menvo",
      // @ts-ignore: Zod and StandardSchema conflict
      inputSchema: explainHowItWorksInput
    },
    async (input: any) => {
      const explain = assistantTools.explainHowItWorks(input)
      return { content: [{ type: "text", text: JSON.stringify(explain, null, 2) }] }
    }
  )
}, {
  serverInfo: {
    name: "menvo-mcp",
    version: "1.0.0"
  }
})

// O mcp-handler serve tanto MCP clássico (SSE) quanto Streamable HTTP.
async function handler(req: NextRequest) {
  // Rate Limit por IP (60 requisições por minuto, conforme SPEC)
  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1"
  const rateLimit = checkRateLimit(`mcp:${ip}`, { maxRequests: 60, windowMs: 60_000 })
  
  if (!rateLimit.allowed) {
    return new NextResponse(
      JSON.stringify({ error: "Rate limit exceeded for MCP" }), 
      { status: 429, headers: { "Content-Type": "application/json" } }
    )
  }

  // Se tudo certo, repassa para o Web-Standard Request Handler do pacote oficial
  return mcpHandler(req)
}

export const GET = handler
export const POST = handler
export const DELETE = handler
export const runtime = "nodejs"
