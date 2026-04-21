import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/lib/types/supabase"

let _client: ReturnType<typeof createBrowserClient<Database>> | null = null

export function createClient() {
  if (_client) return _client

  _client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        path: '/',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        // REMOVIDO: domain hardcoded para deixar o browser decidir (resolve conflitos www)
      }
    }
  )
  return _client
}

export function isSupabaseConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}
