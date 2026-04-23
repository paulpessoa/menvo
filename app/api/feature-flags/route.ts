import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Usar Service Role para garantir leitura das flags mesmo que RLS esteja restritivo (opcional)
// Aqui usaremos o anon key + RLS public read que configuramos
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Default feature flags (fallbacks se não estiver no banco)
const DEFAULT_FLAGS: Record<string, boolean> = {
  waitingListEnabled: process.env.NEXT_PUBLIC_FEATURE_WAITING_LIST === "true",
  feedbackEnabled: process.env.NEXT_PUBLIC_FEATURE_FEEDBACK !== "false",
  maintenanceMode: process.env.NEXT_PUBLIC_FEATURE_MAINTENANCE_MODE === "true",
  newUserRegistration: process.env.NEXT_PUBLIC_FEATURE_NEW_USER_REGISTRATION !== "false",
  mentorVerification: process.env.NEXT_PUBLIC_FEATURE_MENTOR_VERIFICATION !== "false",
  NEW_MENTORSHIP_UX: process.env.NEXT_PUBLIC_FEATURE_NEW_UX === "true"
}

export async function GET() {
  try {
    // 1. Buscar flags do Banco de Dados (Tempo Real)
    const { data: dbFlags, error } = await supabase
      .from('feature_flags')
      .select('name, enabled')

    const flagsFromDB: Record<string, boolean> = {}
    if (dbFlags) {
      dbFlags.forEach(f => {
        flagsFromDB[f.name] = f.enabled
      })
    }

    if (error) {
      console.warn("⚠️ [Flags] Erro ao buscar do banco, usando fallback:", error.message)
    }

    // 2. Mesclar: Banco de Dados > Variáveis de Ambiente > Defaults
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
