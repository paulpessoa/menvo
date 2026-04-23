
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { DEFAULT_FLAGS } from "@/lib/constants/feature-flags"
import type { Database } from "@/lib/types/supabase"

// Usar chaves de ambiente para o cliente Supabase interno
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  try {
    // 1. Buscar flags do Banco de Dados (Tempo Real)
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
      console.warn("⚠️ [Flags] Erro ao buscar do banco, usando fallback:", error.message)
    }

    // 2. Mesclar: Banco de Dados > Variáveis de Ambiente (via DEFAULT_FLAGS)
    const mergedFlags = { ...DEFAULT_FLAGS, ...flagsFromDB }

    return NextResponse.json({
      flags: mergedFlags,
      source: dbFlags ? "database" : "environment-variables",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ [Flags] Erro crítico:", error)
    
    return NextResponse.json({
      flags: DEFAULT_FLAGS,
      source: "default",
      error: "Failed to fetch feature flags",
      timestamp: new Date().toISOString(),
    })
  }
}
