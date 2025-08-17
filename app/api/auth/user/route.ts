import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      return NextResponse.json({ 
        error: "Erro ao obter usuário", 
        details: userError.message 
      })
    }

    if (!user) {
      return NextResponse.json({ 
        authenticated: false,
        message: "Usuário não autenticado" 
      })
    }

    // Buscar perfil
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        email_confirmed_at: user.email_confirmed_at,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at
      },
      profile: profile || null,
      profileError: profileError?.message || null
    })

  } catch (error) {
    return NextResponse.json({ 
      error: "Erro interno", 
      details: error instanceof Error ? error.message : "Erro desconhecido" 
    })
  }
}