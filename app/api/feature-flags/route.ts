import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { DEFAULT_FLAGS } from "@/lib/feature-flags"
import type { Database } from "@/lib/types/supabase"

export const dynamic = 'force-dynamic'

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
    
    // Mapeamento Direto: O nome no Banco deve ser igual ao nome no Frontend
    // Padrão solicitado: waiting_list_flag, new_mentorship_flag, feedback_app_flag, maintenance_mode_flag
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

    // 2. Mesclar: Banco de Dados > Defaults Fixos
    const mergedFlags = { ...DEFAULT_FLAGS, ...flagsFromDB }

    return NextResponse.json({
      flags: mergedFlags,
      source: dbFlags ? "database" : "default",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ [Flags] Erro crítico:", error)
    
    return NextResponse.json({
      flags: DEFAULT_FLAGS,
      source: "error",
      error: "Failed to fetch feature flags",
      timestamp: new Date().toISOString(),
    })
  }
}
