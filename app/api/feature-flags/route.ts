import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { DEFAULT_FLAGS } from "@/lib/feature-flags"
import type { Database } from "@/lib/types/supabase"

// Força a rota a ser dinâmica e não cacheada
export const dynamic = 'force-dynamic'
export const revalidate = 0

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  try {
    // Buscar flags do Banco de Dados
    const { data: dbFlags, error } = await supabase
      .from('feature_flags')
      .select('name, enabled')

    const flagsFromDB: Record<string, boolean> = {}
    
    if (dbFlags) {
      dbFlags.forEach(f => {
        if (f.name && f.enabled !== null) {
          flagsFromDB[f.name] = f.enabled
        }
      })
    }

    if (error) {
      console.warn("⚠️ [Flags] Erro ao buscar do banco:", error.message)
    }

    const mergedFlags = { ...DEFAULT_FLAGS, ...flagsFromDB }

    // Retorna com headers que proíbem cache em qualquer nível (Navegador, CDN, Vercel)
    return new NextResponse(JSON.stringify({
      flags: mergedFlags,
      source: dbFlags ? "database" : "default",
      timestamp: new Date().toISOString(),
    }), {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    console.error("❌ [Flags] Erro crítico:", error)
    return NextResponse.json({ flags: DEFAULT_FLAGS, error: "Critical error" })
  }
}
