import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/database"

let _client: ReturnType<typeof createBrowserClient<Database>> | null = null

export function createClient() {
  if (_client) return _client

  _client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Forçamos o domínio e o caminho para garantir que o PKCE funcione no www e non-www
        name: 'menvo-auth-token',
        lifetime: 60 * 60 * 24 * 7, // 7 dias
        domain: '.menvo.com.br', // O ponto no início permite que funcione em subdomínios (www)
        path: '/',
        sameSite: 'lax',
      }
    }
  )
  return _client
}

export function isSupabaseConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}
