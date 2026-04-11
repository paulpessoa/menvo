import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function POST(request: NextRequest) {
  try {
    const { provider, userType, redirectTo } = await request.json()

    if (!provider || !["google", "linkedin_oidc"].includes(provider)) {
      return NextResponse.json({ error: "Provider inválido" }, { status: 400 })
    }

    if (!userType || !["mentee", "mentor"].includes(userType)) {
      return NextResponse.json({ error: "Tipo de usuário inválido" }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin.auth.signInWithOAuth({
      provider: provider as "google" | "linkedin_oidc",
      options: {
        redirectTo: redirectTo || `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        queryParams: {
          user_type: userType,
        },
      },
    })

    if (error) {
      console.error(`❌ Erro no OAuth ${provider}:`, error)
      return NextResponse.json({ error: "Erro na autenticação OAuth" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      url: data.url,
    })
  } catch (error) {
    console.error("💥 Erro interno no OAuth:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
