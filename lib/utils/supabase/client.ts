import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/lib/types/supabase"

// Singleton robusto para evitar "Multiple GoTrueClient instances"
// O Next.js às vezes recarrega módulos, o uso de uma variável global garante a persistência da instância.
declare global {
  interface Window {
    __supabase_client__?: ReturnType<typeof createBrowserClient<Database>>
  }
}

export function createClient() {
  // No servidor, sempre criar um novo (o Next.js cuida do ciclo de vida por request)
  if (typeof window === 'undefined') {
    return createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }

  // No navegador, usar o singleton global
  if (!window.__supabase_client__) {
    console.log('🛡️ [Supabase] Inicializando instância única do cliente...');
    window.__supabase_client__ = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookieOptions: {
          path: '/',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7,
        },
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true
        }
      }
    )
  }

  return window.__supabase_client__
}

export function isSupabaseConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}
