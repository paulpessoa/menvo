import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"
import { getFeatureFlags } from "@/lib/feature-flags-server"
import { checkRateLimit } from "@/lib/rate-limit"
import { HumanMessage, AIMessage } from "@langchain/core/messages"
import { getAssistantAgent } from "@/lib/services/assistant/agent"

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const flags = await getFeatureFlags()
    if (!flags.ai_assistant_flag) {
      return NextResponse.json({ error: "Assistant is not enabled" }, { status: 403 })
    }

    const rateLimit = checkRateLimit(`assistant:${user.id}`, { maxRequests: 30, windowMs: 86400_000 })
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
    }

    const { message: userMessage, history = [] } = await req.json()
    if (!userMessage) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    // Instanciar agent via service
    const agent = getAssistantAgent(supabase)

    // Configurar Stream SSE Nativo do Next.js
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        let fullAiResponse = ""
        try {
          const pastMessages = history
            .filter((msg: any) => !msg.isStreaming && msg.text && msg.text.trim().length > 0)
            .map((msg: any) => 
              msg.role === "user" ? new HumanMessage(msg.text) : new AIMessage(msg.text)
            )

          const events = await agent.streamEvents(
            { messages: [...pastMessages, new HumanMessage(userMessage)] },
            { version: "v2", recursionLimit: 5 }
          )

          for await (const event of events) {
            // Emite o conteúdo gerado pelo modelo ao vivo (stream)
            if (event.event === "on_chat_model_stream") {
              const chunk = event.data.chunk
              if (chunk.content) {
                const text = chunk.content.toString()
                fullAiResponse += text
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "text", text })}\n\n`))
              }
            }
            
            // Informa ao frontend quando uma tool é chamada
            if (event.event === "on_tool_start") {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "tool_start", name: event.name })}\n\n`))
            }

            // Envia o payload completo dos mentores encontrados para renderizar o UI Card
            if (event.event === "on_tool_end" && event.name === "searchMentors") {
              const mentorsData = event.data.output
              if (mentorsData && Array.isArray(mentorsData)) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "mentors_found", mentors: mentorsData })}\n\n`))
              }
            }
          }

          // Salvar LOG no banco em background (Auditoria)
          supabase.from("assistant_conversations" as any).insert({
            user_id: user.id,
            user_message: userMessage,
            ai_response: fullAiResponse
          }).then(({ error }) => {
            if (error) console.error("Erro ao salvar log do assistente:", error)
          })

          controller.enqueue(encoder.encode("data: [DONE]\n\n"))
          controller.close()
        } catch (err: any) {
          console.error("Erro no stream do assistente:", err)
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", message: err.message })}\n\n`))
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: "Internal Server Error", details: err.message }, { status: 500 })
  }
}
