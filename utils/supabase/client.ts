import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/database"

let _client: ReturnType<typeof createBrowserClient<Database>> | null = null

export function createClient() {
  if (_client) return _client

  _client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        domain: '.menvo.com.br',
        path: '/',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 dias
      }
    }
  )
  return _client
}

export function isSupabaseConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}
