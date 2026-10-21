import { NextResponse } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"
import { buildChatInboxService } from "@/lib/services/chat/chat-inbox.composition"

/**
 * GET /api/chat/unread-count - unread messages from other people across the
 * caller's conversations (header badge). User id comes from the session only.
 */
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  try {
    const count = await buildChatInboxService(supabase).getUnreadCount(user.id)
    return NextResponse.json({ count })
  } catch (error) {
    console.error("[CHAT] Erro ao contar não lidas:", error)
    return NextResponse.json({ error: "Não foi possível contar as mensagens" }, { status: 500 })
  }
}
