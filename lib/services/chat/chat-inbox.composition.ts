import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"
import { createChatRepository } from "@/lib/repositories/chat.repository"
import { createChatInboxService } from "./chat-inbox.service"

/**
 * Liga o service ao repository com o client DA SESSÃO (RLS), para as rotas
 * `GET /api/chat/*`. Fica separado do service para ele não importar o Supabase.
 */
export function buildChatInboxService(db: SupabaseClient<Database>) {
  return createChatInboxService(createChatRepository(db))
}
