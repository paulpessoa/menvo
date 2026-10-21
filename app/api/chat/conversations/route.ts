import { NextResponse } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"
import { buildChatInboxService } from "@/lib/services/chat/chat-inbox.composition"

/**
 * GET /api/chat/conversations - inbox of the logged-in user. Replaces
 * `chatService.getConversations`, which ran from the browser and did one
 * profile query plus one unread-count query per conversation (N+1).
 * The user id comes from the session only, never from the request. Reads go
 * through the session client, so RLS still decides what is visible.
 */
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  try {
    const conversations = await buildChatInboxService(supabase).getConversations(user.id)
    return NextResponse.json({ conversations })
  } catch (error) {
    console.error("[CHAT] Erro ao listar conversas:", error)
    return NextResponse.json({ error: "Não foi possível carregar as conversas" }, { status: 500 })
  }
}
