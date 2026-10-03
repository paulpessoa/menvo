import { NextRequest, NextResponse } from "next/server"
import { createMcpHandler } from "mcp-handler"
import { createClient } from "@supabase/supabase-js"
import { checkRateLimit } from "@/lib/rate-limit"
import { registerMcpCapabilities } from "@/lib/agents/adapters/mcp"

const mcpHandler = createMcpHandler((server) => {
  // Inicialização do cliente Supabase para acesso às tools que precisam de BD.
  // Chave anônima para que o RLS controle os dados (só dados públicos).
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // O que o MCP público expõe é decidido em lib/agents/exposure.ts (só leitura).
  registerMcpCapabilities(server, supabase)
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
